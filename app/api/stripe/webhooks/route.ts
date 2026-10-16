import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import Stripe from "stripe";
import { stripe, APP_URL } from "@/lib/stripe";
import prisma from "@/lib/prisma";
import { sendHomeownerOnboardingLink, sendPurchaseReceipt } from "@/lib/emails/purchase";
import { sendGiftInvitation } from "@/lib/emails/gift";
import { trackEvent } from "@/lib/analytics";
import { sendWithRetry } from "@/lib/email-retry";
import { Prisma } from "@prisma/client";
import { revokeEntitlementsAndInvalidateUnredeemedTokensForPurchase } from "@/lib/entitlements";

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  let event: Stripe.Event;

  if (process.env.STRIPE_WEBHOOK_SECRET && sig) {
    try {
      event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error("[stripe webhook] signature verification failed", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  } else {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 400 });
  }

  // Idempotency: claim this Stripe event id. A repeat or concurrent delivery hits the
  // primary key and is acknowledged without being processed twice.
  try {
    await prisma.stripeEvent.create({ data: { id: event.id, type: event.type } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error("[stripe webhook] could not record event id", event.id, err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const productType = session.metadata?.productType;

      if (productType === "HOMEOWNER") {
        const purchaseId = session.metadata?.purchaseId;
        if (!purchaseId) {
          return NextResponse.json({ error: "Missing purchaseId" }, { status: 400 });
        }

        const purchase = await prisma.purchase.findUnique({
          where: { id: purchaseId },
        });

        if (!purchase || purchase.status !== "PENDING") {
          return NextResponse.json({ received: true }, { status: 200 });
        }

        const email =
          session.customer_email ||
          (session.customer_details?.email ?? "");

        const onboardingToken = await prisma.$transaction(async (tx) => {
          await tx.purchase.update({
            where: { id: purchase.id },
            data: {
              status: "SUCCEEDED",
              stripePaymentIntentId: (session.payment_intent as string) || null,
              stripeCustomerId: (session.customer as string) || null,
            },
          });

          return tx.onboardingToken.create({
            data: {
              purchaseId: purchase.id,
              token: randomUUID(),
              email,
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          });
        });

        await trackEvent({
          event: "purchase_completed",
          userId: purchase.userId ?? undefined,
          anonymousId: session.metadata?.anonymousId,
          properties: {
            productType: "HOMEOWNER",
            purchaseId: purchase.id,
            amount: purchase.amount,
            source: session.metadata?.source ?? "unknown",
          },
        });

        if (!email) {
          console.error("[stripe webhook] no customer email on completed session", { purchaseId: purchase.id });
        }
        await sendWithRetry("onboarding_link", { purchaseId: purchase.id, eventId: event.id }, () =>
          sendHomeownerOnboardingLink({
            to: email,
            token: onboardingToken.token,
            appUrl: APP_URL,
          })
        );
        await sendWithRetry("purchase_receipt", { purchaseId: purchase.id, eventId: event.id }, () =>
          sendPurchaseReceipt({
            to: email,
            amount: purchase.amount,
            product: "New Home Warranty HQ",
          })
        );
      }

      if (productType === "GIFT") {
        const giftPurchaseId = session.metadata?.giftPurchaseId;
        if (!giftPurchaseId) {
          return NextResponse.json({ error: "Missing giftPurchaseId" }, { status: 400 });
        }

        const giftPurchase = await prisma.giftPurchase.findUnique({
          where: { id: giftPurchaseId },
          include: { purchase: true, partner: { include: { partnerProfile: true } } },
        });

        if (!giftPurchase || giftPurchase.status !== "PENDING") {
          return NextResponse.json({ received: true }, { status: 200 });
        }

        const onboardingToken = await prisma.$transaction(async (tx) => {
          await tx.purchase.update({
            where: { id: giftPurchase.purchaseId },
            data: {
              status: "SUCCEEDED",
              stripePaymentIntentId: (session.payment_intent as string) || null,
              stripeCustomerId: (session.customer as string) || null,
            },
          });

          await tx.giftPurchase.update({
            where: { id: giftPurchase.id },
            data: { status: "PAID" },
          });

          return tx.onboardingToken.create({
            data: {
              purchaseId: giftPurchase.purchaseId,
              giftPurchaseId: giftPurchase.id,
              token: randomUUID(),
              email: giftPurchase.recipientEmail,
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          });
        });

        await trackEvent({
          event: "purchase_completed",
          userId: giftPurchase.partnerId,
          anonymousId: session.metadata?.anonymousId,
          properties: {
            productType: "GIFT",
            purchaseId: giftPurchase.purchaseId,
            amount: giftPurchase.purchase.amount,
            source: session.metadata?.source ?? "unknown",
          },
        });

        await sendWithRetry(
          "gift_invitation",
          { purchaseId: giftPurchase.purchaseId, giftPurchaseId: giftPurchase.id, eventId: event.id },
          () =>
            sendGiftInvitation({
              to: giftPurchase.recipientEmail,
              buyerName: giftPurchase.partner.name,
              buyerCompany: giftPurchase.partner.partnerProfile?.company ?? null,
              giftMessage: giftPurchase.giftMessage,
              redemptionUrl: `${APP_URL}/onboarding?token=${onboardingToken.token}`,
            })
        );
      }
    }

    if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      const purchases = await prisma.purchase.findMany({
        where: { stripePaymentIntentId: charge.payment_intent as string },
      });
      // Only a full refund revokes access; a partial refund records the amount and keeps access.
      const isFullRefund =
        charge.refunded === true || (charge.amount > 0 && (charge.amount_refunded ?? 0) >= charge.amount);
      for (const purchase of purchases) {
        await prisma.purchase.update({
          where: { id: purchase.id },
          data: {
            status: isFullRefund ? "REFUNDED" : "PARTIALLY_REFUNDED",
            refundedAt: new Date(),
            refundAmount: charge.amount_refunded ?? purchase.amount,
          },
        });
        if (isFullRefund) {
          await revokeEntitlementsAndInvalidateUnredeemedTokensForPurchase(purchase.id);
        }
      }
    }

    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const sessions = await stripe.checkout.sessions.list({
        payment_intent: paymentIntent.id,
        limit: 1,
      });
      const session = sessions.data[0];
      if (session) {
        await prisma.purchase.updateMany({
          where: { stripeCheckoutSessionId: session.id, status: "PENDING" },
          data: { status: "FAILED" },
        });
      }
      // Fallback for sessions where payment_intent is not yet linked.
      await prisma.purchase.updateMany({
        where: { stripePaymentIntentId: paymentIntent.id, status: "PENDING" },
        data: { status: "FAILED" },
      });
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      const purchaseId = session.metadata?.purchaseId;
      if (purchaseId) {
        await prisma.purchase.updateMany({
          where: { id: purchaseId, status: "PENDING" },
          data: { status: "FAILED" },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[stripe webhook] processing error", event.id, err);
    // Release the idempotency claim so Stripe's retry can process the event again.
    await prisma.stripeEvent.delete({ where: { id: event.id } }).catch(() => {});
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

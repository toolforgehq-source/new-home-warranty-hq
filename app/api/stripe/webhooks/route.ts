import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import Stripe from "stripe";
import { stripe, APP_URL } from "@/lib/stripe";
import prisma from "@/lib/prisma";
import { sendHomeownerOnboardingLink, sendPurchaseReceipt } from "@/lib/emails/purchase";
import { sendGiftInvitation } from "@/lib/emails/gift";

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

        await sendPurchaseReceipt({
          to: email,
          amount: purchase.amount,
          product: "New Home Warranty HQ",
        });

        await sendHomeownerOnboardingLink({
          to: email,
          token: onboardingToken.token,
          appUrl: APP_URL,
        });
      }

      if (productType === "GIFT") {
        const giftPurchaseId = session.metadata?.giftPurchaseId;
        if (!giftPurchaseId) {
          return NextResponse.json({ error: "Missing giftPurchaseId" }, { status: 400 });
        }

        const giftPurchase = await prisma.giftPurchase.findUnique({
          where: { id: giftPurchaseId },
          include: { purchase: true, partner: true },
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

        await sendGiftInvitation({
          to: giftPurchase.recipientEmail,
          buyerName: giftPurchase.partner.name,
          buyerCompany: null,
          redemptionUrl: `${APP_URL}/onboarding?token=${onboardingToken.token}`,
        });
      }
    }

    if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      await prisma.purchase.updateMany({
        where: { stripePaymentIntentId: charge.payment_intent as string },
        data: { status: "REFUNDED", refundedAt: new Date() },
      });
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
    console.error("[stripe webhook] processing error", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

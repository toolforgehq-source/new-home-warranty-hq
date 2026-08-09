import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const sig = request.headers.get("stripe-signature");

  let event: any;

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
      const session = event.data.object as any;
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

        await prisma.$transaction(async (tx) => {
          await tx.purchase.update({
            where: { id: purchase.id },
            data: {
              status: "SUCCEEDED",
              stripePaymentIntentId: (session.payment_intent as string) || null,
              stripeCustomerId: (session.customer as string) || null,
            },
          });

          await tx.onboardingToken.create({
            data: {
              purchaseId: purchase.id,
              token: randomUUID(),
              email,
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          });
        });
      }

      if (productType === "GIFT") {
        const giftPurchaseId = session.metadata?.giftPurchaseId;
        if (!giftPurchaseId) {
          return NextResponse.json({ error: "Missing giftPurchaseId" }, { status: 400 });
        }

        const giftPurchase = await prisma.giftPurchase.findUnique({
          where: { id: giftPurchaseId },
          include: { purchase: true },
        });

        if (!giftPurchase || giftPurchase.status !== "PENDING") {
          return NextResponse.json({ received: true }, { status: 200 });
        }

        await prisma.$transaction(async (tx) => {
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

          await tx.onboardingToken.create({
            data: {
              purchaseId: giftPurchase.purchaseId,
              giftPurchaseId: giftPurchase.id,
              token: randomUUID(),
              email: giftPurchase.recipientEmail,
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          });
        });
      }
    }

    if (event.type === "charge.refunded") {
      const charge = event.data.object as any;
      await prisma.purchase.updateMany({
        where: { stripePaymentIntentId: charge.payment_intent as string },
        data: { status: "REFUNDED", refundedAt: new Date() },
      });
    }

    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as any;
      await prisma.purchase.updateMany({
        where: { stripePaymentIntentId: paymentIntent.id },
        data: { status: "FAILED" },
      });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[stripe webhook] processing error", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

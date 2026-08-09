import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { stripe, STRIPE_PRICE_HOMEOWNER, STRIPE_PRICE_GIFT, APP_URL } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !STRIPE_PRICE_HOMEOWNER || !STRIPE_PRICE_GIFT) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  const body = (await request.json()) as {
    product: "homeowner" | "gift";
    recipientName?: string;
    recipientEmail?: string;
    propertyAddress?: string;
    giftMessage?: string;
  };

  if (!body.product || !["homeowner", "gift"].includes(body.product)) {
    return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  }

  const session = await auth.api.getSession({ headers: await headers() });

  try {
    if (body.product === "homeowner") {
      const purchase = await prisma.purchase.create({
        data: {
          userId: session?.user?.id,
          productType: "HOMEOWNER",
          amount: 18900,
          currency: "usd",
          taxBehavior: process.env.STRIPE_TAX_BEHAVIOR ?? "exclusive",
          status: "PENDING",
        },
      });

      const stripeSession = await stripe.checkout.sessions.create({
        line_items: [{ price: STRIPE_PRICE_HOMEOWNER, quantity: 1 }],
        mode: "payment",
        success_url: `${APP_URL}/onboarding?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${APP_URL}/#pricing`,
        client_reference_id: purchase.id,
        metadata: { productType: "HOMEOWNER", purchaseId: purchase.id },
        automatic_tax:
          process.env.STRIPE_TAX_BEHAVIOR === "automatic_tax"
            ? { enabled: true }
            : undefined,
      });

      await prisma.purchase.update({
        where: { id: purchase.id },
        data: { stripeCheckoutSessionId: stripeSession.id },
      });

      return NextResponse.json({ checkoutUrl: stripeSession.url });
    }

    // gift
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to send a gift" },
        { status: 401 }
      );
    }

    if (!body.recipientName || !body.recipientEmail) {
      return NextResponse.json(
        { error: "Recipient name and email are required" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.create({
        data: {
          userId: session.user.id,
          productType: "GIFT",
          amount: 12400,
          currency: "usd",
          taxBehavior: process.env.STRIPE_TAX_BEHAVIOR ?? "exclusive",
          status: "PENDING",
        },
      });

      const giftPurchase = await tx.giftPurchase.create({
        data: {
          partnerId: session.user.id,
          purchaseId: purchase.id,
          recipientName: body.recipientName as string,
          recipientEmail: body.recipientEmail as string,
          propertyAddress: body.propertyAddress,
          giftMessage: body.giftMessage,
          status: "PENDING",
        },
      });

      return { purchase, giftPurchase };
    });

    const stripeSession = await stripe.checkout.sessions.create({
      line_items: [{ price: STRIPE_PRICE_GIFT, quantity: 1 }],
      mode: "payment",
      success_url: `${APP_URL}/partner/gifts/success`,
      cancel_url: `${APP_URL}/#pricing`,
      client_reference_id: result.giftPurchase.id,
      metadata: {
        productType: "GIFT",
        purchaseId: result.purchase.id,
        giftPurchaseId: result.giftPurchase.id,
      },
      automatic_tax:
        process.env.STRIPE_TAX_BEHAVIOR === "automatic_tax"
          ? { enabled: true }
          : undefined,
    });

    await prisma.purchase.update({
      where: { id: result.purchase.id },
      data: { stripeCheckoutSessionId: stripeSession.id },
    });

    return NextResponse.json({ checkoutUrl: stripeSession.url });
  } catch (err) {
    console.error("[checkout error]", err);
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { trackEvent } from "@/lib/analytics";
import { SOURCE_COOKIE, VISITOR_COOKIE } from "@/lib/funnel";
import { z } from "zod";
import { isStripeConfigured, stripe, STRIPE_PRICE_HOMEOWNER, STRIPE_PRICE_GIFT, checkStripeModeConsistency } from "@/lib/stripe";
import { rateLimit } from "@/lib/rate-limit";

const checkoutSchema = z.object({
  product: z.enum(["homeowner", "gift"]),
  recipientName: z.string().trim().min(1).max(200).optional(),
  recipientEmail: z.string().trim().email().max(320).optional(),
  propertyAddress: z.string().trim().max(500).optional(),
  giftMessage: z.string().trim().max(2000).optional(),
});

export async function POST(request: NextRequest) {
  const origin = request.nextUrl.origin;
  if (!isStripeConfigured() || !stripe) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  checkStripeModeConsistency();

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { ok } = await rateLimit("checkout", ip, 10, 60);
  if (!ok) {
    return NextResponse.json({ error: "Too many requests. Please try again in a minute." }, { status: 429 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    return NextResponse.json(
      { error: field === "product" || field === undefined ? "Invalid product" : `Invalid ${String(field)}` },
      { status: 400 }
    );
  }
  const body = parsed.data;

  const session = await auth.api.getSession({ headers: await headers() });
  const anonymousId = request.cookies.get(VISITOR_COOKIE)?.value;
  const source = request.cookies.get(SOURCE_COOKIE)?.value ?? "direct";
  const attribution = { source, ...(anonymousId && { anonymousId }) };

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
        success_url: `${origin}/onboarding?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/#pricing`,
        client_reference_id: purchase.id,
        metadata: { productType: "HOMEOWNER", purchaseId: purchase.id, ...attribution },
        automatic_tax:
          process.env.STRIPE_TAX_BEHAVIOR === "automatic_tax"
            ? { enabled: true }
            : undefined,
        managed_payments: { enabled: false },
      });

      await prisma.purchase.update({
        where: { id: purchase.id },
        data: { stripeCheckoutSessionId: stripeSession.id },
      });

      await trackEvent({
        event: "checkout_started",
        userId: session?.user?.id,
        anonymousId,
        properties: { productType: "HOMEOWNER", purchaseId: purchase.id, source },
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
      success_url: `${origin}/partner/dashboard?gift=success`,
      cancel_url: `${origin}/partner/dashboard`,
      client_reference_id: result.giftPurchase.id,
      metadata: {
        productType: "GIFT",
        purchaseId: result.purchase.id,
        giftPurchaseId: result.giftPurchase.id,
        ...attribution,
      },
      automatic_tax:
        process.env.STRIPE_TAX_BEHAVIOR === "automatic_tax"
          ? { enabled: true }
          : undefined,
      managed_payments: { enabled: false },
    });

    await prisma.purchase.update({
      where: { id: result.purchase.id },
      data: { stripeCheckoutSessionId: stripeSession.id },
    });

    await trackEvent({
      event: "checkout_started",
      userId: session.user.id,
      anonymousId,
      properties: { productType: "GIFT", purchaseId: result.purchase.id, source },
    });

    return NextResponse.json({ checkoutUrl: stripeSession.url });
  } catch (err) {
    console.error("[checkout error]", err);
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

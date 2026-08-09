"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { trackEvent } from "@/lib/analytics";
import { logAudit } from "@/lib/audit";
import { stripe } from "@/lib/stripe";

export async function processRefund(
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  const purchaseId = formData.get("purchaseId") as string;
  const reason = (formData.get("reason") as string)?.trim();

  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
  });

  if (!purchase) return { error: "Purchase not found" };
  if (purchase.status === "REFUNDED") return { error: "Already refunded" };
  if (!purchase.stripePaymentIntentId) {
    return { error: "No Stripe payment intent on this purchase" };
  }

  if (process.env.STRIPE_SECRET_KEY) {
    try {
      await stripe.refunds.create({
        payment_intent: purchase.stripePaymentIntentId,
        reason: "requested_by_customer",
        metadata: { reason: reason || "" },
      });
    } catch (err) {
      console.error("[refund] Stripe refund failed", err);
      const message = err instanceof Error ? err.message : String(err);
      return { error: `Stripe refund failed: ${message}` };
    }
  }

  await prisma.purchase.update({
    where: { id: purchase.id },
    data: { status: "REFUNDED", refundedAt: new Date(), refundAmount: purchase.amount },
  });

  await trackEvent({ event: "refund_processed", userId: session.user.id, properties: { purchaseId: purchase.id, amount: purchase.amount } });
  await logAudit({ actorId: session.user.id, action: "REFUND_PROCESSED", entityType: "Purchase", entityId: purchase.id });

  return { ok: true };
}

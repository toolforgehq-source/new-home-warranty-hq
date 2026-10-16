import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const stripe: Stripe | null = stripeSecretKey?.startsWith("sk_")
  ? new Stripe(stripeSecretKey, { typescript: true })
  : null;

export function isStripeConfigured() {
  return (
    stripeSecretKey?.startsWith("sk_") &&
    (process.env.STRIPE_PRICE_HOMEOWNER ?? "").startsWith("price_") &&
    (process.env.STRIPE_PRICE_GIFT ?? "").startsWith("price_")
  );
}

export const STRIPE_PRICE_HOMEOWNER = process.env.STRIPE_PRICE_HOMEOWNER ?? "";
export const STRIPE_PRICE_GIFT = process.env.STRIPE_PRICE_GIFT ?? "";

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

/**
 * Logs (never throws) when the Stripe secret key mode disagrees with the
 * configured price IDs, or the webhook secret is missing. Price IDs do not carry
 * a mode prefix, so the real check is a cheap read of each price's `livemode`.
 * Called once per server instance from the checkout route.
 */
let modeCheckStarted = false;
export function checkStripeModeConsistency(): void {
  if (modeCheckStarted || !stripe || !stripeSecretKey) return;
  modeCheckStarted = true;
  const keyIsLive = stripeSecretKey.startsWith("sk_live_") || stripeSecretKey.startsWith("rk_live_");
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("[stripe config] STRIPE_WEBHOOK_SECRET is not set: payments will not be fulfilled.");
  }
  for (const [name, id] of [
    ["STRIPE_PRICE_HOMEOWNER", STRIPE_PRICE_HOMEOWNER],
    ["STRIPE_PRICE_GIFT", STRIPE_PRICE_GIFT],
  ] as const) {
    if (!id) continue;
    stripe.prices
      .retrieve(id)
      .then((price) => {
        if (price.livemode !== keyIsLive) {
          console.error(
            `[stripe config] MODE MISMATCH: STRIPE_SECRET_KEY is ${keyIsLive ? "LIVE" : "TEST"} but ${name} (${id}) is a ${price.livemode ? "LIVE" : "TEST"} price. Checkout will fail.`
          );
        }
      })
      .catch((err) => {
        console.error(
          `[stripe config] Could not load ${name} (${id}) with the configured key. It likely belongs to the other mode (test vs live).`,
          err instanceof Error ? err.message : err
        );
      });
  }
}

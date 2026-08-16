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

import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  typescript: true,
});

export const STRIPE_PRICE_HOMEOWNER = process.env.STRIPE_PRICE_HOMEOWNER ?? "";
export const STRIPE_PRICE_GIFT = process.env.STRIPE_PRICE_GIFT ?? "";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

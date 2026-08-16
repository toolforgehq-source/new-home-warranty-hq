import Stripe from "stripe";
import { config } from "dotenv";

config();

const secret = process.env.STRIPE_SECRET_KEY;
if (!secret) throw new Error("STRIPE_SECRET_KEY missing");

const stripe = new Stripe(secret, { typescript: true });

async function getOrCreatePrice(name, amount) {
  const products = await stripe.products.list({ limit: 100 });
  let product = products.data.find((p) => p.name === name);
  if (!product) {
    product = await stripe.products.create({ name, metadata: { app: "nhwhq" } });
  }
  const prices = await stripe.prices.list({ product: product.id, limit: 100 });
  const existing = prices.data.find(
    (p) => p.unit_amount === amount && p.currency === "usd" && p.active
  );
  if (existing) return existing.id;
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: amount,
    currency: "usd",
  });
  return price.id;
}

async function setupWebhook(webhookUrl) {
  if (!webhookUrl) return null;
  const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
  const existing = endpoints.data.find((ep) => ep.url === webhookUrl);
  if (existing) return existing.secret;
  const ep = await stripe.webhookEndpoints.create({
    url: webhookUrl,
    enabled_events: [
      "checkout.session.completed",
      "payment_intent.payment_failed",
      "charge.refunded",
    ],
  });
  return ep.secret;
}

async function main() {
  const homeownerPriceId = await getOrCreatePrice(
    "New Home Warranty HQ — Homeowner",
    18900
  );
  const giftPriceId = await getOrCreatePrice(
    "New Home Warranty HQ — Partner Gift",
    12400
  );
  console.log(`STRIPE_PRICE_HOMEOWNER=${homeownerPriceId}`);
  console.log(`STRIPE_PRICE_GIFT=${giftPriceId}`);

  const webhookUrl = process.env.STRIPE_WEBHOOK_URL;
  if (webhookUrl) {
    const webhookSecret = await setupWebhook(webhookUrl);
    console.log(`STRIPE_WEBHOOK_SECRET=${webhookSecret}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import Stripe from "stripe";
import { config } from "dotenv";

config();

const secret = process.env.STRIPE_SECRET_KEY;
if (!secret) throw new Error("STRIPE_SECRET_KEY missing");
const stripe = new Stripe(secret, { typescript: true });

const oldUrl = process.env.OLD_WEBHOOK_URL;
const newUrl = process.env.NEW_WEBHOOK_URL;
if (!oldUrl || !newUrl) throw new Error("OLD_WEBHOOK_URL and NEW_WEBHOOK_URL required");

const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
const ep = endpoints.data.find((e) => e.url === oldUrl);
if (!ep) {
  console.log("No existing endpoint found; creating new one");
  const created = await stripe.webhookEndpoints.create({
    url: newUrl,
    enabled_events: ["checkout.session.completed", "payment_intent.payment_failed", "charge.refunded"],
  });
  console.log(`Created ${created.id}`);
} else {
  await stripe.webhookEndpoints.update(ep.id, { url: newUrl });
  console.log(`Updated ${ep.id} to ${newUrl}`);
}

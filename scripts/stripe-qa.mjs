import { config } from "dotenv";
config();

import { PrismaClient } from "@prisma/client";

const API_BASE = process.env.QA_API_BASE;
if (!API_BASE) throw new Error("QA_API_BASE required");

const stripeSecret = process.env.STRIPE_SECRET_KEY;
if (!stripeSecret) throw new Error("STRIPE_SECRET_KEY required");

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET required");

const Stripe = (await import("stripe")).default;
const stripe = new Stripe(stripeSecret, { typescript: true });
const prisma = new PrismaClient();

const testEmail = (prefix) => `${prefix}-${Date.now()}@example.com`;

async function postJson(path, body, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...opts.headers },
    body: JSON.stringify(body),
    redirect: "manual",
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: res.status, headers: res.headers, json, text };
}

function cookieHeader(setCookies) {
  if (!setCookies) return "";
  const arr = Array.isArray(setCookies) ? setCookies : [setCookies];
  return arr.map((c) => c.split(";")[0]).join("; ");
}

async function signUpPartner() {
  const email = testEmail("partner");
  const password = "TestPassword123!";
  const res = await postJson("/api/auth/sign-up/email", {
    name: "QA Partner",
    email,
    password,
  });
  if (res.status !== 200) {
    throw new Error(`Partner sign-up failed: ${res.status} ${res.text}`);
  }
  const cookies = res.headers.getSetCookie?.() || [];
  return { email, password, cookie: cookieHeader(cookies) };
}

async function createHomeownerCheckout() {
  const res = await postJson("/api/checkout", { product: "homeowner" });
  if (res.status !== 200) {
    throw new Error(`Homeowner checkout failed: ${res.status} ${res.text}`);
  }
  const url = res.json?.checkoutUrl;
  const stripeCheckoutSessionId = url?.match(/cs_test_[A-Za-z0-9]+/)?.[0];
  if (!stripeCheckoutSessionId) throw new Error("Could not extract Stripe session id from " + url);
  const purchase = await prisma.purchase.findUnique({
    where: { stripeCheckoutSessionId },
    include: { onboardingToken: true },
  });
  return { url, stripeCheckoutSessionId, purchase };
}

async function createGiftCheckout(cookie) {
  const res = await postJson(
    "/api/checkout",
    {
      product: "gift",
      recipientName: "Gifted Homeowner",
      recipientEmail: testEmail("gifted"),
      propertyAddress: "456 Oak Ave, Test City",
      giftMessage: "Welcome home!",
    },
    { headers: { Cookie: cookie } }
  );
  if (res.status !== 200) {
    throw new Error(`Gift checkout failed: ${res.status} ${res.text}`);
  }
  const url = res.json?.checkoutUrl;
  const stripeCheckoutSessionId = url?.match(/cs_test_[A-Za-z0-9]+/)?.[0];
  const purchase = await prisma.purchase.findUnique({
    where: { stripeCheckoutSessionId },
    include: { giftPurchase: { include: { onboardingToken: true } } },
  });
  return { url, stripeCheckoutSessionId, purchase };
}

async function createAndConfirmPaymentIntent(amount, paymentMethod = "pm_card_visa") {
  const pi = await stripe.paymentIntents.create({
    amount,
    currency: "usd",
    automatic_payment_methods: { enabled: true, allow_redirects: "never" },
  });
  try {
    const confirmed = await stripe.paymentIntents.confirm(pi.id, { payment_method: paymentMethod });
    return { piId: pi.id, status: confirmed.status, chargeId: confirmed.latest_charge };
  } catch (err) {
    if (err.code === "card_declined" || err.decline_code) {
      return { piId: pi.id, status: "failed", error: err };
    }
    throw err;
  }
}

async function sendSignedWebhook(event) {
  const payload = JSON.stringify(event);
  const sig = stripe.webhooks.generateTestHeaderString({ payload, secret: webhookSecret });
  const res = await fetch(`${API_BASE}/api/stripe/webhooks`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "stripe-signature": sig },
    body: payload,
  });
  const text = await res.text();
  return { status: res.status, text };
}

function buildCheckoutSessionObject({ id, purchase, piId, customerEmail, customerId }) {
  const isGift = purchase.productType === "GIFT";
  const metadata = isGift
    ? {
        productType: "GIFT",
        purchaseId: purchase.id,
        giftPurchaseId: purchase.giftPurchase?.id,
      }
    : {
        productType: "HOMEOWNER",
        purchaseId: purchase.id,
      };
  return {
    id,
    object: "checkout.session",
    client_reference_id: purchase.id,
    customer: customerId || null,
    customer_email: customerEmail,
    customer_details: customerEmail ? { email: customerEmail, name: "QA Homeowner" } : null,
    payment_intent: piId,
    metadata,
    amount_total: purchase.amount,
    currency: purchase.currency,
    mode: "payment",
    payment_status: "paid",
    status: "complete",
    url: null,
    success_url: `${API_BASE}/onboarding?session_id={CHECKOUT_SESSION_ID}`,
  };
}

async function completePurchaseViaWebhook(purchase, piId, customerEmail, customerId, stripeCheckoutSessionId) {
  const event = {
    id: `evt_test_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    object: "event",
    api_version: "2024-06-20",
    created: Math.floor(Date.now() / 1000),
    type: "checkout.session.completed",
    data: {
      object: buildCheckoutSessionObject({ id: stripeCheckoutSessionId, purchase, piId, customerEmail, customerId }),
    },
  };
  const { status, text } = await sendSignedWebhook(event);
  if (status !== 200) throw new Error(`Webhook returned ${status}: ${text}`);
  return event;
}

async function pollPurchaseStatus(stripeCheckoutSessionId, expectedStatus, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const purchase = await prisma.purchase.findUnique({
      where: { stripeCheckoutSessionId: stripeCheckoutSessionId },
      include: { onboardingToken: true, giftPurchase: { include: { onboardingToken: true } } },
    });
    if (purchase && purchase.status === expectedStatus) {
      return purchase;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  const final = await prisma.purchase.findUnique({ where: { stripeCheckoutSessionId } });
  throw new Error(
    `Timeout waiting for purchase ${stripeCheckoutSessionId} to be ${expectedStatus}. Final status: ${final?.status}`
  );
}

async function testHomeownerPurchase() {
  console.log("\n--- Homeowner purchase ($189) ---");
  const { stripeCheckoutSessionId, purchase } = await createHomeownerCheckout();
  console.log("Created checkout session:", stripeCheckoutSessionId, "purchase:", purchase.id);
  const customerEmail = testEmail("homeowner");
  const { piId } = await createAndConfirmPaymentIntent(18900, "pm_card_visa");
  console.log("Confirmed PaymentIntent:", piId);
  await completePurchaseViaWebhook(purchase, piId, customerEmail, null, stripeCheckoutSessionId);
  const updated = await pollPurchaseStatus(stripeCheckoutSessionId, "SUCCEEDED");
  console.log("Purchase status:", updated.status);
  console.log("Onboarding token:", updated.onboardingToken?.token ?? "missing");
  return { purchase: updated, piId, stripeCheckoutSessionId, customerEmail };
}

async function testDuplicateWebhook(home) {
  console.log("\n--- Duplicate/replayed webhook ---");
  const event = {
    id: `evt_test_duplicate_${Date.now()}`,
    object: "event",
    api_version: "2024-06-20",
    created: Math.floor(Date.now() / 1000),
    type: "checkout.session.completed",
    data: {
      object: buildCheckoutSessionObject({
        id: home.stripeCheckoutSessionId,
        purchase: home.purchase,
        piId: home.piId,
        customerEmail: home.customerEmail,
        customerId: null,
      }),
    },
  };
  const { status, text } = await sendSignedWebhook(event);
  console.log("Replayed webhook response:", status, text);
}

async function testRefund(home) {
  console.log("\n--- Refund ---");
  const refund = await stripe.refunds.create({
    payment_intent: home.piId,
    reason: "requested_by_customer",
  });
  const updated = await pollPurchaseStatus(home.stripeCheckoutSessionId, "REFUNDED");
  console.log("Refund created:", refund.id);
  console.log("Purchase status after refund:", updated.status);
}

async function testFailedPayment() {
  console.log("\n--- Failed payment (payment_intent.payment_failed) ---");
  const { stripeCheckoutSessionId, purchase } = await createHomeownerCheckout();
  console.log("Created checkout session:", stripeCheckoutSessionId, "purchase:", purchase.id);
  const { piId, error } = await createAndConfirmPaymentIntent(18900, "pm_card_chargeDeclined");
  console.log("Payment declined as expected:", error?.code);

  // Simulate that the checkout session created this payment intent by setting it on the purchase.
  await prisma.purchase.update({
    where: { id: purchase.id },
    data: { stripePaymentIntentId: piId },
  });

  // Send a signed payment_intent.payment_failed event.
  const event = {
    id: `evt_test_failed_${Date.now()}`,
    object: "event",
    api_version: "2024-06-20",
    created: Math.floor(Date.now() / 1000),
    type: "payment_intent.payment_failed",
    data: {
      object: {
        id: piId,
        object: "payment_intent",
        status: "requires_payment_method",
        last_payment_error: { code: "card_declined", decline_code: "generic_decline" },
      },
    },
  };
  const { status, text } = await sendSignedWebhook(event);
  console.log("payment_failed webhook response:", status, text);
  const updated = await pollPurchaseStatus(stripeCheckoutSessionId, "FAILED");
  console.log("Purchase status after failed payment:", updated.status);
}

async function testExpiredCheckout() {
  console.log("\n--- Canceled/expired checkout (checkout.session.expired) ---");
  const { stripeCheckoutSessionId, purchase } = await createHomeownerCheckout();
  console.log("Created checkout session:", stripeCheckoutSessionId, "purchase:", purchase.id);
  const event = {
    id: `evt_test_expired_${Date.now()}`,
    object: "event",
    api_version: "2024-06-20",
    created: Math.floor(Date.now() / 1000),
    type: "checkout.session.expired",
    data: {
      object: {
        id: stripeCheckoutSessionId,
        object: "checkout.session",
        status: "expired",
        metadata: { productType: "HOMEOWNER", purchaseId: purchase.id },
      },
    },
  };
  const { status, text } = await sendSignedWebhook(event);
  console.log("expired webhook response:", status, text);
  const updated = await pollPurchaseStatus(stripeCheckoutSessionId, "FAILED");
  console.log("Purchase status after expiration:", updated.status);
}

async function testGiftPurchase() {
  console.log("\n--- Partner gift purchase ($124) ---");
  const partner = await signUpPartner();
  console.log("Partner signed up:", partner.email);
  const { stripeCheckoutSessionId, purchase } = await createGiftCheckout(partner.cookie);
  console.log("Created gift checkout session:", stripeCheckoutSessionId, "purchase:", purchase.id);
  const { piId } = await createAndConfirmPaymentIntent(12400, "pm_card_visa");
  console.log("Confirmed PaymentIntent:", piId);
  await completePurchaseViaWebhook(purchase, piId, purchase.giftPurchase?.recipientEmail, null, stripeCheckoutSessionId);
  const updated = await pollPurchaseStatus(stripeCheckoutSessionId, "SUCCEEDED");
  console.log("Purchase status:", updated.status);
  console.log("Gift purchase status:", updated.giftPurchase?.status);
  console.log("Gift onboarding token:", updated.giftPurchase?.onboardingToken?.token ?? "missing");
  return { purchase: updated, piId, stripeCheckoutSessionId, token: updated.giftPurchase?.onboardingToken?.token };
}

async function testInvalidSignature() {
  console.log("\n--- Invalid signature ---");
  const res = await fetch(`${API_BASE}/api/stripe/webhooks`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "stripe-signature": "bad" },
    body: JSON.stringify({}),
  });
  const text = await res.text();
  console.log("Invalid signature response:", res.status, text);
}

async function main() {
  const home = await testHomeownerPurchase();
  await testDuplicateWebhook(home);
  await testRefund(home);
  await testFailedPayment();
  await testExpiredCheckout();
  const gift = await testGiftPurchase();
  await testInvalidSignature();

  console.log("\n=== QA Summary ===");
  console.log("Homeowner purchase:", home.purchase.status, "token:", home.purchase.onboardingToken?.token);
  console.log("Gift purchase:", gift.purchase.giftPurchase?.status, "token:", gift.token);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

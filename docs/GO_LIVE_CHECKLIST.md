# Stripe live-mode go-live checklist

Applies to `new-home-warranty-hq` (Next.js on Vercel, Stripe Checkout, webhook at `/api/stripe/webhooks`).
Never paste secret keys into chat, issues, or commits. Enter them only in Vercel / the Stripe dashboard.

## Before you merge / deploy this PR
- [ ] The PR adds a Prisma migration (`stripe_event` table). `vercel.json` runs `prisma migrate deploy` on every
      build, so merging to the production branch applies it to the **production** database. It is additive
      (new table only). Preview deploys apply it to the staging DB first, so check a preview build.
- [ ] Counsel/owner reviewed `docs/TERMS_SECTION_1_PROPOSED.md` and applied/decided on Terms §1.

## 1. Stripe account
- [ ] Activate the account: business details, identity verification, payout bank account.
- [ ] Decide tax: Stripe Tax registration, or leave `STRIPE_TAX_BEHAVIOR` unset (no tax collected). Confirm with an accountant.

## 2. Live products and prices (LIVE mode toggle on)
Test price IDs do not exist in live mode.
- [ ] "New Home Warranty HQ — Homeowner": $189.00 USD, one-time. Copy the `price_...` ID.
- [ ] "New Home Warranty HQ — Partner Gift": $124.00 USD, one-time. Copy the `price_...` ID.

## 3. Live webhook
- [ ] Developers > Webhooks > Add endpoint: `https://<production domain>/api/stripe/webhooks`
      (domain must match `NEXT_PUBLIC_APP_URL`).
- [ ] Events (all four): `checkout.session.completed`, `checkout.session.expired`,
      `payment_intent.payment_failed`, `charge.refunded`.
- [ ] Copy the signing secret (`whsec_...`).

## 4. Vercel environment variables (Production scope ONLY)
Leave Preview/Development on test-mode values.
- [ ] `STRIPE_SECRET_KEY` = `sk_live_...`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_live_...` (not used by code today; set for consistency)
- [ ] `STRIPE_WEBHOOK_SECRET` = the live `whsec_...`
- [ ] `STRIPE_PRICE_HOMEOWNER`, `STRIPE_PRICE_GIFT` = the new live `price_...` IDs
- [ ] Verify `NEXT_PUBLIC_APP_URL` and `BETTER_AUTH_URL` = the production URL (one canonical domain; `lib/site.ts` uses newhomewarrantyhq.com)
- [ ] Verify `RESEND_API_KEY`, `RESEND_FROM_EMAIL` and that the sending domain is verified (SPF/DKIM), otherwise no emails go out
- [ ] Verify `CRON_SECRET`, `R2_*`, `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (checkout rate limit uses Upstash when set)
- [ ] **Redeploy** (NEXT_PUBLIC_* values are inlined at build time).

## 5. Check the config guard
After the first checkout request on the new deploy, open Vercel runtime logs and search `[stripe config]`.
You should see nothing. `MODE MISMATCH` or `Could not load STRIPE_PRICE_...` means a key/price mix of test and live.

## 6. Real purchase test
- [ ] Buy the $189 product with a real card. Confirm: Stripe shows the webhook delivered with 200; the purchase is
      `SUCCEEDED`; the setup email and receipt arrive; onboarding works.
- [ ] Search logs / AuditLog for `EMAIL_SEND_FAILED` (should be none).
- [ ] Refund it fully from `/admin/refunds`; confirm status `REFUNDED` and access revoked.
- [ ] Optional: a partial refund from the Stripe dashboard should show `PARTIALLY_REFUNDED` and keep access.
- [ ] Repeat for the $124 gift flow with a partner account (recipient receives the invitation email).
- [ ] Confirm `managed_payments: { enabled: false }` in `/api/checkout` is accepted in live mode (the real purchase covers this).

## 7. Rollback
Restore the previous Production `STRIPE_*` env values in Vercel and redeploy. The Terms and code changes are independent of Stripe mode.

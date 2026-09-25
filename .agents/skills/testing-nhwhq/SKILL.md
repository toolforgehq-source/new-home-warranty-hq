---
name: Testing New Home Warranty HQ
description: How to run end-to-end QA against the New Home Warranty HQ staging environment, including DB access, Stripe checkout/webhook workarounds, file upload, issue flow, and common pitfalls.
---

## Devin Secrets Needed
- `VERCEL_TOKEN` — for `npx vercel env pull`, `npx vercel logs`, and `npx vercel inspect` (sensitive preview secrets are not decrypted by this token; only non-sensitive values are returned).
- `POSTGRES_URL` (pooled Neon URL) — easiest way to read/write the `nhwhq_staging` database.
- `STRIPE_WEBHOOK_SECRET` — needed to simulate signed Stripe webhooks against `/api/stripe/webhooks`.

## Connecting to the staging database

The Vercel preview `POSTGRES_URL` points to `/neondb?` by default. The test database is `nhwhq_staging`, so rewrite the path:

```bash
export DATABASE_URL="$(grep '^POSTGRES_URL=' .env.preview | cut -d= -f2- | sed 's|/neondb?|/nhwhq_staging?|' | tr -d '\"')"
```

Use `npx tsx` with a script that imports `pg` or Prisma. Prisma Client works from the repo root so module resolution succeeds.

## Simulating Stripe webhooks without the secret key

The preview `STRIPE_SECRET_KEY` cannot be extracted with `VERCEL_TOKEN`, but webhooks can still be tested with the known `STRIPE_WEBHOOK_SECRET`:

```bash
export WEBHOOK_SECRET="whsec_..."
```

Build a `Stripe.webhooks.generateTestHeaderString({ payload, secret })` and POST to `https://new-home-warranty-hq-staging.vercel.app/api/stripe/webhooks` with `Stripe-Signature`.

Key event types:
- `checkout.session.completed` with `metadata.productType = HOMEOWNER` and `metadata.purchaseId`.
- `checkout.session.completed` with `metadata.productType = GIFT` and `metadata.giftPurchaseId`.
- `checkout.session.expired` with `metadata.purchaseId`.
- `charge.refunded` with `payment_intent` matching `purchase.stripePaymentIntentId`.
- `payment_intent.payment_failed`.

## Bypassing the Stripe checkout UI for issue-flow testing

A real Stripe test-card checkout *can* be completed with browser automation (verified on the PR #6 preview): if Stripe shows a Link prompt, click "Pay without Link"; click the "Card" payment-method accordion to expose `cardNumber`/`cardExpiry`/`cardCvc`/`billingName`/`billingPostalCode` inputs; use `4242 4242 4242 4242`, a future expiry (e.g. `12/30`), any CVC/ZIP; the "Save my information" (Link) checkbox is on by default and makes `phoneNumber` required — just type any US number. The page DOM is huge (country selector); grep the saved `/tmp/annotated_dom_*.html` for devinids instead of reading the tool output. After submit, Stripe redirects to the app's `success_url`. Note the Stripe webhook endpoint is registered for the stable staging alias (`new-home-warranty-hq-staging.vercel.app`), so the `checkout.session.completed` handling and `[email] sent` log lines appear in *that* deployment's `npx vercel logs`, not the PR preview's — both share `nhwhq_staging`.

If the card iframe cannot be driven, as a fallback, seed a `SUCCEEDED` `purchase` and an `onboarding_token` directly in `nhwhq_staging`, then navigate to `/onboarding?token=...` on the target preview deployment. This lets you test onboarding and the full issue flow without a real payment.

To test the real checkout UI end-to-end, a human with Stripe test credentials or direct access to `STRIPE_SECRET_KEY` is usually required.

## Verifying Resend emails

Resend sends can be verified from Vercel preview logs:

```bash
npx vercel logs dpl_<id> --limit 200 --since 20m --json
```

Search the JSON output for `"[email] sent"` in the `message` or nested `logs` array. The logs also include the `to`, `cc`, `subject`, and Resend message id.

## Appointment builder confirmation link

When `createAppointment` sets `proposeToBuilder=true`, the `appointment.confirmationToken` is generated and emailed to `home.builderEmail`. To confirm without reading the builder inbox, query the latest `appointment` row for the issue and open:

```
https://<preview-host>/api/appointments/confirm?token=<confirmationToken>
```

The page should return `Appointment confirmed` and update `Issue.status` to `SCHEDULED`.

## Known testing gotchas

- Stripe test checkout needs a future card expiry (e.g. `12/30`). The card fields are usually drivable via devinid (see the Stripe section above); webhook simulation or DB seeding is the fallback only if they are not.
- `npx vercel env pull` writes sensitive preview values as `[SENSITIVE]` placeholders; the token cannot decrypt them.
- `npx vercel logs --follow` tends to hit the query duration limit quickly. Prefer `npx vercel logs --deployment dpl_<id> --limit N --json` and grep the resulting file.
- Next.js server actions have a default 1 MB request body limit. `lib/actions/document.ts` enforces 10 MB, but requests larger than the Next.js limit never reach the action. Set `serverActions.bodySizeLimit` in `next.config.ts` for tests with multi-MB images.
- `/login` on a git-branch preview alias (`*-git-<branch>-*.vercel.app`) may fail with "Invalid origin": `lib/auth.ts` trustedOrigins only include `NEXT_PUBLIC_APP_URL`/`BETTER_AUTH_URL`/`VERCEL_URL` (the unique deployment URL). Log in on the deployment URL from `npx vercel inspect <alias>` instead. Server-action-based signups (partner register, onboarding) still work on the alias.
- To log back in as a test user whose password you don't have, reset it in staging with `hashPassword` from `better-auth/crypto` on the `account` row (`providerId = credential`).
- Partner role isolation is enforced in `proxy.ts`: PARTNER hitting `/dashboard*` → redirect to `/partner/dashboard`; non-partner hitting `/partner*` → `/`.
- Partner `/checkout?product=gift` uses `authClient.useSession()` and redirects to `/login` while the session is still loading, so a logged-in partner may be unable to reach the gift checkout form.
- Document signed URLs are generated by R2 and are valid for 1 hour. Tampering `X-Amz-Signature` returns `SignatureDoesNotMatch` / `403`.
- Better Auth does not require email verification in preview, so `delivered+<label>@resend.dev` addresses work for onboarding without verifying inboxes.
- `NEXT_PUBLIC_APP_URL` in the preview environment may point to the stable alias (`new-home-warranty-hq-staging.vercel.app`) instead of the PR preview. When testing a PR preview, this can cause checkout success URLs and email links to land on the wrong deployment. Verify the active alias with `npx vercel alias ls` and `npx vercel inspect <preview-url>`.

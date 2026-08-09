# Environment Variables

All credentials are read from environment variables. Do not hard-code secrets.

## Required for core product

| Variable | Purpose | Notes |
|----------|---------|-------|
| `NEXT_PUBLIC_APP_URL` | Canonical public app URL (e.g. `https://app.newhomewarrantyhq.com`) | Used in emails, Stripe success/cancel URLs, and OAuth callbacks. |
| `BETTER_AUTH_SECRET` | Random 32+ character secret for session signing | Generate with `openssl rand -base64 32`. |
| `BETTER_AUTH_URL` | Same as `NEXT_PUBLIC_APP_URL` | Better Auth needs this for callback URLs. |
| `DATABASE_URL` | PostgreSQL connection string | Neon in production; local Postgres for dev. |

## Payments (Stripe)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (`pk_test_*` or `pk_live_*`). |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_*` or `sk_live_*`). |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret from Stripe (`whsec_*`). |
| `STRIPE_TAX_BEHAVIOR` | `exclusive` (default), `inclusive`, `unspecified`, or `automatic_tax` to enable Stripe Tax. |
| `STRIPE_PRICE_HOMEOWNER` | Stripe Price ID for the $189 homeowner product. |
| `STRIPE_PRICE_GIFT` | Stripe Price ID for the $124 partner gift product. |

## Email (Resend)

| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` | Resend API key (`re_*`). |
| `RESEND_FROM_EMAIL` | Verified sender domain (e.g. `noreply@newhomewarrantyhq.com`). |

## File storage (Cloudflare R2)

| Variable | Purpose |
|----------|---------|
| `R2_ACCOUNT_ID` | Cloudflare account ID. |
| `R2_ACCESS_KEY_ID` | S3-compatible access key for R2. |
| `R2_SECRET_ACCESS_KEY` | S3-compatible secret key for R2. |
| `R2_BUCKET_NAME` | R2 bucket name. |
| `R2_PUBLIC_URL` | Optional public base URL for downloads; signed URLs are used otherwise. |

## Rate limiting / cron locks (Upstash Redis)

| Variable | Purpose |
|----------|---------|
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL. |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token. |

## Cron

| Variable | Purpose |
|----------|---------|
| `CRON_SECRET` | Secret for `/api/cron/reminders` to prevent unauthorized calls. |

## Optional: connected Gmail/Outlook sending

| Variable | Purpose |
|----------|---------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID. |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret. |
| `GOOGLE_REDIRECT_URI` | Redirect URI: `{NEXT_PUBLIC_APP_URL}/api/auth/email/google/callback`. |
| `MICROSOFT_CLIENT_ID` | Microsoft Azure app client ID. |
| `MICROSOFT_CLIENT_SECRET` | Microsoft Azure app client secret. |
| `MICROSOFT_REDIRECT_URI` | Redirect URI: `{NEXT_PUBLIC_APP_URL}/api/auth/email/microsoft/callback`. |

## Optional: SMS (Twilio)

| Variable | Purpose |
|----------|---------|
| `TWILIO_ACCOUNT_SID` | Twilio account SID. |
| `TWILIO_AUTH_TOKEN` | Twilio auth token. |
| `TWILIO_MESSAGING_SERVICE_SID` | Twilio messaging service SID. |

## Optional: monitoring / analytics

| Variable | Purpose |
|----------|---------|
| `SENTRY_DSN` | Sentry server DSN. |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry public DSN. |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Plausible Analytics domain. |
| `ADMIN_EMAIL` | Email for admin notifications. |

## Vercel deployment

1. Create a project on Vercel and link the GitHub repo.
2. Add the environment variables above in the Vercel dashboard.
3. For cron, add a Vercel Cron job pointing to `/api/cron/reminders?secret=${CRON_SECRET}`.
4. For Stripe webhooks, set the endpoint to `{NEXT_PUBLIC_APP_URL}/api/stripe/webhooks`.

# Proposed replacement for Terms of Service §1 (DRAFT, NOT APPLIED)

> **Counsel/owner review required before this goes on the live site.** This is a drafting
> proposal by an AI assistant, not legal advice. `app/(marketing)/terms/page.tsx` is intentionally
> unchanged in this PR. Privacy page wording about the email relay and processors (Resend, Cloudflare R2,
> Stripe) should be reviewed at the same time.

## Why

Current §1 says: "We do not communicate with your builder on your behalf unless you choose to use
your own email or copy information from the Service."

The product does send email to the builder (`lib/actions/warranty-send.ts`): from a per-issue address,
with a per-issue reply-to relay, copying the homeowner, attaching the PDF/photos, and relaying builder replies
into the dashboard (`/api/inbound`). The homepage and FAQ already say this. The Terms contradict the product.

## Proposed text

**1. About the Service**

New Home Warranty HQ is a software tool that helps homeowners document, organize, and track new-home
warranty issues. We do not provide warranty coverage, home warranty insurance, repairs, or legal services,
and we do not decide whether any issue is covered by your builder's warranty.

When you choose to send a warranty request to your builder, the Service emails it to the builder address you
provide, on your behalf and at your direction. The message is sent from an address operated by the Service,
copies you, and uses a reply address that routes the builder's replies back into your account so they are
recorded with your issue. We send a request only after you write or approve it, and we do not contact your
builder on our own initiative. Suggested wording is a draft for you to edit. You are responsible for the
content of what you send, for the accuracy of the builder's contact details, and for any deadlines under your
builder's warranty. We do not guarantee that your builder will receive, read, or respond to a message, or that
email will be delivered. If your builder requires its own portal or form, you are responsible for submitting
through it; the Service can help you prepare the information and keep confirmation.

## Open questions for counsel

- Is "on your behalf" the right characterization (agency), or should it read "at your direction"?
- Delivery/no-guarantee language, and who bears deadline risk.
- Whether users must affirmatively accept this at first send (a checkbox) rather than only via Terms.
- Update the "Last updated" date and decide how existing customers are notified.

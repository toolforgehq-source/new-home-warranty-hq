import { sendEmail } from "@/lib/email";

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function giftInvitationContent({
  buyerName,
  buyerCompany,
  giftMessage,
  redemptionUrl,
}: {
  buyerName: string;
  buyerCompany?: string | null;
  giftMessage?: string | null;
  redemptionUrl: string;
}) {
  const fromLine = buyerCompany ? `${buyerName} at ${buyerCompany}` : buyerName;
  const message = giftMessage?.trim();

  return {
    subject: `${fromLine} sent you a New Home Warranty HQ gift`,
    text: `Hi,\n\n${fromLine} has gifted you New Home Warranty HQ — a simple system for documenting, reporting, and tracking new-home warranty issues.\n\n${message ? `Their message:\n"${message}"\n\n` : ""}This gift has already been paid for. Set up your account here:\n${redemptionUrl}\n\n— New Home Warranty HQ`,
    html: `<p>Hi,</p><p><strong>${escapeHtml(fromLine)}</strong> has gifted you New Home Warranty HQ — a simple system for documenting, reporting, and tracking new-home warranty issues.</p>${message ? `<blockquote style="margin:16px 0;padding-left:12px;border-left:3px solid #22c55e;color:#374151;font-style:italic;white-space:pre-line">${escapeHtml(message)}</blockquote>` : ""}<p>This gift has already been paid for. <a href="${escapeHtml(redemptionUrl)}">Set up your account here</a>.</p><p>— New Home Warranty HQ</p>`,
  };
}

export async function sendGiftInvitation({
  to,
  ...content
}: {
  to: string;
  buyerName: string;
  buyerCompany?: string | null;
  giftMessage?: string | null;
  redemptionUrl: string;
}) {
  return sendEmail({ to, ...giftInvitationContent(content) });
}

export async function sendGiftRedemptionConfirmation({
  to,
  recipientEmail,
}: {
  to: string;
  recipientEmail: string;
}) {
  return sendEmail({
    to,
    subject: "Your gift has been redeemed",
    text: `Hi,\n\nGood news — the New Home Warranty HQ gift you sent to ${recipientEmail} has been redeemed.\n\n— New Home Warranty HQ`,
    html: `<p>Hi,</p><p>Good news — the New Home Warranty HQ gift you sent to ${escapeHtml(recipientEmail)} has been redeemed.</p><p>— New Home Warranty HQ</p>`,
  });
}

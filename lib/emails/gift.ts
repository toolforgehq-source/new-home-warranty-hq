import { sendEmail } from "@/lib/email";

export async function sendGiftInvitation({
  to,
  buyerName,
  buyerCompany,
  redemptionUrl,
}: {
  to: string;
  buyerName: string;
  buyerCompany?: string | null;
  redemptionUrl: string;
}) {
  const fromLine = buyerCompany ? `${buyerName} at ${buyerCompany}` : buyerName;

  return sendEmail({
    to,
    subject: "A New Home Warranty HQ gift for you",
    text: `Hi,\n\n${fromLine} has gifted you New Home Warranty HQ — a simple system for documenting, reporting, and tracking new-home warranty issues.\n\nThis gift has already been paid for. Set up your account here:\n${redemptionUrl}\n\n— New Home Warranty HQ`,
    html: `<p>Hi,</p><p>${fromLine} has gifted you New Home Warranty HQ — a simple system for documenting, reporting, and tracking new-home warranty issues.</p><p>This gift has already been paid for. <a href="${redemptionUrl}">Set up your account here</a>.</p><p>— New Home Warranty HQ</p>`,
  });
}

export async function sendGiftRedemptionConfirmation({
  to,
  buyerEmail,
}: {
  to: string;
  buyerEmail: string;
}) {
  return sendEmail({
    to,
    subject: "Your gift has been redeemed",
    text: `Hi,\n\nGood news — the New Home Warranty HQ gift you sent to ${to} has been redeemed.\n\n— New Home Warranty HQ`,
    html: `<p>Hi,</p><p>Good news — the New Home Warranty HQ gift you sent has been redeemed.</p><p>— New Home Warranty HQ</p>`,
  });
}

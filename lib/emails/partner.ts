import { sendEmail } from "@/lib/email";

export async function sendPartnerApprovedEmail({
  to,
  name,
  publicPageUrl,
}: {
  to: string;
  name: string;
  publicPageUrl: string;
}) {
  return sendEmail({
    to,
    subject: "Your New Home Warranty HQ partner account is approved",
    text: `Hi ${name},\n\nYour partner account has been approved. You can now share your co-branded page and send gifts to buyers.\n\nYour public page: ${publicPageUrl}\n\n— New Home Warranty HQ`,
    html: `<p>Hi ${name},</p><p>Your partner account has been approved. You can now share your co-branded page and send gifts to buyers.</p><p><a href="${publicPageUrl}">View your public page</a></p><p>— New Home Warranty HQ</p>`,
  });
}

export async function sendPartnerGiftReceipt({
  to,
  partnerName,
  recipientName,
  recipientEmail,
  amount,
  purchasedAt,
}: {
  to: string;
  partnerName: string;
  recipientName: string;
  recipientEmail: string;
  amount: number;
  purchasedAt: Date;
}) {
  return sendEmail({
    to,
    subject: "Your New Home Warranty HQ gift receipt",
    text: `Hi ${partnerName},\n\nThank you for gifting New Home Warranty HQ.\n\nRecipient: ${recipientName} (${recipientEmail})\nAmount: $${(amount / 100).toFixed(2)}\nPurchased: ${purchasedAt.toLocaleDateString()}\n\n— New Home Warranty HQ`,
    html: `<p>Hi ${partnerName},</p><p>Thank you for gifting New Home Warranty HQ.</p><p><strong>Recipient:</strong> ${recipientName} (${recipientEmail})<br /><strong>Amount:</strong> $${(amount / 100).toFixed(2)}<br /><strong>Purchased:</strong> ${purchasedAt.toLocaleDateString()}</p><p>— New Home Warranty HQ</p>`,
  });
}

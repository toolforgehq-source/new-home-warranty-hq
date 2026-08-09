import { sendEmail } from "@/lib/email";

export async function sendHomeownerOnboardingLink({
  to,
  token,
  appUrl,
}: {
  to: string;
  token: string;
  appUrl: string;
}) {
  const url = `${appUrl}/onboarding?token=${token}`;
  return sendEmail({
    to,
    subject: "Complete your New Home Warranty HQ setup",
    text: `Thanks for your purchase. Set up your account here:\n${url}\n\n— New Home Warranty HQ`,
    html: `<p>Thanks for your purchase.</p><p><a href="${url}">Set up your account</a></p><p>— New Home Warranty HQ</p>`,
  });
}

export async function sendPurchaseReceipt({
  to,
  amount,
  product,
}: {
  to: string;
  amount: number;
  product: string;
}) {
  return sendEmail({
    to,
    subject: "Your New Home Warranty HQ receipt",
    text: `Thank you for your purchase.\n\nProduct: ${product}\nAmount: $${(amount / 100).toFixed(2)}\n\n— New Home Warranty HQ`,
    html: `<p>Thank you for your purchase.</p><p>Product: ${product}<br />Amount: $${(amount / 100).toFixed(2)}</p><p>— New Home Warranty HQ</p>`,
  });
}

import { sendEmail } from "@/lib/email";
import { APP_URL } from "@/lib/stripe";

export async function sendWelcomeEmail({
  to,
  name,
  address,
}: {
  to: string;
  name: string;
  address: string;
}) {
  const dashboardUrl = `${APP_URL}/dashboard`;
  return sendEmail({
    to,
    subject: "Welcome to New Home Warranty HQ",
    text: `Hi ${name},\n\nWelcome to New Home Warranty HQ. Your home at ${address} is now set up.\n\nStart documenting issues and tracking warranty items at ${dashboardUrl}.\n\n— New Home Warranty HQ`,
    html: `<p>Hi ${name},</p><p>Welcome to New Home Warranty HQ. Your home at ${address} is now set up.</p><p><a href="${dashboardUrl}">Open your dashboard</a></p><p>— New Home Warranty HQ</p>`,
  });
}

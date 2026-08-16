import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const fromEmail = process.env.RESEND_FROM_EMAIL ?? "noreply@newhomewarrantyhq.com";

export async function sendEmail({
  to,
  subject,
  text,
  html,
  replyTo,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}) {
  if (!resend) {
    console.log("[email] Resend not configured, skipping send", { to, subject });
    return { skipped: true };
  }

  const result = await resend.emails.send({
    from: fromEmail,
    to,
    subject,
    text,
    html,
    ...(replyTo ? { reply_to: replyTo } : {}),
  });
  console.log("[email] sent", { to, subject, id: result.data?.id });
  return result;
}

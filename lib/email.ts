import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const fromEmail = process.env.RESEND_FROM_EMAIL ?? "noreply@newhomewarrantyhq.com";

export interface EmailAttachment {
  filename: string;
  content?: string | Buffer;
  path?: string;
  contentType?: string;
}

export async function sendEmail({
  to,
  cc,
  subject,
  text,
  html,
  replyTo,
  attachments,
}: {
  to: string;
  cc?: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}) {
  if (!resend) {
    console.log("[email] Resend not configured, skipping send", { to, subject });
    return { skipped: true };
  }

  const result = await resend.emails.send({
    from: fromEmail,
    to,
    ...(cc ? { cc } : {}),
    subject,
    text,
    html,
    ...(replyTo ? { reply_to: replyTo } : {}),
    ...(attachments?.length ? { attachments } : {}),
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  console.log("[email] sent", { to, cc, subject, id: result.data?.id });
  return result;
}

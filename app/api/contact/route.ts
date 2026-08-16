import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, message } = body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof message !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !message.trim()
    ) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    const supportEmail = process.env.SUPPORT_EMAIL ?? "support@newhomewarrantyhq.com";

    await sendEmail({
      to: supportEmail,
      replyTo: email.trim(),
      subject: `Contact form: ${name.trim()}`,
      text: `Name: ${name.trim()}\nEmail: ${email.trim()}\n\nMessage:\n${message.trim()}`,
      html: `<p><strong>Name:</strong> ${escapeHtml(name.trim())}</p><p><strong>Email:</strong> ${escapeHtml(email.trim())}</p><p><strong>Message:</strong></p><p style="white-space:pre-wrap">${escapeHtml(message.trim())}</p>`,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[contact] error", error);
    return NextResponse.json({ error: "Could not send message. Please try again later." }, { status: 500 });
  }
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

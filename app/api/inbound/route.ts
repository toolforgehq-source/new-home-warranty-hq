import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { processInboundEmail } from "@/lib/inbound";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();

    if (resend && process.env.RESEND_WEBHOOK_SECRET) {
      const verified = resend.webhooks.verify({
        payload,
        headers: {
          id: req.headers.get("svix-id") || "",
          timestamp: req.headers.get("svix-timestamp") || "",
          signature: req.headers.get("svix-signature") || "",
        },
        webhookSecret: process.env.RESEND_WEBHOOK_SECRET,
      });

      if (verified.type !== "email.received") {
        return NextResponse.json({ skipped: true });
      }

      const result = await processInboundEmail({
        type: verified.type,
        data: (verified as unknown as { data?: { email_id?: string } }).data,
      });
      return NextResponse.json(result);
    }

    // Fallback for environments without webhook verification configured
    const event = JSON.parse(payload) as { type?: string; data?: { email_id?: string } };
    if (event.type !== "email.received") {
      return NextResponse.json({ skipped: true });
    }
    const result = await processInboundEmail({ type: event.type, data: event.data });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/inbound] error", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

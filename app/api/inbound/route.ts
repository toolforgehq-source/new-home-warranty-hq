import { NextRequest, NextResponse } from "next/server";
import { processInboundEmail } from "@/lib/inbound";

export async function POST(req: NextRequest) {
  try {
    const event = (await req.json()) as { type?: string; data?: { email_id?: string } };
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

import { NextRequest, NextResponse } from "next/server";
import { generateReminders } from "@/lib/reminders/engine";
import { deliverDueReminders } from "@/lib/reminders/delivery";

export async function GET(request: NextRequest) {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "") ?? request.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const generated = await generateReminders();
    const delivered = await deliverDueReminders();

    return NextResponse.json({
      ok: true,
      generated: generated.length,
      delivered: delivered.filter((d) => d.ok).length,
      failed: delivered.filter((d) => !d.ok).length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cron reminders]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}

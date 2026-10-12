import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { trackEvent } from "@/lib/analytics";
import { BOT_UA, classifySource, SOURCE_COOKIE, VISITOR_COOKIE } from "@/lib/funnel";

const str = (v: unknown, max: number) => (typeof v === "string" && v ? v.slice(0, max) : null);

export async function POST(request: NextRequest) {
  const ua = request.headers.get("user-agent") ?? "";
  if (!ua || BOT_UA.test(ua)) return new NextResponse(null, { status: 204 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const path = str(body.path, 200);
  if (!path?.startsWith("/")) return NextResponse.json({ error: "Invalid path" }, { status: 400 });

  let source = classifySource({
    referrer: str(body.referrer, 500),
    utmSource: str(body.utmSource, 40),
    ownHost: request.nextUrl.hostname,
  });
  const partnerSlug = path.match(/^\/partners\/([a-z0-9-]+)\/?$/i)?.[1];
  if (partnerSlug && (source === "direct" || source === "internal")) {
    source = `partner:${partnerSlug.toLowerCase()}`;
  }

  const existingId = request.cookies.get(VISITOR_COOKIE)?.value;
  const anonymousId = existingId && /^[\w-]{8,64}$/.test(existingId) ? existingId : randomUUID();
  const firstTouch = request.cookies.get(SOURCE_COOKIE)?.value;

  await trackEvent({
    event: "page_view",
    anonymousId,
    properties: {
      path,
      source: source === "internal" ? (firstTouch ?? "direct") : source,
      medium: str(body.utmMedium, 40),
      campaign: str(body.utmCampaign, 80),
    },
  });

  const res = new NextResponse(null, { status: 204 });
  const cookie = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: request.nextUrl.protocol === "https:",
    path: "/",
  };
  if (anonymousId !== existingId) res.cookies.set(VISITOR_COOKIE, anonymousId, { ...cookie, maxAge: 365 * 86400 });
  if (!firstTouch && source !== "internal") res.cookies.set(SOURCE_COOKIE, source, { ...cookie, maxAge: 90 * 86400 });
  return res;
}

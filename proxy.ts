import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

const PROTECTED = ["/dashboard", "/partner", "/admin", "/onboarding", "/checkout/success", "/gift"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  const isPublic =
    pathname === "/partner/register" ||
    pathname.startsWith("/partners/");

  if (!isProtected || isPublic) {
    return NextResponse.next();
  }

  if (
    pathname === "/onboarding" &&
    (request.method === "POST" ||
      request.nextUrl.searchParams.has("token") ||
      request.nextUrl.searchParams.has("session_id"))
  ) {
    return NextResponse.next();
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/admin") && session.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname.startsWith("/partner") && session.user.role !== "PARTNER") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname.startsWith("/dashboard") && session.user.role === "PARTNER") {
    return NextResponse.redirect(new URL("/partner/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/partner/:path*",
    "/admin/:path*",
    "/onboarding",
    "/checkout/success",
    "/gift/:path*",
  ],
};

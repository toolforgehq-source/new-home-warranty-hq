import { headers } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const QA_EMAIL = "partner-qa-polish@resend.dev";

export async function POST() {
  const headersList = await headers();
  const secret = headersList.get("x-qa-secret");
  if (secret !== process.env.QA_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.partnerProfile.findFirst({
    where: { user: { email: QA_EMAIL } },
    include: { user: true },
  });

  if (!profile) {
    return NextResponse.json({ error: "Partner not found" }, { status: 404 });
  }

  await prisma.partnerProfile.update({
    where: { id: profile.id },
    data: { isApproved: true },
  });

  return NextResponse.json({ ok: true, slug: profile.slug });
}

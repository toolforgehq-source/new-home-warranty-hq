import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getSignedDownloadUrl } from "@/lib/storage";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const job = await prisma.exportJob.findFirst({
    where: { id, userId: session.user.id },
    include: { home: true },
  });

  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  let downloadUrl = null;
  if (job.fileKey) {
    try {
      downloadUrl = await getSignedDownloadUrl(job.fileKey, 7 * 24 * 60 * 60);
    } catch {
      downloadUrl = null;
    }
  }

  return NextResponse.json({
    id: job.id,
    status: job.status,
    format: job.format,
    fileSize: job.fileSize,
    createdAt: job.createdAt,
    completedAt: job.completedAt,
    downloadUrl,
  });
}

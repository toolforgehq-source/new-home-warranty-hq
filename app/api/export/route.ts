import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { uploadBuffer, downloadFile, getSignedDownloadUrl } from "@/lib/storage";
import { hasActiveEntitlement } from "@/lib/entitlements";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");

  const home = await prisma.home.findFirst({
    where: {
      id: homeId ?? undefined,
      OR: [
        { primaryOwnerId: session.user.id },
        { memberships: { some: { userId: session.user.id } } },
      ],
    },
    include: {
      issues: {
        include: {
          documents: true,
          submissionRecords: true,
          appointments: true,
          repairVerifications: true,
          statusHistory: true,
        },
      },
      documents: true,
    },
  });

  if (!home) return NextResponse.json({ error: "Home not found" }, { status: 404 });

  if (!(await hasActiveEntitlement(session.user.id))) {
    return NextResponse.json({ error: "Paid access is paused" }, { status: 403 });
  }

  const job = await prisma.exportJob.create({
    data: {
      userId: session.user.id,
      homeId: home.id,
      format: "ZIP",
      status: "PENDING",
    },
  });

  await prisma.exportJob.update({
    where: { id: job.id },
    data: { status: "PROCESSING" },
  });

  try {
    const zip = new JSZip();

    zip.file(`${home.address.replace(/\W+/g, "_")}/home.json`, JSON.stringify(home, null, 2));

    const allDocuments = [...home.documents, ...home.issues.flatMap((i) => i.documents)];
    for (const doc of allDocuments) {
      try {
        const buffer = await downloadFile(doc.fileKey);
        const fileName = doc.fileKey.split("/").pop() ?? doc.fileKey;
        zip.file(`${home.address.replace(/\W+/g, "_")}/documents/${doc.type}/${fileName}`, buffer);
      } catch (err) {
        console.error(`[export] failed to download ${doc.fileKey}`, err);
      }
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    const key = `exports/${home.id}/${job.id}.zip`;
    await uploadBuffer(key, zipBuffer, "application/zip");

    const downloadUrl = await getSignedDownloadUrl(key, 7 * 24 * 60 * 60);

    await prisma.exportJob.update({
      where: { id: job.id },
      data: { status: "READY", fileKey: key, fileSize: zipBuffer.length, completedAt: new Date() },
    });

    return NextResponse.json({ jobId: job.id, status: "READY", downloadUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.exportJob.update({
      where: { id: job.id },
      data: { status: "FAILED" },
    });
    return NextResponse.json({ jobId: job.id, status: "FAILED", error: message }, { status: 500 });
  }
}

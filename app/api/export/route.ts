import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { createElement } from "react";
import type { ReactElement } from "react";
import { renderToBuffer, DocumentProps } from "@react-pdf/renderer";
import { WarrantyRequestPDF } from "@/lib/pdf/warranty-request";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { uploadBuffer, downloadFile, getSignedDownloadUrl } from "@/lib/storage";
import { hasActiveEntitlement } from "@/lib/entitlements";

const WARRANTY_DOC_TYPES = new Set<string>(["BUILDER_WARRANTY", "THIRD_PARTY_WARRANTY", "WORKMANSHIP_STANDARDS"]);

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
          comments: { orderBy: { createdAt: "asc" } },
          warrantyRequests: true,
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

    const folder = home.address.replace(/\W+/g, "_");
    zip.file(`${folder}/home.json`, JSON.stringify(home, null, 2));

    const fileName = (key: string) => key.split("/").pop() ?? key;
    const addFile = async (path: string, key: string) => {
      try {
        zip.file(path, await downloadFile(key));
      } catch (err) {
        console.error(`[export] failed to download ${key}`, err);
      }
    };

    for (const doc of home.documents.filter((d) => !d.issueId)) {
      const sub = WARRANTY_DOC_TYPES.has(doc.type) ? "warranty-documents" : `documents/${doc.type}`;
      await addFile(`${folder}/${sub}/${fileName(doc.fileKey)}`, doc.fileKey);
    }

    const usedNames = new Set<string>();
    for (const issue of home.issues) {
      let name = issue.title.replace(/\W+/g, "_").replace(/^_+|_+$/g, "") || "Issue";
      if (usedNames.has(name)) name = `${name}_${issue.id.slice(-6)}`;
      usedNames.add(name);

      for (const doc of issue.documents) {
        const sub = doc.type === "ISSUE_PHOTO" ? "photos" : `documents/${doc.type}`;
        await addFile(`${folder}/issues/${name}/${sub}/${fileName(doc.fileKey)}`, doc.fileKey);
      }

      if (issue.comments.length > 0) {
        const log = issue.comments
          .map((c) => {
            const who = c.direction === "BUILDER" ? c.emailFrom || "Builder" : c.direction === "SYSTEM" ? "System" : "Homeowner";
            const flag = c.isInternal ? " (internal note)" : "";
            return `[${c.createdAt.toISOString()}] ${who}${flag}:\n${c.content}\n`;
          })
          .join("\n");
        zip.file(`${folder}/communications/${name}.txt`, log);
      }

      const requests = [...issue.warrantyRequests].sort((a, b) => a.generatedAt.getTime() - b.generatedAt.getTime());
      for (const [i, req] of requests.entries()) {
        try {
          const pdf = await renderToBuffer(
            createElement(WarrantyRequestPDF, {
              request: {
                generatedContent: req.generatedContent,
                requestedNextStep: req.requestedNextStep,
                home: { address: home.address, builderName: home.builderName },
                issue: {
                  title: issue.title,
                  location: issue.location,
                  dateNoticed: issue.dateNoticed,
                  description: issue.description,
                },
              },
            }) as unknown as ReactElement<DocumentProps>
          );
          const suffix = requests.length > 1 ? `_${i + 1}` : "";
          zip.file(`${folder}/requests/${name}${suffix}.pdf`, pdf);
        } catch (err) {
          console.error(`[export] failed to render request ${req.id}`, err);
        }
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

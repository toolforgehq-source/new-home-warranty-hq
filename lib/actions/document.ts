"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DocumentType } from "@prisma/client";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { trackEvent } from "@/lib/analytics";
import { logAudit } from "@/lib/audit";
import { uploadFile } from "@/lib/storage";

export async function uploadDocument(
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Not authenticated" };

  const home = await prisma.home.findFirst({
    where: {
      OR: [
        { primaryOwnerId: session.user.id },
        { memberships: { some: { userId: session.user.id } } },
      ],
    },
  });

  if (!home) return { error: "No home found" };

  const file = formData.get("file") as File | null;
  const label = (formData.get("label") as string)?.trim();
  const type = (formData.get("type") as string) || "OTHER";

  if (!file || !label) {
    return { error: "File and label are required" };
  }

  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { error: "File must be smaller than 10 MB" };
  }

  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];
  if (!allowedTypes.includes(file.type)) {
    return { error: "Unsupported file type. Please upload PDF, image, Word, or text files." };
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const key = `documents/${home.id}/${Date.now()}-${safeName}`;

  try {
    await uploadFile(file, key);
  } catch (err) {
    console.error("[uploadDocument]", err);
    return { error: "Could not upload file. Storage may not be configured." };
  }

  const document = await prisma.document.create({
    data: {
      homeId: home.id,
      userId: session.user.id,
      type: type as DocumentType,
      label,
      fileKey: key,
      fileSize: file.size,
      mimeType: file.type,
    },
  });

  await trackEvent({ event: "document_uploaded", userId: session.user.id, properties: { homeId: home.id, type } });
  await logAudit({ actorId: session.user.id, action: "DOCUMENT_UPLOADED", entityType: "Document", entityId: document.id });

  redirect("/dashboard/documents");
}

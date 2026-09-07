"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { IssueCategory } from "@prisma/client";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { trackEvent } from "@/lib/analytics";
import { logAudit } from "@/lib/audit";
import { hasActiveEntitlement } from "@/lib/entitlements";
import { uploadFile } from "@/lib/storage";
import { DocumentType } from "@prisma/client";

export async function createIssue(_prevState: { error?: string } | null, formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "Not authenticated" };
  }

  const home = await prisma.home.findFirst({
    where: {
      OR: [
        { primaryOwnerId: session.user.id },
        { memberships: { some: { userId: session.user.id } } },
      ],
    },
  });

  if (!home) {
    return { error: "No home found. Please complete onboarding first." };
  }

  if (!(await hasActiveEntitlement(session.user.id))) {
    return { error: "Paid access is paused. Please contact support to reactivate your account." };
  }

  const title = (formData.get("title") as string)?.trim();
  const location = (formData.get("location") as string)?.trim();
  const category = (formData.get("category") as string) || "OTHER";
  const dateNoticed = formData.get("dateNoticed") as string;
  const description = (formData.get("description") as string)?.trim();
  const isRecurring = formData.get("isRecurring") === "on";
  const isWorsening = formData.get("isWorsening") === "on";
  const previousCommunication = (formData.get("previousCommunication") as string)?.trim() || null;
  const previousRepairAttempt = (formData.get("previousRepairAttempt") as string)?.trim() || null;
  const photos = formData.getAll("photos") as File[];

  const maxPhotos = 10;
  const maxPhotoSize = 10 * 1024 * 1024;
  const allowedPhotoTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

  if (photos.length > maxPhotos) {
    return { error: `You can upload up to ${maxPhotos} photos.` };
  }

  for (const photo of photos) {
    if (photo.size > maxPhotoSize) {
      return { error: `Each photo must be smaller than 10 MB.` };
    }
    if (!allowedPhotoTypes.includes(photo.type)) {
      return { error: `Photos must be JPEG, PNG, WebP, or GIF.` };
    }
  }

  if (!title) {
    return { error: "Issue title is required." };
  }

  const issue = await prisma.issue.create({
    data: {
      homeId: home.id,
      userId: session.user.id,
      title,
      location,
      category: category as IssueCategory,
      dateNoticed: dateNoticed ? new Date(dateNoticed) : null,
      description,
      isRecurring,
      isWorsening,
      previousCommunication,
      previousRepairAttempt,
      status: "OPEN",
    },
  });

  for (const photo of photos) {
    const safeName = photo.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `documents/${home.id}/${Date.now()}-${safeName}`;
    try {
      await uploadFile(photo, key);
      await prisma.document.create({
        data: {
          homeId: home.id,
          issueId: issue.id,
          userId: session.user.id,
          type: "ISSUE_PHOTO" as DocumentType,
          label: photo.name,
          fileKey: key,
          fileSize: photo.size,
          mimeType: photo.type,
        },
      });
    } catch (err) {
      console.error("[issue photo upload] failed", err);
    }
  }

  await prisma.issueStatusHistory.create({
    data: {
      issueId: issue.id,
      status: "OPEN",
      changedBy: session.user.id,
      note: "Issue created",
    },
  });

  await trackEvent({ event: "issue_created", userId: session.user.id, properties: { homeId: home.id, category } });
  await logAudit({ actorId: session.user.id, action: "ISSUE_CREATED", entityType: "Issue", entityId: issue.id });

  redirect(`/dashboard/issues/${issue.id}`);
}

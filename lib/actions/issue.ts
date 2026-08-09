"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { IssueCategory } from "@prisma/client";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { trackEvent } from "@/lib/analytics";
import { logAudit } from "@/lib/audit";

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

  const title = (formData.get("title") as string)?.trim();
  const location = (formData.get("location") as string)?.trim();
  const category = (formData.get("category") as string) || "OTHER";
  const dateNoticed = formData.get("dateNoticed") as string;
  const description = (formData.get("description") as string)?.trim();
  const isRecurring = formData.get("isRecurring") === "on";
  const isWorsening = formData.get("isWorsening") === "on";
  const previousCommunication = (formData.get("previousCommunication") as string)?.trim() || null;
  const previousRepairAttempt = (formData.get("previousRepairAttempt") as string)?.trim() || null;

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

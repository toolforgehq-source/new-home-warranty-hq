"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { trackEvent } from "@/lib/analytics";
import { logAudit } from "@/lib/audit";

export async function addIssueComment(_prevState: { error?: string } | null, formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Not authenticated" };

  const issueId = formData.get("issueId") as string;
  const content = (formData.get("content") as string)?.trim();

  if (!issueId || !content) return { error: "Comment is required." };

  const issue = await prisma.issue.findFirst({
    where: {
      id: issueId,
      home: {
        OR: [
          { primaryOwnerId: session.user.id },
          { memberships: { some: { userId: session.user.id } } },
        ],
      },
    },
  });

  if (!issue) return { error: "Issue not found." };

  await prisma.issueComment.create({
    data: {
      issueId,
      userId: session.user.id,
      direction: "HOMEOWNER",
      content,
    },
  });

  await trackEvent({ event: "issue_comment_added", userId: session.user.id, properties: { issueId } });
  await logAudit({ actorId: session.user.id, action: "ISSUE_COMMENT_ADDED", entityType: "Issue", entityId: issueId });

  redirect(`/dashboard/issues/${issueId}`);
}

export async function logBuilderReply(_prevState: { error?: string } | null, formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Not authenticated" };

  const issueId = formData.get("issueId") as string;
  const content = (formData.get("content") as string)?.trim();
  const emailFrom = (formData.get("emailFrom") as string)?.trim() || null;

  if (!issueId || !content) return { error: "Reply content is required." };

  const issue = await prisma.issue.findFirst({
    where: {
      id: issueId,
      home: {
        OR: [
          { primaryOwnerId: session.user.id },
          { memberships: { some: { userId: session.user.id } } },
        ],
      },
    },
  });

  if (!issue) return { error: "Issue not found." };

  await prisma.issueComment.create({
    data: {
      issueId,
      userId: session.user.id,
      direction: "BUILDER",
      content,
      emailFrom,
    },
  });

  await trackEvent({ event: "builder_reply_logged", userId: session.user.id, properties: { issueId } });
  await logAudit({ actorId: session.user.id, action: "BUILDER_REPLY_LOGGED", entityType: "Issue", entityId: issueId });

  redirect(`/dashboard/issues/${issueId}`);
}

export async function createSystemComment({
  issueId,
  content,
}: {
  issueId: string;
  content: string;
}) {
  await prisma.issueComment.create({
    data: {
      issueId,
      direction: "SYSTEM",
      content,
    },
  });
}

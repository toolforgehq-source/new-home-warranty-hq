"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { getIssueReplyAddress } from "@/lib/inbound";
import { generateReplySuggestion } from "@/lib/ai";
import { trackEvent } from "@/lib/analytics";
import { logAudit } from "@/lib/audit";

export async function replyToBuilder(_prevState: { error?: string } | null, formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Not authenticated" };

  const issueId = formData.get("issueId") as string;
  const content = (formData.get("content") as string)?.trim();

  if (!issueId || !content) return { error: "Reply is required." };

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
    include: {
      home: { include: { primaryOwner: true, memberships: { include: { user: true } } } },
      user: true,
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

  const builderEmail = issue.home.builderEmail?.trim();
  if (builderEmail) {
    const fromName = session.user.name || issue.home.primaryOwner?.name || "Homeowner";
    const subject = `Re: Warranty request: ${issue.title} at ${issue.home.address}`;
    await sendEmail({
      to: builderEmail,
      cc: [issue.user?.email, ...issue.home.memberships.map((m) => m.user.email)].filter(Boolean) as string[],
      subject,
      text: `${content}\n\n— ${fromName}\nReply to this email to keep the conversation recorded in New Home Warranty HQ.`,
      html: `<div style="font-family: sans-serif; padding: 16px;"><p style="white-space: pre-line;">${escapeHtml(content)}</p><hr/><p>— ${escapeHtml(fromName)}<br/>Reply to this email to keep the conversation recorded in New Home Warranty HQ.</p></div>`,
      replyTo: getIssueReplyAddress(issue.id),
    });
  }

  await trackEvent({ event: "issue_reply_sent", userId: session.user.id, properties: { issueId } });
  await logAudit({ actorId: session.user.id, action: "ISSUE_REPLY_SENT", entityType: "Issue", entityId: issueId });

  redirect(`/dashboard/issues/${issueId}`);
}

export async function suggestReply(_prevState: { suggestion?: string; error?: string } | null, formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Not authenticated" };

  const issueId = formData.get("issueId") as string;
  const builderMessage = (formData.get("builderMessage") as string)?.trim() || undefined;

  if (!issueId) return { error: "Issue ID is required." };

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

  try {
    const suggestion = await generateReplySuggestion({ issueId, builderMessage });
    return { suggestion };
  } catch (err) {
    console.error("[suggestReply] error", err);
    return { error: err instanceof Error ? err.message : "Could not generate suggestion." };
  }
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

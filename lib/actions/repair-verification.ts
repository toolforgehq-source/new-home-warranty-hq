"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { RepairVerificationStatus, IssueStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { trackEvent } from "@/lib/analytics";
import { logAudit } from "@/lib/audit";
import { hasActiveEntitlement } from "@/lib/entitlements";

function nextIssueStatus(verification: RepairVerificationStatus): IssueStatus {
  if (verification === "FULLY_RESOLVED") return "RESOLVED";
  if (verification === "NOT_RESOLVED" || verification === "ISSUE_RETURNED" || verification === "NEW_DAMAGE") return "OPEN";
  return "SCHEDULED";
}

export async function createRepairVerification(
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Not authenticated" };

  const issueId = formData.get("issueId") as string;
  const status = (formData.get("status") as string) || "NEED_MORE_TIME";
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!Object.values(RepairVerificationStatus).includes(status as RepairVerificationStatus)) {
    return { error: "Invalid verification status" };
  }

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

  if (!issue) return { error: "Issue not found" };

  if (!(await hasActiveEntitlement(session.user.id))) {
    return { error: "Paid access is paused. Please contact support to reactivate your account." };
  }

  const verificationStatus = status as RepairVerificationStatus;
  const newIssueStatus = nextIssueStatus(verificationStatus);

  await prisma.$transaction(async (tx) => {
    await tx.repairVerification.create({
      data: {
        issueId,
        status: verificationStatus,
        notes,
        createdBy: session.user.id,
        verifiedAt: new Date(),
      },
    });

    await tx.issue.update({
      where: { id: issueId },
      data: {
        status: newIssueStatus,
        resolvedAt: newIssueStatus === "RESOLVED" ? new Date() : issue.resolvedAt,
        resolutionNotes: newIssueStatus === "RESOLVED" ? notes : issue.resolutionNotes,
      },
    });

    await tx.issueStatusHistory.create({
      data: {
        issueId,
        status: newIssueStatus,
        changedBy: session.user.id,
        note: `Repair verification: ${verificationStatus.toLowerCase().replace(/_/g, " ")}`,
      },
    });
  });

  await trackEvent({ event: "repair_verified", userId: session.user.id, properties: { issueId, status: verificationStatus } });
  await logAudit({ actorId: session.user.id, action: "REPAIR_VERIFIED", entityType: "Issue", entityId: issueId });

  redirect(`/dashboard/issues/${issueId}`);
}

"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SubmissionMethod } from "@prisma/client";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function createSubmissionRecord(
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Not authenticated" };

  const issueId = formData.get("issueId") as string;
  const warrantyRequestId = (formData.get("warrantyRequestId") as string) || null;
  const method = (formData.get("method") as string) || "EMAIL";
  const destination = (formData.get("destination") as string)?.trim() || null;
  const message = (formData.get("message") as string)?.trim() || "";
  const confirmationNumber = (formData.get("confirmationNumber") as string)?.trim() || null;

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
    include: { home: true },
  });

  if (!issue) return { error: "Issue not found" };

  await prisma.$transaction(async (tx) => {
    await tx.submissionRecord.create({
      data: {
        issueId,
        warrantyRequestId,
        method: method as SubmissionMethod,
        destination,
        message,
        confirmationNumber,
        sentFromHomeowner: true,
        sentAt: new Date(),
        submittedBy: session.user.id,
      },
    });

    await tx.issueStatusHistory.create({
      data: {
        issueId,
        status: "SUBMITTED",
        changedBy: session.user.id,
        note: `Submitted via ${method.toLowerCase()}`,
      },
    });

    await tx.issue.update({
      where: { id: issueId },
      data: { status: "SUBMITTED" },
    });

    if (warrantyRequestId) {
      await tx.warrantyRequest.update({
        where: { id: warrantyRequestId },
        data: { status: "SENT", sentAt: new Date() },
      });
    }
  });

  redirect(`/dashboard/issues/${issueId}`);
}

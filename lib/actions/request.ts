"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function generateWarrantyRequest(
  _prevState: { request?: any; error?: string } | null,
  formData: FormData
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Not authenticated" };

  const issueId = formData.get("issueId") as string;
  const requestedNextStep = (formData.get("requestedNextStep") as string)?.trim() ||
    "Please inspect and advise on the appropriate warranty process.";

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
    include: { home: true, user: true },
  });

  if (!issue) return { error: "Issue not found" };

  const builderName = issue.home.builderName;
  const homeAddress = issue.home.address;
  const homeownerName = issue.user.name || session.user.name;

  const content = `Dear ${builderName} Warranty Department,

I am writing to provide written notice of a condition at my home located at ${homeAddress}.

Issue: ${issue.title}
Location: ${issue.location || "Not specified"}
Category: ${issue.category.replace("_", " / ")}
Date first noticed: ${issue.dateNoticed ? new Date(issue.dateNoticed).toLocaleDateString() : "Not recorded"}

Description:
${issue.description || "No additional description provided."}

${issue.previousCommunication ? `Previous communication:\n${issue.previousCommunication}\n\n` : ""}${issue.previousRepairAttempt ? `Previous repair attempt:\n${issue.previousRepairAttempt}\n\n` : ""}Requested next step:
${requestedNextStep}

Please confirm the applicable warranty process and provide the appropriate inspection or response.

Thank you,
${homeownerName}
${issue.user.email || session.user.email}
`;

  const warrantyRequest = await prisma.warrantyRequest.create({
    data: {
      homeId: issue.homeId,
      issueId: issue.id,
      generatedContent: content,
      requestedNextStep,
      createdBy: session.user.id,
      status: "DRAFT",
    },
  });

  return { request: warrantyRequest };
}

export async function approveRequest(_prevState: { error?: string } | null, formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Not authenticated" };

  const requestId = formData.get("requestId") as string;
  const action = formData.get("action") as string; // "email_app" | "copy" | "portal"

  const warrantyRequest = await prisma.warrantyRequest.findFirst({
    where: {
      id: requestId,
      home: {
        OR: [
          { primaryOwnerId: session.user.id },
          { memberships: { some: { userId: session.user.id } } },
        ],
      },
    },
  });

  if (!warrantyRequest) return { error: "Request not found" };

  await prisma.warrantyRequest.update({
    where: { id: warrantyRequest.id },
    data: { status: "APPROVED", approvedAt: new Date() },
  });

  return { ok: true };
}

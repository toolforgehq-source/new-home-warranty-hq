"use server";

import { headers } from "next/headers";
import { renderToBuffer, DocumentProps } from "@react-pdf/renderer";
import { createElement } from "react";
import type { ReactElement } from "react";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { WarrantyRequestPDF } from "@/lib/pdf/warranty-request";
import { getSignedDownloadUrl } from "@/lib/storage";
import { hasActiveEntitlement } from "@/lib/entitlements";
import { trackEvent } from "@/lib/analytics";
import { logAudit } from "@/lib/audit";
import { createSystemComment } from "./comment";

export async function sendWarrantyRequestToBuilder(
  _prevState: { ok?: boolean; error?: string } | null,
  formData: FormData
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Not authenticated" };

  const requestId = formData.get("requestId") as string;
  const builderEmailOverride = (formData.get("builderEmail") as string)?.trim() || null;

  if (!requestId) return { error: "Request ID is required." };

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
    include: {
      home: true,
      issue: {
        include: {
          documents: { where: { type: "ISSUE_PHOTO", status: "ACTIVE" }, orderBy: { uploadedAt: "asc" } },
          user: true,
        },
      },
    },
  });

  if (!warrantyRequest) return { error: "Request not found." };
  if (warrantyRequest.status !== "APPROVED") return { error: "Request must be approved before sending." };

  if (!(await hasActiveEntitlement(session.user.id))) {
    return { error: "Paid access is paused. Please contact support to reactivate your account." };
  }

  const builderEmail = builderEmailOverride || warrantyRequest.home.builderEmail;
  if (!builderEmail) return { error: "Builder email is required. Add it in Home details." };

  const homeownerName = warrantyRequest.issue?.user?.name || session.user.name || "Homeowner";
  const homeownerEmail = warrantyRequest.issue?.user?.email || session.user.email;
  const issueTitle = warrantyRequest.issue?.title || "Home warranty issue";

  const pdfElement = createElement(WarrantyRequestPDF, {
    request: {
      generatedContent: warrantyRequest.generatedContent,
      requestedNextStep: warrantyRequest.requestedNextStep,
      home: { address: warrantyRequest.home.address, builderName: warrantyRequest.home.builderName },
      issue: warrantyRequest.issue
        ? {
            title: warrantyRequest.issue.title,
            location: warrantyRequest.issue.location,
            dateNoticed: warrantyRequest.issue.dateNoticed,
            description: warrantyRequest.issue.description,
          }
        : null,
    },
  }) as unknown as ReactElement<DocumentProps>;

  const pdfBuffer = await renderToBuffer(pdfElement);

  const photoAttachments = [];
  for (const doc of warrantyRequest.issue?.documents ?? []) {
    try {
      const url = await getSignedDownloadUrl(doc.fileKey, 60 * 60);
      photoAttachments.push({
        filename: doc.label || `photo-${doc.id}.jpg`,
        path: url,
        contentType: doc.mimeType || "image/jpeg",
      });
    } catch (err) {
      console.error("[send warranty request] failed to sign photo", doc.id, err);
    }
  }

  const attachments = [
    {
      filename: `warranty-request-${warrantyRequest.id.slice(-6)}.pdf`,
      content: pdfBuffer,
      contentType: "application/pdf",
    },
    ...photoAttachments,
  ];

  const subject = `Warranty request: ${issueTitle} at ${warrantyRequest.home.address}`;
  const text = `Dear ${warrantyRequest.home.builderName} Warranty Department,\n\nPlease see the attached warranty request and photos regarding the above property.\n\nRequested next step:\n${warrantyRequest.requestedNextStep || "Please inspect and advise on the appropriate warranty process."}\n\nPlease reply directly to ${homeownerEmail} with your response.\n\n— New Home Warranty HQ (on behalf of ${homeownerName})`;
  const html = `<p>Dear ${escapeHtml(warrantyRequest.home.builderName)} Warranty Department,</p><p>Please see the attached warranty request and photos regarding <strong>${escapeHtml(warrantyRequest.home.address)}</strong>.</p><p>Requested next step:<br/>${escapeHtml(warrantyRequest.requestedNextStep || "Please inspect and advise on the appropriate warranty process.")}</p><p>Please reply directly to <a href="mailto:${escapeHtml(homeownerEmail)}">${escapeHtml(homeownerEmail)}</a> with your response.</p><p>— New Home Warranty HQ (on behalf of ${escapeHtml(homeownerName)})</p>`;

  try {
    await sendEmail({
      to: builderEmail,
      cc: homeownerEmail,
      subject,
      text,
      html,
      replyTo: homeownerEmail,
      attachments,
    });
  } catch (err) {
    console.error("[send warranty request] email failed", err);
    return { error: "Could not send the email. Please try again." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.warrantyRequest.update({
      where: { id: warrantyRequest.id },
      data: { status: "SENT", sentAt: new Date() },
    });

    if (warrantyRequest.issueId) {
      await tx.submissionRecord.create({
        data: {
          issueId: warrantyRequest.issueId,
          warrantyRequestId: warrantyRequest.id,
          method: "EMAIL",
          destination: builderEmail,
          message: warrantyRequest.generatedContent,
          submittedBy: session.user.id,
          sentFromHomeowner: true,
          sentAt: new Date(),
        },
      });

      await tx.issue.update({
        where: { id: warrantyRequest.issueId },
        data: { status: "SUBMITTED" },
      });

      await tx.issueStatusHistory.create({
        data: {
          issueId: warrantyRequest.issueId,
          status: "SUBMITTED",
          changedBy: session.user.id,
          note: `Sent to builder at ${builderEmail}`,
        },
      });
    }

    if (builderEmailOverride) {
      await tx.home.update({
        where: { id: warrantyRequest.homeId },
        data: { builderEmail: builderEmailOverride },
      });
    }
  });

  if (warrantyRequest.issueId) {
    await createSystemComment({
      issueId: warrantyRequest.issueId,
      content: `Warranty request sent to ${builderEmail} with PDF and ${photoAttachments.length} photo(s).`,
    });
  }

  await trackEvent({ event: "warranty_request_sent", userId: session.user.id, properties: { requestId: warrantyRequest.id, issueId: warrantyRequest.issueId } });
  await logAudit({ actorId: session.user.id, action: "WARRANTY_REQUEST_SENT", entityType: "WarrantyRequest", entityId: warrantyRequest.id });

  return { ok: true };
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

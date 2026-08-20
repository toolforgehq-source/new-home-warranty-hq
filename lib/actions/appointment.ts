"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { trackEvent } from "@/lib/analytics";
import { logAudit } from "@/lib/audit";
import { hasActiveEntitlement } from "@/lib/entitlements";
import { sendEmail } from "@/lib/email";
import { APP_URL } from "@/lib/stripe";

export async function createAppointment(
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Not authenticated" };

  const issueId = formData.get("issueId") as string;
  const appointmentDate = formData.get("appointmentDate") as string;
  const expectedRepairDate = (formData.get("expectedRepairDate") as string) || null;
  const builderRepresentative = (formData.get("builderRepresentative") as string)?.trim() || null;
  const trade = (formData.get("trade") as string)?.trim() || null;
  const promisedActions = (formData.get("promisedActions") as string)?.trim() || null;
  const partsOrdered = (formData.get("partsOrdered") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;
  const proposeToBuilder = formData.get("proposeToBuilder") === "on";

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

  if (!(await hasActiveEntitlement(session.user.id))) {
    return { error: "Paid access is paused. Please contact support to reactivate your account." };
  }

  const builderEmail = proposeToBuilder ? (issue.home.builderEmail?.trim() || null) : null;
  if (proposeToBuilder && !builderEmail) {
    return { error: "Builder email is required to propose an appointment. Add it in Home details." };
  }

  const appointment = await prisma.appointment.create({
    data: {
      issueId,
      appointmentDate: appointmentDate ? new Date(appointmentDate) : null,
      expectedRepairDate: expectedRepairDate ? new Date(expectedRepairDate) : null,
      builderRepresentative,
      trade,
      promisedActions,
      partsOrdered,
      notes,
      status: proposeToBuilder ? "PROPOSED" : "CONFIRMED",
      confirmationToken: proposeToBuilder ? crypto.randomUUID() : null,
    },
  });

  if (proposeToBuilder) {
    const confirmUrl = `${APP_URL}/api/appointments/confirm?token=${appointment.confirmationToken}`;
    const homeownerName = issue.user?.name || session.user.name;
    const homeownerEmail = issue.user?.email || session.user.email;
    const subject = `Appointment request: ${issue.title} at ${issue.home.address}`;
    const text = `Hello,\n\n${homeownerName} has requested an appointment to address the following issue at ${issue.home.address}:\n\n${issue.title}\n\nProposed date: ${appointment.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString() : "To be scheduled"}\n\nPlease confirm the appointment by clicking this link:\n${confirmUrl}\n\nIf the date does not work, please reply directly to ${homeownerEmail}.\n\n— New Home Warranty HQ`;
    const html = `<p>Hello,</p><p>${escapeHtml(homeownerName ?? "The homeowner")} has requested an appointment to address the following issue at <strong>${escapeHtml(issue.home.address)}</strong>:</p><p>${escapeHtml(issue.title)}</p><p>Proposed date: ${appointment.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString() : "To be scheduled"}</p><p><a href="${confirmUrl}">Confirm appointment</a></p><p>If the date does not work, please reply directly to <a href="mailto:${escapeHtml(homeownerEmail)}">${escapeHtml(homeownerEmail)}</a>.</p><p>— New Home Warranty HQ</p>`;

    try {
      await sendEmail({
        to: builderEmail!,
        cc: homeownerEmail,
        subject,
        text,
        html,
        replyTo: homeownerEmail,
      });
    } catch (err) {
      console.error("[appointment proposal email] failed", err);
      await prisma.appointment.delete({ where: { id: appointment.id } });
      return { error: "Could not send the appointment proposal. Please try again." };
    }
  } else if (issue.status !== "SCHEDULED" && issue.status !== "RESOLVED") {
    await prisma.issue.update({
      where: { id: issueId },
      data: { status: "SCHEDULED" },
    });

    await prisma.issueStatusHistory.create({
      data: {
        issueId,
        status: "SCHEDULED",
        changedBy: session.user.id,
        note: "Appointment scheduled",
      },
    });
  }

  await trackEvent({ event: "appointment_created", userId: session.user.id, properties: { issueId, proposed: proposeToBuilder } });
  await logAudit({ actorId: session.user.id, action: "APPOINTMENT_CREATED", entityType: "Issue", entityId: issueId });

  redirect(`/dashboard/issues/${issueId}`);
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

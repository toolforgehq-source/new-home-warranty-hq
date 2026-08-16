"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { trackEvent } from "@/lib/analytics";
import { logAudit } from "@/lib/audit";
import { hasActiveEntitlement } from "@/lib/entitlements";

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
    include: { appointments: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  if (!issue) return { error: "Issue not found" };

  if (!(await hasActiveEntitlement(session.user.id))) {
    return { error: "Paid access is paused. Please contact support to reactivate your account." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.appointment.create({
      data: {
        issueId,
        appointmentDate: appointmentDate ? new Date(appointmentDate) : null,
        expectedRepairDate: expectedRepairDate ? new Date(expectedRepairDate) : null,
        builderRepresentative,
        trade,
        promisedActions,
        partsOrdered,
        notes,
      },
    });

    if (issue.status !== "SCHEDULED" && issue.status !== "RESOLVED") {
      await tx.issue.update({
        where: { id: issueId },
        data: { status: "SCHEDULED" },
      });

      await tx.issueStatusHistory.create({
        data: {
          issueId,
          status: "SCHEDULED",
          changedBy: session.user.id,
          note: "Appointment scheduled",
        },
      });
    }
  });

  await trackEvent({ event: "appointment_scheduled", userId: session.user.id, properties: { issueId } });
  await logAudit({ actorId: session.user.id, action: "APPOINTMENT_SCHEDULED", entityType: "Issue", entityId: issueId });

  redirect(`/dashboard/issues/${issueId}`);
}

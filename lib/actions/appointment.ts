"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

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

  redirect(`/dashboard/issues/${issueId}`);
}

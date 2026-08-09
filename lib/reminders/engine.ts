import prisma from "@/lib/prisma";
import { ReminderType } from "@prisma/client";

type Candidate = {
  userId: string;
  homeId?: string;
  issueId?: string;
  type: ReminderType;
  dueDate: Date;
};

async function hasPendingReminder(userId: string, type: ReminderType, issueId: string | undefined) {
  return prisma.reminder.findFirst({
    where: {
      userId,
      type,
      issueId: issueId ?? null,
      status: { in: ["PENDING", "SENT"] },
      dueDate: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });
}

async function createIfNeeded(candidate: Candidate) {
  const existing = await hasPendingReminder(candidate.userId, candidate.type, candidate.issueId);
  if (existing) return null;

  return prisma.reminder.create({
    data: {
      userId: candidate.userId,
      homeId: candidate.homeId,
      issueId: candidate.issueId,
      type: candidate.type,
      dueDate: candidate.dueDate,
    },
  });
}

export async function generateReminders() {
  const now = new Date();
  const created: string[] = [];

  // Open issues that have not been submitted within 48 hours
  const openIssues = await prisma.issue.findMany({
    where: { status: "OPEN" },
    include: { home: true },
  });

  for (const issue of openIssues) {
    const hoursOpen = (now.getTime() - issue.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursOpen >= 48) {
      const reminder = await createIfNeeded({
        userId: issue.home.primaryOwnerId,
        homeId: issue.homeId,
        issueId: issue.id,
        type: "SUBMISSION_PENDING",
        dueDate: now,
      });
      if (reminder) created.push(reminder.id);
    }
  }

  // Submitted issues with no response within 72 hours
  const submittedIssues = await prisma.issue.findMany({
    where: { status: "SUBMITTED" },
    include: { home: true, submissionRecords: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  for (const issue of submittedIssues) {
    const lastSubmission = issue.submissionRecords[0];
    if (!lastSubmission) continue;
    const hoursSince = (now.getTime() - lastSubmission.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSince >= 72) {
      const reminder = await createIfNeeded({
        userId: issue.home.primaryOwnerId,
        homeId: issue.homeId,
        issueId: issue.id,
        type: "BUILDER_RESPONSE_PENDING",
        dueDate: now,
      });
      if (reminder) created.push(reminder.id);
    }
  }

  // Upcoming appointments within 24 hours
  const upcomingAppointments = await prisma.appointment.findMany({
    where: {
      appointmentDate: {
        gte: now,
        lte: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      },
    },
    include: { issue: { include: { home: true } } },
  });

  for (const appt of upcomingAppointments) {
    const reminder = await createIfNeeded({
      userId: appt.issue.home.primaryOwnerId,
      homeId: appt.issue.homeId,
      issueId: appt.issueId,
      type: "APPOINTMENT_UPCOMING",
      dueDate: new Date(appt.appointmentDate!.getTime() - 12 * 60 * 60 * 1000),
    });
    if (reminder) created.push(reminder.id);
  }

  // Expected repair date passed by 1 day and not resolved
  const staleAppointments = await prisma.appointment.findMany({
    where: {
      expectedRepairDate: { lte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
    },
    include: { issue: { include: { home: true, repairVerifications: { orderBy: { createdAt: "desc" }, take: 1 } } } },
  });

  for (const appt of staleAppointments) {
    if (appt.issue.status === "RESOLVED") continue;
    const latestVerification = appt.issue.repairVerifications[0];
    if (latestVerification && latestVerification.createdAt > new Date(now.getTime() - 24 * 60 * 60 * 1000)) continue;
    const reminder = await createIfNeeded({
      userId: appt.issue.home.primaryOwnerId,
      homeId: appt.issue.homeId,
      issueId: appt.issueId,
      type: "REPAIR_COMPLETED_VERIFY",
      dueDate: now,
    });
    if (reminder) created.push(reminder.id);
  }

  // Warranty review 30 days before recommended 11-month review
  const homes = await prisma.home.findMany({
    include: {
      primaryOwner: true,
      entitlements: true,
      documents: true,
    },
  });

  for (const home of homes) {
    const closing = home.closingDate;
    const reviewDate = new Date(closing.getFullYear(), closing.getMonth() + 11, closing.getDate());
    const reminderDue = new Date(reviewDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (now >= reminderDue && now <= reviewDate) {
      const reminder = await createIfNeeded({
        userId: home.primaryOwnerId,
        homeId: home.id,
        type: "WARRANTY_REVIEW_UPCOMING",
        dueDate: reminderDue,
      });
      if (reminder) created.push(reminder.id);
    }

    // Missing builder warranty document after 7 days
    const hasWarrantyDoc = home.documents.some((d) => d.type === "BUILDER_WARRANTY");
    const daysSinceClosing = (now.getTime() - closing.getTime()) / (1000 * 60 * 60 * 24);
    if (!hasWarrantyDoc && daysSinceClosing >= 7) {
      const reminder = await createIfNeeded({
        userId: home.primaryOwnerId,
        homeId: home.id,
        type: "DOCUMENT_MISSING",
        dueDate: now,
      });
      if (reminder) created.push(reminder.id);
    }
  }

  return created;
}

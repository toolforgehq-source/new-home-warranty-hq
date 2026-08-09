import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

const reminderSubjects: Record<string, string> = {
  SUBMISSION_PENDING: "Reminder: submit your warranty request",
  BUILDER_RESPONSE_PENDING: "Reminder: follow up on your warranty request",
  APPOINTMENT_UPCOMING: "Upcoming appointment",
  REPAIR_COMPLETED_VERIFY: "Was the repair completed?",
  UNRESOLVED_ISSUES: "You have unresolved warranty issues",
  WARRANTY_REVIEW_UPCOMING: "Your recommended warranty review is coming up",
  DOCUMENT_MISSING: "Reminder: request your builder warranty documents",
  FINAL_REVIEW: "Final warranty review",
};

export async function deliverDueReminders() {
  const now = new Date();
  const due = await prisma.reminder.findMany({
    where: {
      status: "PENDING",
      dueDate: { lte: now },
    },
    include: { user: true, issue: true, home: true },
  });

  const results: { reminderId: string; ok: boolean; error?: string }[] = [];

  for (const reminder of due) {
    const subject = reminderSubjects[reminder.type] ?? "New Home Warranty HQ Reminder";
    const issueTitle = reminder.issue?.title ?? "your issue";
    const homeAddress = reminder.home?.address ?? "your home";
    const text = `Hi ${reminder.user.name || ""},\n\nThis is a reminder about ${issueTitle} at ${homeAddress}.\n\nOpen your dashboard to take action: http://localhost:3000/dashboard\n\n— New Home Warranty HQ`;

    try {
      await sendEmail({
        to: reminder.user.email,
        subject,
        text,
      });

      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { status: "SENT", sentAt: new Date() },
      });

      results.push({ reminderId: reminder.id, ok: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[reminder delivery]", reminder.id, message);
      results.push({ reminderId: reminder.id, ok: false, error: message });
    }
  }

  return results;
}

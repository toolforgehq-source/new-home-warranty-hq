import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { APP_URL } from "@/lib/stripe";

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
    const dashboardUrl = `${APP_URL}/dashboard`;
    const text = `Hi ${reminder.user.name || ""},\n\nThis is a reminder about ${issueTitle} at ${homeAddress}.\n\nOpen your dashboard to take action: ${dashboardUrl}\n\n— New Home Warranty HQ`;

    try {
      const emailResult = await sendEmail({
        to: reminder.user.email,
        subject,
        text,
      });

      if (emailResult && typeof emailResult === "object" && "skipped" in emailResult) {
        throw new Error("Email not sent: Resend is not configured");
      }

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

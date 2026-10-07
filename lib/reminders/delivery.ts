import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { APP_URL } from "@/lib/stripe";
import { COVERAGE_KINDS, formatCoverageDate, formatTerm } from "@/lib/warranty-windows";

const reminderSubjects: Record<string, string> = {
  SUBMISSION_PENDING: "Reminder: submit your warranty request",
  BUILDER_RESPONSE_PENDING: "Reminder: follow up on your warranty request",
  APPOINTMENT_UPCOMING: "Upcoming appointment",
  REPAIR_COMPLETED_VERIFY: "Was the repair completed?",
  UNRESOLVED_ISSUES: "You have unresolved warranty issues",
  WARRANTY_REVIEW_UPCOMING: "Your recommended warranty review is coming up",
  DOCUMENT_MISSING: "Reminder: request your builder warranty documents",
  FINAL_REVIEW: "Final warranty review",
  COVERAGE_ENDING: "Your builder warranty coverage ends soon",
};

type CoverageMetadata = { coverage?: string; months?: number; endsAt?: string };

function coverageReminderContent(metadata: unknown, homeAddress: string, dashboardUrl: string) {
  const meta = (metadata ?? {}) as CoverageMetadata;
  const kind = COVERAGE_KINDS.find((k) => k.key === meta.coverage);
  if (!kind || !meta.endsAt || !meta.months) return null;
  const endsAt = new Date(meta.endsAt);
  const endsOn = formatCoverageDate(endsAt);
  const daysLeft = Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
  const subject = `${kind.label} coverage ends ${endsOn} (${daysLeft} days)`;
  const text = `Your builder's ${kind.label.toLowerCase()} coverage at ${homeAddress} ends on ${endsOn}, ${daysLeft} days from now. That's ${formatTerm(meta.months)} from your closing date, the term in your home details.\n\nIt usually covers ${kind.examples}. If anything like that still isn't right, report it to your builder before the coverage ends. Your builder's warranty document has the exact terms.\n\nReport an issue or review open items: ${dashboardUrl}\n\n— New Home Warranty HQ`;
  return { subject, text };
}

export async function deliverDueReminders() {
  const now = new Date();
  const due = await prisma.reminder.findMany({
    where: {
      status: "PENDING",
      dueDate: { lte: now },
    },
    include: { user: { include: { reminderSetting: true } }, issue: true, home: true },
  });

  const results: { reminderId: string; ok: boolean; error?: string }[] = [];

  for (const reminder of due) {
    if (reminder.user.reminderSetting && !reminder.user.reminderSetting.emailEnabled) {
      await prisma.reminder.update({ where: { id: reminder.id }, data: { status: "DISMISSED" } });
      continue;
    }

    const subject = reminderSubjects[reminder.type] ?? "New Home Warranty HQ Reminder";
    const issueTitle = reminder.issue?.title ?? "your issue";
    const homeAddress = reminder.home?.address ?? "your home";
    const dashboardUrl = reminder.issueId ? `${APP_URL}/dashboard/issues/${reminder.issueId}` : `${APP_URL}/dashboard`;
    const text = `Hi ${reminder.user.name || ""},\n\nThis is a reminder about ${issueTitle} at ${homeAddress}.\n\nOpen your dashboard to take action: ${dashboardUrl}\n\n— New Home Warranty HQ`;
    const coverage =
      reminder.type === "COVERAGE_ENDING"
        ? coverageReminderContent(reminder.metadata, homeAddress, dashboardUrl)
        : null;

    try {
      const emailResult = await sendEmail({
        to: reminder.user.email,
        subject: coverage?.subject ?? subject,
        text: coverage ? `Hi ${reminder.user.name || ""},\n\n${coverage.text}` : text,
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

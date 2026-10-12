import { formatAppointmentWhen } from "@/lib/date";

export type ProgressStep = { label: string; when: string; done: boolean };

type ProgressInput = {
  status: string;
  createdAt: Date;
  resolvedAt?: Date | null;
  statusHistory: { status: string; createdAt: Date }[];
  submissionRecords: { createdAt: Date; sentAt?: Date | null }[];
  appointments: {
    appointmentDate: Date | null;
    appointmentStartTime: string | null;
    appointmentEndTime: string | null;
    createdAt: Date;
  }[];
};

export function formatShortDate(date: Date, timeZone?: string): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone });
}

function earliest(dates: (Date | null | undefined)[]): Date | null {
  const valid = dates.filter((d): d is Date => d instanceof Date);
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => (a.getTime() <= b.getTime() ? a : b));
}

function latestBy<T>(items: T[], key: (item: T) => Date): T | null {
  return items.reduce<T | null>((best, item) => (!best || key(item) > key(best) ? item : best), null);
}

/** Reported → Sent to builder → Appointment → Resolved, with the date each step happened. */
export function getIssueProgress(issue: ProgressInput): ProgressStep[] {
  const historyDate = (status: string) =>
    earliest(issue.statusHistory.filter((h) => h.status === status).map((h) => h.createdAt));

  const sentAt = earliest([
    ...issue.submissionRecords.map((r) => r.sentAt ?? r.createdAt),
    historyDate("SUBMITTED"),
  ]);

  const appointment = latestBy(issue.appointments, (a) => a.createdAt);
  const resolved = issue.status === "RESOLVED";
  const resolvedAt = resolved ? (issue.resolvedAt ?? latestBy(
    issue.statusHistory.filter((h) => h.status === "RESOLVED"),
    (h) => h.createdAt
  )?.createdAt ?? null) : null;

  return [
    { label: "Reported", when: formatShortDate(issue.createdAt), done: true },
    { label: "Sent to builder", when: sentAt ? formatShortDate(sentAt) : "Not sent yet", done: Boolean(sentAt) },
    {
      label: "Appointment",
      when: appointment
        ? formatAppointmentWhen(appointment.appointmentDate, appointment.appointmentStartTime, appointment.appointmentEndTime, "Date to be set")
        : "Not scheduled",
      done: Boolean(appointment?.appointmentDate),
    },
    {
      label: "Resolved",
      when: resolvedAt ? formatShortDate(resolvedAt) : appointment ? "Awaiting your confirmation" : "Open",
      done: resolved,
    },
  ];
}

/** "Jane Doe <jane@builder.com>" → "Jane Doe"; bare addresses fall back to the builder name. */
export function builderSenderLabel(emailFrom: string | null, builderName: string): string {
  if (!emailFrom) return builderName;
  const name = emailFrom.match(/^\s*"?([^"<]+?)"?\s*</)?.[1]?.trim();
  if (name && !name.includes("@")) return name;
  return builderName;
}

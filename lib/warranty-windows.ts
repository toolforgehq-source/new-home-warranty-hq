const DAY_MS = 24 * 60 * 60 * 1000;

export const COVERAGE_KINDS = [
  {
    key: "WORKMANSHIP",
    field: "workmanshipWarrantyMonths",
    label: "Workmanship & materials",
    examples: "drywall, paint, trim, doors, cabinets, and flooring",
  },
  {
    key: "SYSTEMS",
    field: "systemsWarrantyMonths",
    label: "Plumbing, electrical & HVAC",
    examples: "plumbing, electrical, and heating and cooling systems",
  },
  {
    key: "STRUCTURAL",
    field: "structuralWarrantyMonths",
    label: "Structural",
    examples: "the foundation, framing, and other load-bearing parts of the home",
  },
] as const;

export type CoverageKey = (typeof COVERAGE_KINDS)[number]["key"];
export type CoverageField = (typeof COVERAGE_KINDS)[number]["field"];

export type CoverageTerms = { closingDate: Date } & Partial<Record<CoverageField, number | null>>;

export type CoverageWindow = {
  key: CoverageKey;
  label: string;
  examples: string;
  months: number;
  endsAt: Date;
  daysLeft: number;
  ended: boolean;
};

// Days before a coverage window ends that a reminder is sent.
export const COVERAGE_REMINDER_DAYS = [60, 14] as const;

export const COVERAGE_TERM_OPTIONS = [6, 12, 18, 24, 36, 60, 120];

/** Closing dates are date-only values stored as UTC midnight; the end day is clamped to the month's last day. */
export function addMonthsUtc(date: Date, months: number): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + months;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(date.getUTCDate(), lastDay)));
}

export function formatTerm(months: number): string {
  if (months % 12 === 0) {
    const years = months / 12;
    return `${years} year${years === 1 ? "" : "s"}`;
  }
  return `${months} month${months === 1 ? "" : "s"}`;
}

export function getCoverageWindows(home: CoverageTerms, now = new Date()): CoverageWindow[] {
  const windows: CoverageWindow[] = [];
  for (const kind of COVERAGE_KINDS) {
    const months = home[kind.field];
    if (!months || months <= 0) continue;
    const endsAt = addMonthsUtc(home.closingDate, months);
    const daysLeft = Math.ceil((endsAt.getTime() - now.getTime()) / DAY_MS);
    windows.push({
      key: kind.key,
      label: kind.label,
      examples: kind.examples,
      months,
      endsAt,
      daysLeft: Math.max(0, daysLeft),
      ended: daysLeft <= 0,
    });
  }
  return windows;
}

/** The most recent reminder stage that is due for this window, or null if none is due yet or it has ended. */
export function dueCoverageReminder(
  window: CoverageWindow,
  now = new Date()
): { daysBefore: number; dueDate: Date } | null {
  if (window.ended) return null;
  for (const daysBefore of [...COVERAGE_REMINDER_DAYS].sort((a, b) => a - b)) {
    const dueDate = new Date(window.endsAt.getTime() - daysBefore * DAY_MS);
    if (now >= dueDate) return { daysBefore, dueDate };
  }
  return null;
}

export function parseCoverageMonths(value: unknown): number | null | "invalid" {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const months = Number(trimmed);
  if (!Number.isInteger(months) || months < 1 || months > 600) return "invalid";
  return months;
}

export function formatCoverageDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

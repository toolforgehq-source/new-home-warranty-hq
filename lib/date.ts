export function daysSince(date: Date): number {
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)));
}

export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, date.getDate());
}

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Accepts an `<input type="time">` value ("HH:MM", 24h) and returns it normalized, or null. */
export function parseTimeInput(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, 5);
  return TIME_PATTERN.test(trimmed) ? trimmed : null;
}

export function formatTime12h(time: string): string {
  const match = time.match(TIME_PATTERN);
  if (!match) return time;
  const hours = Number(match[1]);
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${match[2]} ${suffix}`;
}

// Appointment dates come from date-only inputs and are stored as UTC midnight; times are the
// home's local wall-clock time, so neither is converted between time zones.
export function formatAppointmentWhen(
  date: Date | string | null | undefined,
  startTime?: string | null,
  endTime?: string | null,
  fallback = "To be scheduled"
): string {
  if (!date) return fallback;
  const day = new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  if (!startTime) return day;
  const window = endTime ? `${formatTime12h(startTime)} – ${formatTime12h(endTime)}` : formatTime12h(startTime);
  return `${day}, ${window}`;
}

import { describe, it, expect } from "vitest";
import { daysSince, addMonths, parseTimeInput, formatTime12h, formatAppointmentWhen } from "@/lib/date";

describe("daysSince", () => {
  it("returns 0 for a future date", () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
    expect(daysSince(future)).toBe(0);
  });

  it("returns the number of full days since a past date", () => {
    const past = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    expect(daysSince(past)).toBe(3);
  });
});

describe("addMonths", () => {
  it("adds months to a date", () => {
    const date = new Date(2024, 0, 15);
    expect(addMonths(date, 11).getMonth()).toBe(11);
  });
});

describe("appointment time helpers", () => {
  it("parses time inputs", () => {
    expect(parseTimeInput("08:30")).toBe("08:30");
    expect(parseTimeInput("08:30:00")).toBe("08:30");
    expect(parseTimeInput("25:00")).toBeNull();
    expect(parseTimeInput("")).toBeNull();
    expect(parseTimeInput(null)).toBeNull();
  });

  it("formats 12h times", () => {
    expect(formatTime12h("00:15")).toBe("12:15 AM");
    expect(formatTime12h("08:00")).toBe("8:00 AM");
    expect(formatTime12h("12:00")).toBe("12:00 PM");
    expect(formatTime12h("17:45")).toBe("5:45 PM");
  });

  it("formats the appointment date without shifting the day", () => {
    const date = new Date("2026-10-10");
    expect(formatAppointmentWhen(date)).toBe("Sat, Oct 10, 2026");
    expect(formatAppointmentWhen(date, "08:00")).toBe("Sat, Oct 10, 2026, 8:00 AM");
    expect(formatAppointmentWhen(date, "08:00", "12:00")).toBe("Sat, Oct 10, 2026, 8:00 AM – 12:00 PM");
    expect(formatAppointmentWhen(null)).toBe("To be scheduled");
    expect(formatAppointmentWhen(null, null, null, "No date")).toBe("No date");
  });
});

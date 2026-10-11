import { describe, it, expect } from "vitest";
import {
  addMonthsUtc,
  dueCoverageReminder,
  formatTerm,
  getCoverageWindows,
  parseCoverageMonths,
} from "@/lib/warranty-windows";

const DAY_MS = 24 * 60 * 60 * 1000;
const closingDate = new Date("2026-03-15T00:00:00Z");

describe("addMonthsUtc", () => {
  it("adds months without shifting a date-only value", () => {
    expect(addMonthsUtc(closingDate, 12).toISOString()).toBe("2027-03-15T00:00:00.000Z");
    expect(addMonthsUtc(closingDate, 120).toISOString()).toBe("2036-03-15T00:00:00.000Z");
  });

  it("clamps to the last day of shorter months", () => {
    expect(addMonthsUtc(new Date("2026-01-31T00:00:00Z"), 1).toISOString()).toBe("2026-02-28T00:00:00.000Z");
    expect(addMonthsUtc(new Date("2028-02-29T00:00:00Z"), 12).toISOString()).toBe("2029-02-28T00:00:00.000Z");
  });
});

describe("formatTerm", () => {
  it("uses years for whole years and months otherwise", () => {
    expect(formatTerm(12)).toBe("1 year");
    expect(formatTerm(120)).toBe("10 years");
    expect(formatTerm(18)).toBe("18 months");
    expect(formatTerm(1)).toBe("1 month");
  });
});

describe("getCoverageWindows", () => {
  it("returns each set window with its end date and days left", () => {
    const now = new Date("2026-03-15T00:00:00Z");
    const windows = getCoverageWindows(
      { closingDate, workmanshipWarrantyMonths: 12, systemsWarrantyMonths: 24, structuralWarrantyMonths: 120 },
      now
    );
    expect(windows.map((w) => w.key)).toEqual(["WORKMANSHIP", "SYSTEMS", "STRUCTURAL"]);
    expect(windows[0].daysLeft).toBe(365);
    expect(windows[0].ended).toBe(false);
  });

  it("skips windows that are not covered", () => {
    const windows = getCoverageWindows(
      { closingDate, workmanshipWarrantyMonths: 12, systemsWarrantyMonths: null, structuralWarrantyMonths: 0 },
      closingDate
    );
    expect(windows.map((w) => w.key)).toEqual(["WORKMANSHIP"]);
  });

  it("marks windows that have passed as ended", () => {
    const [w] = getCoverageWindows({ closingDate, workmanshipWarrantyMonths: 12 }, new Date("2027-04-01T00:00:00Z"));
    expect(w.ended).toBe(true);
    expect(w.daysLeft).toBe(0);
  });
});

describe("dueCoverageReminder", () => {
  const endsAt = addMonthsUtc(closingDate, 12);
  const windowAt = (now: Date) => getCoverageWindows({ closingDate, workmanshipWarrantyMonths: 12 }, now)[0];

  it("is not due more than 60 days out", () => {
    const now = new Date(endsAt.getTime() - 61 * DAY_MS);
    expect(dueCoverageReminder(windowAt(now), now)).toBeNull();
  });

  it("is due at the 60-day stage", () => {
    const now = new Date(endsAt.getTime() - 30 * DAY_MS);
    const stage = dueCoverageReminder(windowAt(now), now);
    expect(stage?.daysBefore).toBe(60);
    expect(stage?.dueDate.getTime()).toBe(endsAt.getTime() - 60 * DAY_MS);
  });

  it("moves to the 14-day stage near the end", () => {
    const now = new Date(endsAt.getTime() - 5 * DAY_MS);
    expect(dueCoverageReminder(windowAt(now), now)?.daysBefore).toBe(14);
  });

  it("is not due once the window has ended", () => {
    const now = new Date(endsAt.getTime() + DAY_MS);
    expect(dueCoverageReminder(windowAt(now), now)).toBeNull();
  });
});

describe("parseCoverageMonths", () => {
  it("treats blank as not covered", () => {
    expect(parseCoverageMonths("")).toBeNull();
    expect(parseCoverageMonths(null)).toBeNull();
  });

  it("accepts whole months and rejects anything else", () => {
    expect(parseCoverageMonths("24")).toBe(24);
    expect(parseCoverageMonths("0")).toBe("invalid");
    expect(parseCoverageMonths("1.5")).toBe("invalid");
    expect(parseCoverageMonths("abc")).toBe("invalid");
  });
});

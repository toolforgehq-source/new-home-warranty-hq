import { describe, it, expect } from "vitest";
import { daysSince, addMonths } from "@/lib/date";

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

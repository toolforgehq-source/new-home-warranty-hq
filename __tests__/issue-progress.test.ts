import { describe, expect, it } from "vitest";
import { builderSenderLabel, getIssueProgress } from "@/lib/issue-progress";

const d = (s: string) => new Date(s);

describe("getIssueProgress", () => {
  const base = {
    status: "OPEN",
    createdAt: d("2026-05-14T15:00:00Z"),
    resolvedAt: null,
    statusHistory: [{ status: "OPEN", createdAt: d("2026-05-14T15:00:00Z") }],
    submissionRecords: [],
    appointments: [],
  };

  it("shows only Reported done for a new issue", () => {
    const steps = getIssueProgress(base);
    expect(steps.map((s) => s.done)).toEqual([true, false, false, false]);
    expect(steps[1].when).toBe("Not sent yet");
    expect(steps[2].when).toBe("Not scheduled");
    expect(steps[3].when).toBe("Open");
  });

  it("uses the earliest send and the latest appointment", () => {
    const steps = getIssueProgress({
      ...base,
      status: "SCHEDULED",
      submissionRecords: [
        { createdAt: d("2026-05-16T15:00:00Z"), sentAt: null },
        { createdAt: d("2026-05-15T15:00:00Z"), sentAt: d("2026-05-15T15:00:00Z") },
      ],
      appointments: [
        { appointmentDate: d("2026-05-20T00:00:00Z"), appointmentStartTime: null, appointmentEndTime: null, createdAt: d("2026-05-15T00:00:00Z") },
        { appointmentDate: d("2026-05-21T00:00:00Z"), appointmentStartTime: "09:00", appointmentEndTime: null, createdAt: d("2026-05-16T00:00:00Z") },
      ],
    });
    expect(steps[1]).toMatchObject({ done: true, when: "May 15" });
    expect(steps[2]).toMatchObject({ done: true, when: "Thu, May 21, 2026, 9:00 AM" });
    expect(steps[3]).toMatchObject({ done: false, when: "Awaiting your confirmation" });
  });

  it("marks resolved from history when resolvedAt is missing", () => {
    const steps = getIssueProgress({
      ...base,
      status: "RESOLVED",
      statusHistory: [...base.statusHistory, { status: "RESOLVED", createdAt: d("2026-05-22T15:00:00Z") }],
    });
    expect(steps[3]).toMatchObject({ done: true, when: "May 22" });
  });
});

describe("builderSenderLabel", () => {
  it("uses the display name when present", () => {
    expect(builderSenderLabel('"Sam Lee" <sam@maple.com>', "Maple Ridge Homes")).toBe("Sam Lee");
  });
  it("falls back to the builder name for bare addresses", () => {
    expect(builderSenderLabel("warranty@maple.com", "Maple Ridge Homes")).toBe("Maple Ridge Homes");
    expect(builderSenderLabel(null, "Maple Ridge Homes")).toBe("Maple Ridge Homes");
  });
});

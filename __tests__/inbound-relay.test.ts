import { describe, it, expect, vi, beforeEach } from "vitest";

const send = vi.fn();
const receivingGet = vi.fn();
const issueFindUnique = vi.fn();
const commentCreate = vi.fn();

vi.mock("resend", () => ({
  Resend: class {
    emails = { send, receiving: { get: receivingGet, attachments: { get: vi.fn() } } };
  },
}));
vi.mock("@/lib/prisma", () => ({
  default: {
    issue: { findUnique: (...a: unknown[]) => issueFindUnique(...a) },
    issueComment: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: (...a: unknown[]) => commentCreate(...a),
    },
  },
}));
vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));

const issue = {
  id: "abc",
  userId: "u1",
  user: { email: "owner@home.com" },
  comments: [],
  home: {
    builderEmail: "warranty@builder.com",
    builderName: "Acme Homes",
    primaryOwner: { email: "owner@home.com", name: "Jane Doe" },
    memberships: [{ user: { email: "spouse@home.com" } }],
  },
};

async function run(email: { from: string; to: string[]; cc?: string[] }) {
  vi.resetModules();
  vi.stubEnv("RESEND_API_KEY", "re_test");
  vi.stubEnv("RESEND_FROM_EMAIL", "New Home Warranty HQ <hello@example.com>");
  vi.stubEnv("INBOUND_EMAIL_DOMAIN", "example.com");
  receivingGet.mockResolvedValue({
    data: { id: "in1", subject: "Warranty request", text: "We'll come Tuesday", html: null, attachments: [], ...email },
    error: null,
  });
  const { processInboundEmail } = await import("@/lib/inbound");
  return processInboundEmail({ type: "email.received", data: { email_id: "in1" } });
}

describe("processInboundEmail relay", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    send.mockReset().mockResolvedValue({ data: { id: "out1" }, error: null });
    commentCreate.mockReset();
    issueFindUnique.mockReset().mockResolvedValue(issue);
  });

  it("logs a plain builder reply and emails it to the homeowners", async () => {
    const result = await run({ from: "Bob <warranty@builder.com>", to: ['"Jane Doe via New Home Warranty HQ" <issue-abc@example.com>'] });
    expect(result).toMatchObject({ ok: true, direction: "BUILDER" });
    expect(commentCreate.mock.calls[0][0].data).toMatchObject({ issueId: "abc", direction: "BUILDER" });
    const payload = send.mock.calls[0][0];
    expect(payload.to).toBe("owner@home.com");
    expect(payload.cc).toEqual(["spouse@home.com"]);
    expect(payload.replyTo).toBe("issue-abc@example.com");
    expect(payload.from).toBe('"Acme Homes via New Home Warranty HQ" <issue-abc@example.com>');
  });

  it("treats a reply from an unknown (non-homeowner) address as the builder", async () => {
    const result = await run({ from: "tech@subcontractor.com", to: ["issue-abc@example.com"] });
    expect(result).toMatchObject({ direction: "BUILDER" });
    expect(send.mock.calls[0][0].to).toBe("owner@home.com");
  });

  it("does not resend to homeowners already on a Reply All", async () => {
    await run({ from: "warranty@builder.com", to: ["issue-abc@example.com"], cc: ["Owner <owner@home.com>"] });
    const payload = send.mock.calls[0][0];
    expect(payload.to).toBe("spouse@home.com");
    expect(payload.cc).toEqual([]);
  });

  it("skips the relay entirely when every homeowner already received it", async () => {
    await run({ from: "warranty@builder.com", to: ["issue-abc@example.com", "owner@home.com"], cc: ["spouse@home.com"] });
    expect(commentCreate).toHaveBeenCalledOnce();
    expect(send).not.toHaveBeenCalled();
  });

  it("relays a homeowner reply to the builder without echoing it back to the sender", async () => {
    const result = await run({ from: "owner@home.com", to: ["issue-abc@example.com"] });
    expect(result).toMatchObject({ direction: "HOMEOWNER" });
    const payload = send.mock.calls[0][0];
    expect(payload.to).toBe("warranty@builder.com");
    expect(payload.cc).toEqual(["spouse@home.com"]);
  });

  it("ignores mail sent from an issue address", async () => {
    const result = await run({ from: "issue-abc@example.com", to: ["issue-abc@example.com"] });
    expect(result).toMatchObject({ skipped: true });
    expect(commentCreate).not.toHaveBeenCalled();
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";

const send = vi.fn();

vi.mock("resend", () => ({
  Resend: class {
    emails = { send };
  },
}));
vi.mock("@/lib/prisma", () => ({ default: {} }));
vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));

async function load(env: Record<string, string>) {
  vi.resetModules();
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  return {
    email: await import("@/lib/email"),
    inbound: await import("@/lib/inbound"),
  };
}

describe("issue email reply routing", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    send.mockReset();
    send.mockResolvedValue({ data: { id: "e1" }, error: null });
  });

  it("passes replyTo and from to the Resend SDK", async () => {
    const { email } = await load({ RESEND_API_KEY: "re_test", RESEND_FROM_EMAIL: "hello@example.com" });
    await email.sendEmail({
      from: '"Jane via New Home Warranty HQ" <issue-abc@example.com>',
      to: "builder@example.org",
      subject: "s",
      text: "t",
      replyTo: "issue-abc@example.com",
    });
    const payload = send.mock.calls[0][0];
    expect(payload.replyTo).toBe("issue-abc@example.com");
    expect(payload).not.toHaveProperty("reply_to");
    expect(payload.from).toBe('"Jane via New Home Warranty HQ" <issue-abc@example.com>');
  });

  it("sends from the issue address when the inbound domain matches the sending domain", async () => {
    const { inbound } = await load({
      RESEND_FROM_EMAIL: "New Home Warranty HQ <hello@example.com>",
      INBOUND_EMAIL_DOMAIN: "example.com",
    });
    expect(inbound.getIssueFromAddress("abc", 'Jane "J" Doe')).toBe(
      '"Jane J Doe via New Home Warranty HQ" <issue-abc@example.com>'
    );
    expect(inbound.getIssueFromAddress("abc")).toBe('"New Home Warranty HQ" <issue-abc@example.com>');
  });

  it("falls back to the default sender when domains differ", async () => {
    const { inbound } = await load({
      RESEND_FROM_EMAIL: "hello@example.com",
      INBOUND_EMAIL_DOMAIN: "reply.example.com",
    });
    expect(inbound.getIssueFromAddress("abc", "Jane")).toBeUndefined();
  });
});

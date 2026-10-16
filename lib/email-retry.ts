import prisma from "@/lib/prisma";

/**
 * Runs an email-sending function with up to `retries` extra attempts
 * (default 2, so 3 tries total) and a short backoff.
 *
 * On final failure it logs loudly and writes an AuditLog row
 * (action "EMAIL_SEND_FAILED") so a failed setup/gift email is visible and can
 * be re-sent by hand. It returns false instead of throwing so a Resend outage
 * does not make Stripe retry an already-processed payment webhook.
 */
export async function sendWithRetry(
  label: string,
  context: Record<string, string | number | null>,
  fn: () => Promise<unknown>,
  { retries = 2, baseDelayMs = 500 }: { retries?: number; baseDelayMs?: number } = {}
): Promise<boolean> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await fn();
      if (attempt > 0) console.warn(`[email-retry] ${label} succeeded on attempt ${attempt + 1}`, context);
      return true;
    } catch (err) {
      lastError = err;
      console.warn(`[email-retry] ${label} attempt ${attempt + 1}/${retries + 1} failed`, context, err);
      if (attempt < retries) await new Promise((r) => setTimeout(r, baseDelayMs * 2 ** attempt));
    }
  }
  console.error(`[email-retry] ${label} FAILED after ${retries + 1} attempts`, context, lastError);
  try {
    await prisma.auditLog.create({
      data: {
        action: "EMAIL_SEND_FAILED",
        entityType: "email",
        entityId: typeof context.purchaseId === "string" ? context.purchaseId : undefined,
        metadata: {
          label,
          ...context,
          error: lastError instanceof Error ? lastError.message.slice(0, 300) : "unknown",
        },
      },
    });
  } catch (auditErr) {
    console.error("[email-retry] could not write audit log", auditErr);
  }
  return false;
}

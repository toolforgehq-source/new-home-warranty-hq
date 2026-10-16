import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const hasUpstash = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

const limiters = new Map<string, Ratelimit>();
const memory = new Map<string, { count: number; resetAt: number }>();

/**
 * Fixed-window-ish rate limit by key. Uses Upstash when UPSTASH_REDIS_REST_URL/TOKEN
 * are set; otherwise falls back to a per-instance in-memory counter (best effort only,
 * serverless instances do not share it). Fails open if Upstash errors.
 */
export async function rateLimit(
  bucket: string,
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ ok: boolean }> {
  if (hasUpstash) {
    try {
      const id = `${bucket}:${limit}:${windowSeconds}`;
      let rl = limiters.get(id);
      if (!rl) {
        rl = new Ratelimit({
          redis: Redis.fromEnv(),
          limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
          prefix: `nhwhq:rl:${bucket}`,
        });
        limiters.set(id, rl);
      }
      const res = await rl.limit(key);
      return { ok: res.success };
    } catch (err) {
      console.error("[rate-limit] upstash error, failing open", err);
      return { ok: true };
    }
  }
  const now = Date.now();
  const k = `${bucket}:${key}`;
  const entry = memory.get(k);
  if (!entry || entry.resetAt < now) {
    memory.set(k, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { ok: true };
  }
  entry.count += 1;
  return { ok: entry.count <= limit };
}

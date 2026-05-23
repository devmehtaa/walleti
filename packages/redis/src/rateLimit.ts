import { ensureRedis } from "./client";
import { keys } from "./keys";

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSeconds?: number;
};

export async function rateLimit(
  scope: string,
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const redis = await ensureRedis();
  if (!redis) {
    return { ok: true, remaining: limit };
  }

  const key = keys.rateLimit(scope, identifier);
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, windowSeconds);
  }

  const ttl = await redis.ttl(key);
  const remaining = Math.max(0, limit - count);

  if (count > limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: ttl > 0 ? ttl : windowSeconds,
    };
  }

  return { ok: true, remaining };
}

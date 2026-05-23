import { ensureRedis } from "./client";
import { keys } from "./keys";

export async function acquireLock(
  resource: string,
  ttlSeconds = 10
): Promise<boolean> {
  const redis = await ensureRedis();
  if (!redis) return true;

  const result = await redis.set(keys.lock(resource), "1", "EX", ttlSeconds, "NX");
  return result === "OK";
}

export async function releaseLock(resource: string): Promise<void> {
  const redis = await ensureRedis();
  if (!redis) return;
  await redis.del(keys.lock(resource));
}

export async function withLock<T>(
  resource: string,
  fn: () => Promise<T>,
  ttlSeconds = 10
): Promise<T> {
  const acquired = await acquireLock(resource, ttlSeconds);
  if (!acquired) {
    throw new Error("Resource is busy. Please try again.");
  }

  try {
    return await fn();
  } finally {
    await releaseLock(resource);
  }
}

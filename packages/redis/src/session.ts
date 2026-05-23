import { ensureRedis } from "./client";
import { keys } from "./keys";

const SESSION_TTL = 60 * 60 * 24; // 24 hours

export type CachedSession = {
  userId: string;
  name?: string | null;
  email?: string | null;
  cachedAt: string;
};

export async function cacheUserSession(
  userId: string,
  data: Omit<CachedSession, "cachedAt">
): Promise<void> {
  const redis = await ensureRedis();
  if (!redis) return;

  const payload: CachedSession = {
    ...data,
    userId,
    cachedAt: new Date().toISOString(),
  };
  await redis.setex(keys.session(userId), SESSION_TTL, JSON.stringify(payload));
}

export async function getCachedUserSession(
  userId: string
): Promise<CachedSession | null> {
  const redis = await ensureRedis();
  if (!redis) return null;

  const raw = await redis.get(keys.session(userId));
  if (!raw) return null;

  try {
    return JSON.parse(raw) as CachedSession;
  } catch {
    return null;
  }
}

export async function invalidateUserSession(userId: string): Promise<void> {
  const redis = await ensureRedis();
  if (!redis) return;
  await redis.del(keys.session(userId));
}

export async function blockSessionToken(
  tokenId: string,
  ttlSeconds = SESSION_TTL
): Promise<void> {
  const redis = await ensureRedis();
  if (!redis) return;
  await redis.setex(keys.sessionBlocklist(tokenId), ttlSeconds, "1");
}

export async function isSessionTokenBlocked(tokenId: string): Promise<boolean> {
  const redis = await ensureRedis();
  if (!redis) return false;
  const blocked = await redis.get(keys.sessionBlocklist(tokenId));
  return blocked === "1";
}

import { ensureRedis } from "./client";
import { keys } from "./keys";

const BALANCE_TTL = 60 * 5;

export type CachedBalance = {
  amount: number;
  locked: number;
};

export async function getCachedBalance(
  userId: number
): Promise<CachedBalance | null> {
  const redis = await ensureRedis();
  if (!redis) return null;

  const raw = await redis.get(keys.balance(userId));
  if (!raw) return null;

  try {
    return JSON.parse(raw) as CachedBalance;
  } catch {
    return null;
  }
}

export async function setCachedBalance(
  userId: number,
  balance: CachedBalance
): Promise<void> {
  const redis = await ensureRedis();
  if (!redis) return;
  await redis.setex(keys.balance(userId), BALANCE_TTL, JSON.stringify(balance));
}

export async function invalidateBalance(userId: number): Promise<void> {
  const redis = await ensureRedis();
  if (!redis) return;
  await redis.del(keys.balance(userId));
}

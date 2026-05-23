import prisma from "@repo/db/client";
import {
  recordRedisCacheHit,
  recordRedisCacheMiss,
} from "@repo/metrics";
import {
  getCachedBalance,
  invalidateBalance,
  setCachedBalance,
} from "@repo/redis";

export async function getUserBalance(userId: number) {
  const cached = await getCachedBalance(userId);
  if (cached) {
    recordRedisCacheHit("balance");
    return cached;
  }

  recordRedisCacheMiss("balance");

  const balance = await prisma.balance.findFirst({
    where: { userId },
  });

  const result = {
    amount: balance?.amount ?? 0,
    locked: balance?.locked ?? 0,
  };

  await setCachedBalance(userId, result);
  return result;
}

export async function refreshUserBalanceCache(userId: number) {
  await invalidateBalance(userId);
  return getUserBalance(userId);
}

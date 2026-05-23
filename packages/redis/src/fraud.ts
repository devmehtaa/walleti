import { ensureRedis } from "./client";
import { keys } from "./keys";

const VELOCITY_WINDOW = 60 * 60 * 24;

export type VelocityCheckResult = {
  ok: boolean;
  message?: string;
};

export async function checkTopUpVelocity(
  userId: number,
  amountPaise: number,
  dailyLimitPaise = 500_000_00
): Promise<VelocityCheckResult> {
  const redis = await ensureRedis();
  if (!redis) return { ok: true };

  const key = keys.velocityTopup(userId);
  const newTotal = await redis.incrby(key, amountPaise);
  if (newTotal === amountPaise) {
    await redis.expire(key, VELOCITY_WINDOW);
  }

  if (newTotal > dailyLimitPaise) {
    await redis.incrby(key, -amountPaise);
    return {
      ok: false,
      message: "Daily top-up limit exceeded. Try again tomorrow.",
    };
  }

  return { ok: true };
}

export async function checkTransferVelocity(
  userId: number,
  amountPaise: number,
  options?: {
    dailyAmountLimitPaise?: number;
    dailyCountLimit?: number;
  }
): Promise<VelocityCheckResult> {
  const redis = await ensureRedis();
  if (!redis) return { ok: true };

  const dailyAmountLimit = options?.dailyAmountLimitPaise ?? 200_000_00;
  const dailyCountLimit = options?.dailyCountLimit ?? 50;

  const amountKey = keys.velocityTransfer(userId);
  const countKey = keys.velocityTransferCount(userId);

  const [newAmount, newCount] = await Promise.all([
    redis.incrby(amountKey, amountPaise),
    redis.incr(countKey),
  ]);

  if (newAmount === amountPaise) {
    await redis.expire(amountKey, VELOCITY_WINDOW);
  }
  if (newCount === 1) {
    await redis.expire(countKey, VELOCITY_WINDOW);
  }

  if (newAmount > dailyAmountLimit) {
    await redis.incrby(amountKey, -amountPaise);
    await redis.decr(countKey);
    return {
      ok: false,
      message: "Daily transfer amount limit exceeded.",
    };
  }

  if (newCount > dailyCountLimit) {
    await redis.incrby(amountKey, -amountPaise);
    await redis.decr(countKey);
    return {
      ok: false,
      message: "Daily transfer count limit exceeded.",
    };
  }

  return { ok: true };
}

export async function rollbackTransferVelocity(
  userId: number,
  amountPaise: number
): Promise<void> {
  const redis = await ensureRedis();
  if (!redis) return;
  await redis.incrby(keys.velocityTransfer(userId), -amountPaise);
  await redis.decr(keys.velocityTransferCount(userId));
}

import { ensureRedis } from "./client";
import { keys } from "./keys";

export type OnRampRedisStatus = "Processing" | "Success" | "Failure";

const ONRAMP_TTL = 60 * 60;

export async function setOnRampStatus(
  token: string,
  status: OnRampRedisStatus
): Promise<void> {
  const redis = await ensureRedis();
  if (!redis) return;
  await redis.setex(keys.onRamp(token), ONRAMP_TTL, status);
}

export async function getOnRampStatus(
  token: string
): Promise<OnRampRedisStatus | null> {
  const redis = await ensureRedis();
  if (!redis) return null;

  const status = await redis.get(keys.onRamp(token));
  if (
    status === "Processing" ||
    status === "Success" ||
    status === "Failure"
  ) {
    return status;
  }
  return null;
}

import { ensureRedis } from "./client";
import { keys } from "./keys";

const DEFAULT_OTP_TTL = 300;

export async function setOtp(
  phone: string,
  code: string,
  ttlSeconds = DEFAULT_OTP_TTL
): Promise<void> {
  const redis = await ensureRedis();
  if (!redis) return;
  await redis.setex(keys.otp(phone), ttlSeconds, code);
}

export async function verifyOtp(phone: string, code: string): Promise<boolean> {
  const redis = await ensureRedis();
  if (!redis) return false;

  const stored = await redis.get(keys.otp(phone));
  if (!stored || stored !== code) return false;

  await redis.del(keys.otp(phone));
  return true;
}

export async function hasOtp(phone: string): Promise<boolean> {
  const redis = await ensureRedis();
  if (!redis) return false;
  const stored = await redis.get(keys.otp(phone));
  return stored !== null;
}

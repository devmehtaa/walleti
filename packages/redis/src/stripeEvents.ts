import { ensureRedis } from "./client";
import { keys } from "./keys";

const STRIPE_EVENT_TTL = 60 * 60 * 24;

export async function isStripeEventProcessed(eventId: string): Promise<boolean> {
  const redis = await ensureRedis();
  if (!redis) return false;
  const exists = await redis.get(keys.stripeEvent(eventId));
  return exists === "1";
}

export async function markStripeEventProcessed(eventId: string): Promise<boolean> {
  const redis = await ensureRedis();
  if (!redis) return true;
  const result = await redis.set(
    keys.stripeEvent(eventId),
    "1",
    "EX",
    STRIPE_EVENT_TTL,
    "NX"
  );
  return result === "OK";
}

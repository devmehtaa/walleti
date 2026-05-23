import { ensureRedis } from "./client";
import { keys } from "./keys";

export type StripeQueueEvent = {
  id: string;
  type: string;
  created: number;
  receivedAt: string;
  data: {
    object: Record<string, unknown>;
  };
};

export async function enqueueStripeEvent(
  event: StripeQueueEvent
): Promise<boolean> {
  const redis = await ensureRedis();
  if (!redis) return false;
  await redis.rpush(keys.stripeQueue, JSON.stringify(event));
  return true;
}

export async function dequeueStripeEvent(): Promise<StripeQueueEvent | null> {
  const redis = await ensureRedis();
  if (!redis) return null;

  const raw = await redis.blpop(keys.stripeQueue, 5);
  if (!raw || !raw[1]) return null;

  try {
    return JSON.parse(raw[1]) as StripeQueueEvent;
  } catch {
    return null;
  }
}

export async function getStripeQueueLength(): Promise<number> {
  const redis = await ensureRedis();
  if (!redis) return 0;
  return redis.llen(keys.stripeQueue);
}

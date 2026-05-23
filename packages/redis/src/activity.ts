import { ensureRedis } from "./client";
import { keys } from "./keys";

export type ActivityType =
  | "topup"
  | "topup_failed"
  | "p2p_sent"
  | "p2p_received";

export type ActivityEvent = {
  type: ActivityType;
  amount?: number;
  counterparty?: string;
  status?: string;
  timestamp: string;
};

const ACTIVITY_MAX = 50;
const ACTIVITY_TTL = 60 * 60 * 24 * 30;

export async function pushActivity(
  userId: number,
  event: Omit<ActivityEvent, "timestamp"> & { timestamp?: string }
): Promise<void> {
  const redis = await ensureRedis();
  if (!redis) return;

  const payload: ActivityEvent = {
    ...event,
    timestamp: event.timestamp ?? new Date().toISOString(),
  };

  const key = keys.activity(userId);
  await redis.lpush(key, JSON.stringify(payload));
  await redis.ltrim(key, 0, ACTIVITY_MAX - 1);
  await redis.expire(key, ACTIVITY_TTL);
}

export async function getRecentActivity(
  userId: number,
  limit = 20
): Promise<ActivityEvent[]> {
  const redis = await ensureRedis();
  if (!redis) return [];

  const items = await redis.lrange(keys.activity(userId), 0, limit - 1);
  const events: ActivityEvent[] = [];

  for (const item of items) {
    try {
      events.push(JSON.parse(item) as ActivityEvent);
    } catch {
      // skip malformed
    }
  }

  return events;
}

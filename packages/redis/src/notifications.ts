import { ensureRedis } from "./client";
import { keys } from "./keys";

export type NotificationPayload = {
  userId: number;
  type: "topup" | "transfer_sent" | "transfer_received" | "topup_failed";
  message: string;
  createdAt: string;
};

export async function enqueueNotification(
  payload: Omit<NotificationPayload, "createdAt"> & { createdAt?: string }
): Promise<void> {
  const redis = await ensureRedis();
  if (!redis) return;

  const item: NotificationPayload = {
    ...payload,
    createdAt: payload.createdAt ?? new Date().toISOString(),
  };

  await redis.rpush(keys.notifyQueue, JSON.stringify(item));
}

export async function dequeueNotification(
  blockSeconds = 0
): Promise<NotificationPayload | null> {
  const redis = await ensureRedis();
  if (!redis) return null;

  if (blockSeconds > 0) {
    const raw = await redis.blpop(keys.notifyQueue, blockSeconds);
    if (!raw || !raw[1]) return null;
    try {
      return JSON.parse(raw[1]) as NotificationPayload;
    } catch {
      return null;
    }
  }

  const raw = await redis.lpop(keys.notifyQueue);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as NotificationPayload;
  } catch {
    return null;
  }
}

export async function getNotificationQueueLength(): Promise<number> {
  const redis = await ensureRedis();
  if (!redis) return 0;
  return redis.llen(keys.notifyQueue);
}

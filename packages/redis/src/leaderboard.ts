import { ensureRedis } from "./client";
import { keys } from "./keys";

const LEADERBOARD_TTL = 60 * 60 * 24;

export type LeaderboardEntry = {
  userId: string;
  score: number;
};

export async function incrementLeaderboard(
  userId: number,
  amountPaise: number
): Promise<void> {
  const redis = await ensureRedis();
  if (!redis) return;

  const key = keys.leaderboardDaily;
  await redis.zincrby(key, amountPaise, String(userId));
  await redis.expire(key, LEADERBOARD_TTL);
}

export async function getTopSenders(limit = 10): Promise<LeaderboardEntry[]> {
  const redis = await ensureRedis();
  if (!redis) return [];

  const results = await redis.zrevrange(
    keys.leaderboardDaily,
    0,
    limit - 1,
    "WITHSCORES"
  );

  const entries: LeaderboardEntry[] = [];
  for (let i = 0; i < results.length; i += 2) {
    const userId = results[i];
    const score = results[i + 1];
    if (userId && score) {
      entries.push({ userId, score: Number(score) });
    }
  }

  return entries;
}

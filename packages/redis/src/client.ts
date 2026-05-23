import Redis from "ioredis";

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    const url = process.env.REDIS_URL ?? "redis://localhost:6379";
    redis = new Redis(url, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      commandTimeout: 2000,
      enableOfflineQueue: false,
      lazyConnect: true,
      retryStrategy: () => null,
    });
    redis.on("error", () => {
      // Suppress unhandled error events when Redis is down
    });
  }
  return redis;
}

function connectWithTimeout(client: Redis, ms: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Redis connect timeout")), ms);

    const onReady = () => {
      clearTimeout(timer);
      cleanup();
      resolve();
    };
    const onError = (err: Error) => {
      clearTimeout(timer);
      cleanup();
      reject(err);
    };
    const cleanup = () => {
      client.off("ready", onReady);
      client.off("error", onError);
    };

    if (client.status === "ready") {
      clearTimeout(timer);
      resolve();
      return;
    }

    client.once("ready", onReady);
    client.once("error", onError);

    if (client.status === "wait" || client.status === "end") {
      client.connect().catch(onError);
    }
  });
}

export async function ensureRedis(): Promise<Redis | null> {
  try {
    const client = getRedis();
    if (client.status !== "ready") {
      await connectWithTimeout(client, 2000);
    }
    await client.ping();
    return client;
  } catch {
    try {
      getRedis().disconnect();
    } catch {
      // ignore
    }
    return null;
  }
}

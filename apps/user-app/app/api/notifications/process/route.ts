import { NextResponse } from "next/server";
import { dequeueNotification, getNotificationQueueLength } from "@repo/redis";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const processed: string[] = [];
  const maxBatch = 20;

  for (let i = 0; i < maxBatch; i++) {
    const notification = await dequeueNotification();
    if (!notification) break;

    console.log("[notification]", notification);
    processed.push(`${notification.userId}:${notification.type}`);
  }

  const remaining = await getNotificationQueueLength();

  return NextResponse.json({
    processed: processed.length,
    items: processed,
    remaining,
  });
}

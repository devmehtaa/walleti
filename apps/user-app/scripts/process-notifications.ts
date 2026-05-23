/**
 * Drain the notification queue (logs to console).
 * Run: npx tsx scripts/process-notifications.ts
 */
import { dequeueNotification, getNotificationQueueLength } from "@repo/redis";

async function main() {
  let processed = 0;
  while (true) {
    const item = await dequeueNotification();
    if (!item) break;
    console.log("[notification]", JSON.stringify(item));
    processed += 1;
  }
  const remaining = await getNotificationQueueLength();
  console.log(`Processed ${processed}, ${remaining} remaining`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

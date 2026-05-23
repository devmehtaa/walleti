import { startMetricsServer } from "@repo/metrics";
import { dequeueNotification } from "@repo/redis";
import { deliverNotification } from "./channels";

const METRICS_PORT = Number(process.env.METRICS_PORT ?? 9101);
const POLL_BLOCK_SECONDS = Number(process.env.POLL_BLOCK_SECONDS ?? 5);

async function main() {
  process.env.SERVICE_NAME = "notification-worker";
  await startMetricsServer(METRICS_PORT);

  console.log("[notification-worker] started");

  while (true) {
    const notification = await dequeueNotification(POLL_BLOCK_SECONDS);
    if (!notification) continue;

    try {
      await deliverNotification(notification);
      console.log("[notification-worker] delivered", notification.type, notification.userId);
    } catch (error) {
      console.error("[notification-worker] failed", error);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

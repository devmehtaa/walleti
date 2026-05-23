import {
  recordStripeEventProcessed,
  recordWebhookLag,
  startMetricsServer,
} from "@repo/metrics";
import { dequeueStripeEvent } from "@repo/redis";
import { processStripeQueueEvent } from "@repo/wallet-core";

const METRICS_PORT = Number(process.env.METRICS_PORT ?? 9102);

async function main() {
  process.env.SERVICE_NAME = "stripe-webhook-consumer";
  await startMetricsServer(METRICS_PORT);

  console.log("[stripe-webhook-consumer] started");

  while (true) {
    const event = await dequeueStripeEvent();
    if (!event) continue;

    const lagMs = Date.now() - event.created * 1000;
    recordWebhookLag(event.type, lagMs);

    try {
      await processStripeQueueEvent(event);
      recordStripeEventProcessed(event.type, "success");
      console.log("[stripe-webhook-consumer] processed", event.id, event.type);
    } catch (error) {
      recordStripeEventProcessed(event.type, "error");
      console.error("[stripe-webhook-consumer] error", event.id, error);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

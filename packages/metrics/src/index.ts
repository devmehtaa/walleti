import {
  Counter,
  Gauge,
  Histogram,
  Registry,
  collectDefaultMetrics,
} from "prom-client";

const SERVICE_NAME = process.env.SERVICE_NAME ?? "walleti";

export const registry = new Registry();
registry.setDefaultLabels({ service: SERVICE_NAME });

collectDefaultMetrics({ register: registry });

export const transferDurationSeconds = new Histogram({
  name: "wallet_transfer_duration_seconds",
  help: "P2P transfer processing duration in seconds",
  labelNames: ["status"] as const,
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [registry],
});

export const webhookLagSeconds = new Histogram({
  name: "wallet_webhook_lag_seconds",
  help: "Stripe webhook lag from event creation to processing",
  labelNames: ["event_type"] as const,
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120],
  registers: [registry],
});

export const redisCacheHits = new Counter({
  name: "wallet_redis_cache_hits_total",
  help: "Redis cache hits",
  labelNames: ["cache"] as const,
  registers: [registry],
});

export const redisCacheMisses = new Counter({
  name: "wallet_redis_cache_misses_total",
  help: "Redis cache misses",
  labelNames: ["cache"] as const,
  registers: [registry],
});

export const failedLoginsTotal = new Counter({
  name: "wallet_failed_logins_total",
  help: "Failed login attempts",
  labelNames: ["reason"] as const,
  registers: [registry],
});

export const notificationsSentTotal = new Counter({
  name: "wallet_notifications_sent_total",
  help: "Notifications delivered",
  labelNames: ["channel", "status"] as const,
  registers: [registry],
});

export const stripeEventsProcessedTotal = new Counter({
  name: "wallet_stripe_events_processed_total",
  help: "Stripe events processed by worker",
  labelNames: ["event_type", "status"] as const,
  registers: [registry],
});

export const reconciliationDiscrepanciesGauge = new Gauge({
  name: "wallet_reconciliation_discrepancies",
  help: "Number of balance reconciliation discrepancies in last run",
  registers: [registry],
});

export function recordTransferDuration(
  status: "success" | "error",
  durationMs: number
) {
  transferDurationSeconds.observe({ status }, durationMs / 1000);
}

export function recordWebhookLag(eventType: string, lagMs: number) {
  webhookLagSeconds.observe({ event_type: eventType }, lagMs / 1000);
}

export function recordRedisCacheHit(cache: string) {
  redisCacheHits.inc({ cache });
}

export function recordRedisCacheMiss(cache: string) {
  redisCacheMisses.inc({ cache });
}

export function recordFailedLogin(reason: string) {
  failedLoginsTotal.inc({ reason });
}

export function recordNotificationSent(
  channel: string,
  status: "success" | "error"
) {
  notificationsSentTotal.inc({ channel, status });
}

export function recordStripeEventProcessed(
  eventType: string,
  status: "success" | "error"
) {
  stripeEventsProcessedTotal.inc({ event_type: eventType, status });
}

export function setReconciliationDiscrepancies(count: number) {
  reconciliationDiscrepanciesGauge.set(count);
}

export async function getMetricsText(): Promise<string> {
  return registry.metrics();
}

export async function startMetricsServer(port: number) {
  const http = await import("http");
  const server = http.createServer(async (req, res) => {
    if (req.url === "/metrics") {
      res.setHeader("Content-Type", registry.contentType);
      res.end(await getMetricsText());
      return;
    }
    if (req.url === "/health") {
      res.end("ok");
      return;
    }
    res.statusCode = 404;
    res.end("not found");
  });

  await new Promise<void>((resolve) => {
    server.listen(port, () => {
      console.log(`[metrics] ${SERVICE_NAME} listening on :${port}/metrics`);
      resolve();
    });
  });

  return server;
}

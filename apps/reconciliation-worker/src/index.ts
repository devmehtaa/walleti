import { setReconciliationDiscrepancies, startMetricsServer } from "@repo/metrics";
import { runReconciliation } from "@repo/wallet-core";

const METRICS_PORT = Number(process.env.METRICS_PORT ?? 9103);
const INTERVAL_MS = Number(process.env.RECONCILE_INTERVAL_MS ?? 60_000);

async function runOnce() {
  const result = await runReconciliation();
  setReconciliationDiscrepancies(result.discrepancies.length);

  console.log(
    `[reconciliation-worker] checked=${result.checkedUsers} discrepancies=${result.discrepancies.length}`
  );

  for (const d of result.discrepancies) {
    console.warn("[reconciliation-worker] mismatch", d);
  }
}

async function main() {
  process.env.SERVICE_NAME = "reconciliation-worker";
  await startMetricsServer(METRICS_PORT);

  console.log("[reconciliation-worker] started, interval", INTERVAL_MS, "ms");

  await runOnce();
  setInterval(runOnce, INTERVAL_MS);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

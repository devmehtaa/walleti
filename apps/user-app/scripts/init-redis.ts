/**
 * Seed default Redis feature flags.
 * Run: npx tsx scripts/init-redis.ts (from apps/user-app)
 */
import { FEATURE_FLAGS, setFeature } from "@repo/redis";

async function main() {
  await setFeature(FEATURE_FLAGS.STRIPE_ONRAMP, true);
  await setFeature(FEATURE_FLAGS.P2P_TRANSFER, true);
  await setFeature(FEATURE_FLAGS.MAINTENANCE_MODE, false);
  console.log("Redis feature flags initialized");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

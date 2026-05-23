import { redirect } from "next/navigation";
import { FEATURE_FLAGS, isFeatureEnabled } from "@repo/redis";

export async function redirectIfMaintenance() {
  try {
    const maintenance = await Promise.race([
      isFeatureEnabled(FEATURE_FLAGS.MAINTENANCE_MODE),
      new Promise<boolean>((resolve) => {
        setTimeout(() => resolve(false), 1500);
      }),
    ]);
    if (maintenance) {
      redirect("/maintenance");
    }
  } catch {
    // If Redis fails, allow the app to run
  }
}

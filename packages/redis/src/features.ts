import { ensureRedis } from "./client";
import { keys } from "./keys";

export const FEATURE_FLAGS = {
  STRIPE_ONRAMP: "stripe_onramp",
  P2P_TRANSFER: "p2p_transfer",
  MAINTENANCE_MODE: "maintenance_mode",
} as const;

export type FeatureFlagName =
  (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS];

const DEFAULTS: Record<FeatureFlagName, boolean> = {
  [FEATURE_FLAGS.STRIPE_ONRAMP]: true,
  [FEATURE_FLAGS.P2P_TRANSFER]: true,
  [FEATURE_FLAGS.MAINTENANCE_MODE]: false,
};

export async function isFeatureEnabled(name: FeatureFlagName): Promise<boolean> {
  const redis = await ensureRedis();
  if (!redis) return DEFAULTS[name] ?? true;

  const value = await redis.get(keys.feature(name));
  if (value === null) return DEFAULTS[name] ?? true;
  return value === "1" || value === "true";
}

export async function setFeature(
  name: FeatureFlagName,
  enabled: boolean
): Promise<void> {
  const redis = await ensureRedis();
  if (!redis) return;
  await redis.set(keys.feature(name), enabled ? "1" : "0");
}

export async function getAllFeatures(): Promise<Record<FeatureFlagName, boolean>> {
  const flags = Object.values(FEATURE_FLAGS) as FeatureFlagName[];
  const result = {} as Record<FeatureFlagName, boolean>;

  await Promise.all(
    flags.map(async (flag) => {
      result[flag] = await isFeatureEnabled(flag);
    })
  );

  return result;
}

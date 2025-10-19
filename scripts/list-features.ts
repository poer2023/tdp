#!/usr/bin/env tsx

/**
 * Utility script to print current feature flag states.
 *
 * Usage:
 *   npx tsx scripts/list-features.ts
 *   npx tsx scripts/list-features.ts --json   # JSON output
 */

import { features, type FeatureKey } from "../src/config/features";

type OutputMode = "table" | "json";

const args = new Set(process.argv.slice(2));
const mode: OutputMode = args.has("--json") ? "json" : "table";

const entries = Object.entries(features.getAll()) as Array<[FeatureKey, boolean]>;

const withMetadata = entries.map(([key, enabled]) => {
  const raw = features.getRaw(key);
  const env = `FEATURE_${key.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toUpperCase()}`;

  return {
    key,
    enabled,
    raw,
    env,
  };
});

if (mode === "json") {
  const json = withMetadata.reduce<Record<string, { enabled: boolean; raw: string }>>(
    (acc, item) => {
      acc[item.key] = { enabled: item.enabled, raw: item.raw };
      return acc;
    },
    {}
  );
  console.log(JSON.stringify(json, null, 2));
  process.exit(0);
}

const longestKey = Math.max(...withMetadata.map((item) => item.key.length));

console.log("Feature Flags");
console.log("==============");
for (const item of withMetadata) {
  const state = item.enabled ? "ENABLED" : "disabled";
  const paddedKey = item.key.padEnd(longestKey, " ");
  console.log(`${paddedKey}  ${state}  (${item.env}=${item.raw || "unset"})`);
}

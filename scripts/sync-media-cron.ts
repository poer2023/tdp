#!/usr/bin/env tsx
/**
 * Media Sync Cron Job
 * Runs periodically to sync watch history from Bilibili and Douban
 *
 * Usage:
 *   - Direct run: tsx scripts/sync-media-cron.ts
 *   - With PM2: pm2 start scripts/sync-media-cron.ts --name media-sync
 *   - One-time: tsx scripts/sync-media-cron.ts --once
 */

import cron from "node-cron";
import { syncAllPlatforms } from "../src/lib/media-sync";

// Load environment variables
import dotenv from "dotenv";
import path from "path";
// Try .env.local first, fallback to .env
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

/**
 * Main sync function
 */
async function runSync() {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`[${new Date().toISOString()}] Starting media sync...`);
  console.log("=".repeat(60));

  try {
    const results = await syncAllPlatforms();

    // Print summary
    console.log("\n" + "=".repeat(60));
    console.log("Sync Summary:");
    console.log("=".repeat(60));

    for (const result of results) {
      const status = result.success ? "✅ SUCCESS" : "❌ FAILED";
      console.log(`\n${result.platform.toUpperCase()}: ${status}`);
      console.log(`  Total items: ${result.itemsTotal}`);
      console.log(`  Success: ${result.itemsSuccess}`);
      console.log(`  Failed: ${result.itemsFailed}`);
      console.log(`  Duration: ${(result.duration / 1000).toFixed(2)}s`);

      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log(`[${new Date().toISOString()}] Sync completed`);
    console.log("=".repeat(60) + "\n");
  } catch (error) {
    console.error("Fatal error during sync:", error);
    process.exit(1);
  }
}

// Check if running as cron or one-time execution
const isOneTime = process.argv.includes("--once");

if (isOneTime) {
  // Run once and exit
  console.log("Running in one-time mode...");
  runSync()
    .then(() => {
      console.log("One-time sync completed, exiting...");
      process.exit(0);
    })
    .catch((error) => {
      console.error("One-time sync failed:", error);
      process.exit(1);
    });
} else {
  // Run as cron job
  const schedule = process.env.SYNC_CRON_SCHEDULE || "0 */3 * * *"; // Default: every 3 hours
  console.log(`Starting media sync cron job with schedule: ${schedule}`);

  cron.schedule(schedule, () => {
    runSync().catch((error) => {
      console.error("Scheduled sync failed:", error);
    });
  });

  // Also run immediately on startup
  console.log("Running initial sync...");
  runSync().catch((error) => {
    console.error("Initial sync failed:", error);
  });

  // Keep the process running
  console.log("Cron job is running. Press Ctrl+C to stop.");
}

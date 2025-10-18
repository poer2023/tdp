#!/usr/bin/env tsx
/**
 * Test Bilibili sync functionality
 * Make sure you have configured BILIBILI_SESSDATA, BILIBILI_BILI_JCT, BILIBILI_BUVID3 in .env.local
 */

import dotenv from "dotenv";
import path from "path";
// Try .env.local first, fallback to .env
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { fetchBilibiliHistory, normalizeBilibiliItem } from "../src/lib/media-sync/bilibili";

async function testBilibili() {
  console.log("🧪 Testing Bilibili sync...\n");

  // Check environment variables
  const sessdata = process.env.BILIBILI_SESSDATA;
  const biliJct = process.env.BILIBILI_BILI_JCT;
  const buvid3 = process.env.BILIBILI_BUVID3;

  if (!sessdata || !biliJct || !buvid3) {
    console.error("❌ Missing Bilibili credentials in .env.local");
    console.error("Please configure:");
    console.error("  - BILIBILI_SESSDATA");
    console.error("  - BILIBILI_BILI_JCT");
    console.error("  - BILIBILI_BUVID3");
    console.error("\nSee docs/GET_BILIBILI_COOKIE.md for instructions");
    process.exit(1);
  }

  console.log("✅ Found Bilibili credentials");
  console.log(`   - SESSDATA: ${sessdata.substring(0, 20)}...`);
  console.log(`   - bili_jct: ${biliJct.substring(0, 10)}...`);
  console.log(`   - buvid3: ${buvid3.substring(0, 15)}...\n`);

  try {
    console.log("Fetching watch history from Bilibili API...");

    const items = await fetchBilibiliHistory(
      {
        sessdata,
        biliJct,
        buvid3,
      },
      1 // Fetch only 1 page (20 items) for testing
    );

    console.log(`\n✅ Successfully fetched ${items.length} items\n`);

    if (items.length > 0) {
      console.log("📋 Sample items:\n");

      items.slice(0, 5).forEach((item, index) => {
        const progressPercent =
          item.duration > 0 ? Math.round((item.progress / item.duration) * 100) : 0;

        console.log(`${index + 1}. ${item.title}`);
        console.log(`   - AID: ${item.aid || "N/A"}`);
        console.log(`   - Owner: ${item.owner?.name || "Unknown"}`);
        console.log(`   - Progress: ${progressPercent}% (${item.progress}s / ${item.duration}s)`);
        console.log(`   - Views: ${item.stat?.view?.toLocaleString() || "N/A"}`);
        console.log(`   - Watched: ${new Date(item.view_at * 1000).toLocaleString("zh-CN")}`);
        console.log(`   - Type: ${item.videos > 1 ? "Series" : "Video"}`);
        console.log(`   - Cover: ${item.pic?.substring(0, 60) || "N/A"}...`);
        console.log();
      });

      // Test normalization
      console.log("🔄 Testing data normalization...\n");
      const normalized = normalizeBilibiliItem(items[0]);
      console.log("Normalized format:");
      console.log(JSON.stringify(normalized, null, 2));

      console.log("\n✅ Bilibili sync test completed successfully!");
      console.log("\nNext steps:");
      console.log("  1. Run full sync: npx tsx scripts/sync-media-cron.ts --once");
      console.log(
        "  2. Start cron job: pm2 start scripts/sync-media-cron.ts --name media-sync --interpreter tsx"
      );
      console.log("  3. View dashboard: http://localhost:3000/admin/sync-dashboard");
    } else {
      console.log("⚠️  No items found. This could mean:");
      console.log("   1. Your Bilibili watch history is empty");
      console.log("   2. The cookies might be expired or invalid");
      console.log("   3. Bilibili API has changed");
      console.log("\nTry:");
      console.log("   1. Re-login to Bilibili and get fresh cookies");
      console.log(
        "   2. Check if you can see your history at: https://www.bilibili.com/account/history"
      );
    }
  } catch (error) {
    console.error("\n❌ Test failed:", error);

    if (error instanceof Error) {
      console.error("Error message:", error.message);

      if (error.message.includes("401") || error.message.includes("Unauthorized")) {
        console.error("\n🔐 Authentication Error:");
        console.error("   Your cookies might be expired or invalid.");
        console.error("   Please get fresh cookies from your browser.");
        console.error("   See docs/GET_BILIBILI_COOKIE.md for instructions");
      } else if (error.message.includes("403") || error.message.includes("Forbidden")) {
        console.error("\n🚫 Access Denied:");
        console.error("   Bilibili might be blocking the request.");
        console.error("   Try accessing your history page manually first:");
        console.error("   https://www.bilibili.com/account/history");
      } else {
        console.error("\nStack trace:", error.stack);
      }
    }

    process.exit(1);
  }
}

testBilibili();

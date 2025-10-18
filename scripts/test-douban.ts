#!/usr/bin/env tsx
/**
 * Test Douban sync functionality
 * Make sure you have configured DOUBAN_COOKIE in .env.local if your account has privacy protection
 */

import dotenv from "dotenv";
import path from "path";
// Try .env.local first, fallback to .env
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { fetchDoubanWatched, normalizeDoubanItem } from "../src/lib/media-sync/douban";

async function testDouban() {
  console.log("🧪 Testing Douban sync...\n");

  const userId = process.env.DOUBAN_USER_ID || "257644246";
  const cookie = process.env.DOUBAN_COOKIE;

  // Check if cookie is configured for private accounts
  if (!cookie) {
    console.log("⚠️  No Douban Cookie found in .env.local");
    console.log("   If your account has privacy protection, you'll only get ~10-15 recent items");
    console.log("   See docs/GET_DOUBAN_COOKIE.md for instructions\n");
  } else {
    console.log("✅ Found Douban Cookie");
    console.log(`   - Cookie: ${cookie.substring(0, 20)}...\n`);
  }

  try {
    console.log(`Fetching data for user: ${userId}`);
    console.log(`URL: https://movie.douban.com/people/${userId}/collect\n`);

    // Fetch first page to check how many items we can get
    const firstPageItems = await fetchDoubanWatched(
      {
        userId,
        cookie,
      },
      1
    );

    console.log(`✅ Successfully fetched ${firstPageItems.length} items from first page\n`);

    if (firstPageItems.length > 0) {
      console.log("📋 Sample items from first page:\n");

      firstPageItems.slice(0, 5).forEach((item, index) => {
        console.log(`${index + 1}. ${item.title}`);
        console.log(`   - ID: ${item.id}`);
        console.log(`   - Type: ${item.type}`);
        console.log(`   - Rating: ${"⭐".repeat(item.rating)}`);
        console.log(`   - Watched: ${item.watchedAt}`);
        console.log(`   - URL: ${item.url}`);
        console.log(`   - Cover: ${item.cover.substring(0, 60)}...`);
        console.log();
      });

      // Test fetching more pages (user has 304 movies, so ~21 pages)
      console.log("🔄 Testing multi-page fetch (5 pages)...\n");
      const multiPageItems = await fetchDoubanWatched(
        {
          userId,
          cookie,
        },
        5
      );

      console.log(`✅ Successfully fetched ${multiPageItems.length} items from 5 pages\n`);

      // Test normalization
      console.log("🔄 Testing data normalization...\n");
      const normalized = normalizeDoubanItem(firstPageItems[0]);
      console.log("Normalized format:");
      console.log(JSON.stringify(normalized, null, 2));

      console.log("\n✅ Douban sync test completed successfully!");
      console.log("\nNext steps:");
      console.log("  1. If you got less than expected, configure DOUBAN_COOKIE in .env.local");
      console.log("  2. Run full sync: npx tsx scripts/sync-media-cron.ts --once");
      console.log(
        "  3. Start cron job: pm2 start scripts/sync-media-cron.ts --name media-sync --interpreter tsx"
      );
      console.log("  4. View dashboard: http://localhost:3000/admin/sync-dashboard");
    } else {
      console.log("⚠️  No items found or limited items");
      console.log("This means:");
      console.log("  1. Cookie might be expired or invalid");
      console.log("  2. Account has privacy protection (needs valid cookie)");
      console.log("  3. Page structure has changed");
      console.log("\nTry:");
      console.log("  1. Get fresh cookie from browser (see docs/GET_DOUBAN_COOKIE.md)");
      console.log("  2. Configure DOUBAN_COOKIE in .env.local");
      console.log("  3. Re-run this test");
    }
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);

      if (error.message.includes("403") || error.message.includes("Forbidden")) {
        console.error("\n🚫 Access Denied:");
        console.error("   Douban might be blocking the request or cookie is invalid");
        console.error("   Try getting fresh cookie from your browser");
        console.error("   See docs/GET_DOUBAN_COOKIE.md for instructions");
      } else {
        console.error("\nStack trace:", error.stack);
      }
    }
  }
}

testDouban();

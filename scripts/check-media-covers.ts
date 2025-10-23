#!/usr/bin/env tsx
/**
 * Database diagnostic script to check media cover data
 *
 * This script queries the database to check if cover images are present
 * for Bilibili and Douban media records.
 *
 * Usage: npm run tsx scripts/check-media-covers.ts
 */

import { prisma } from "@/lib/prisma";

async function checkMediaCovers() {
  console.log("🔍 Checking media cover data...\n");

  try {
    // Get total count for each platform
    const bilibiliTotal = await prisma.mediaWatch.count({
      where: { platform: "BILIBILI" },
    });

    const doubanTotal = await prisma.mediaWatch.count({
      where: { platform: "DOUBAN" },
    });

    // Count records with cover
    const bilibiliWithCover = await prisma.mediaWatch.count({
      where: {
        platform: "BILIBILI",
        cover: { not: null },
      },
    });

    const doubanWithCover = await prisma.mediaWatch.count({
      where: {
        platform: "DOUBAN",
        cover: { not: null },
      },
    });

    // Get sample records
    const bilibiliSamples = await prisma.mediaWatch.findMany({
      where: { platform: "BILIBILI" },
      select: {
        id: true,
        title: true,
        cover: true,
        url: true,
        watchedAt: true,
      },
      orderBy: { watchedAt: "desc" },
      take: 5,
    });

    const doubanSamples = await prisma.mediaWatch.findMany({
      where: { platform: "DOUBAN" },
      select: {
        id: true,
        title: true,
        cover: true,
        url: true,
        watchedAt: true,
      },
      orderBy: { watchedAt: "desc" },
      take: 5,
    });

    // Print statistics
    console.log("📊 Statistics:");
    console.log("─".repeat(80));
    console.log(
      `BILIBILI: ${bilibiliWithCover}/${bilibiliTotal} records have cover images (${Math.round((bilibiliWithCover / bilibiliTotal) * 100)}%)`
    );
    console.log(
      `DOUBAN:   ${doubanWithCover}/${doubanTotal} records have cover images (${Math.round((doubanWithCover / doubanTotal) * 100)}%)`
    );
    console.log();

    // Print Bilibili samples
    console.log("📺 BILIBILI - Recent 5 Records:");
    console.log("─".repeat(80));
    if (bilibiliSamples.length === 0) {
      console.log("  No Bilibili records found");
    } else {
      bilibiliSamples.forEach((record, index) => {
        console.log(`\n${index + 1}. ${record.title}`);
        console.log(`   Cover: ${record.cover ? "✅ " + record.cover : "❌ MISSING"}`);
        console.log(`   URL: ${record.url || "N/A"}`);
        console.log(`   Date: ${record.watchedAt.toISOString().split("T")[0]}`);
      });
    }
    console.log();

    // Print Douban samples
    console.log("🎬 DOUBAN - Recent 5 Records:");
    console.log("─".repeat(80));
    if (doubanSamples.length === 0) {
      console.log("  No Douban records found");
    } else {
      doubanSamples.forEach((record, index) => {
        console.log(`\n${index + 1}. ${record.title}`);
        console.log(`   Cover: ${record.cover ? "✅ " + record.cover : "❌ MISSING"}`);
        console.log(`   URL: ${record.url || "N/A"}`);
        console.log(`   Date: ${record.watchedAt.toISOString().split("T")[0]}`);
      });
    }
    console.log();

    // Analysis
    console.log("💡 Analysis:");
    console.log("─".repeat(80));
    if (bilibiliWithCover === 0 && bilibiliTotal > 0) {
      console.log("⚠️  BILIBILI: No cover images found in database!");
      console.log("   This suggests the sync script may not be fetching cover images.");
    } else if (bilibiliWithCover < bilibiliTotal) {
      console.log(
        `⚠️  BILIBILI: Only ${Math.round((bilibiliWithCover / bilibiliTotal) * 100)}% of records have covers.`
      );
      console.log("   Some records may be missing cover data from the API.");
    } else {
      console.log("✅ BILIBILI: All records have cover images.");
    }

    if (doubanWithCover === 0 && doubanTotal > 0) {
      console.log("⚠️  DOUBAN: No cover images found in database!");
      console.log("   This suggests the sync script may not be scraping cover images.");
    } else if (doubanWithCover < doubanTotal) {
      console.log(
        `⚠️  DOUBAN: Only ${Math.round((doubanWithCover / doubanTotal) * 100)}% of records have covers.`
      );
      console.log("   Some records may be missing cover data from scraping.");
    } else {
      console.log("✅ DOUBAN: All records have cover images.");
    }
  } catch (error) {
    console.error("❌ Error checking media covers:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkMediaCovers()
  .then(() => {
    console.log("\n✅ Check completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Check failed:", error);
    process.exit(1);
  });

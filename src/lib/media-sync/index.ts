/**
 * Media Sync Entry Point
 * Unified interface for syncing media watch history from multiple platforms
 */

import { prisma } from "../prisma";
import type { Prisma } from "@prisma/client";
import { fetchBilibiliHistory, normalizeBilibiliItem, type BilibiliConfig } from "./bilibili";
import { fetchDoubanWatched, normalizeDoubanItem, type DoubanConfig } from "./douban";

export interface SyncResult {
  platform: string;
  success: boolean;
  itemsTotal: number;
  itemsSuccess: number;
  itemsFailed: number;
  duration: number; // milliseconds
  error?: string;
  errorStack?: string;
}

/**
 * Sync Bilibili watch history
 */
export async function syncBilibili(config: BilibiliConfig): Promise<SyncResult> {
  const startTime = Date.now();
  const platform = "bilibili";

  // Create sync job record
  const job = await prisma.syncJob.create({
    data: {
      platform,
      status: "RUNNING",
      triggeredBy: "cron",
    },
  });

  try {
    console.log(`[${platform}] Starting sync...`);

    // Fetch history from Bilibili (fetch 10 pages = 200 items)
    const items = await fetchBilibiliHistory(config, 10);
    console.log(`[${platform}] Fetched ${items.length} items`);

    let successCount = 0;
    let failedCount = 0;

    // Upsert each item to database
    for (const item of items) {
      try {
        const normalized = normalizeBilibiliItem(item);

        await prisma.mediaWatch.upsert({
          where: {
            platform_externalId: {
              platform: normalized.platform,
              externalId: normalized.externalId,
            },
          },
          update: {
            title: normalized.title,
            cover: normalized.cover,
            url: normalized.url,
            watchedAt: normalized.watchedAt,
            progress: normalized.progress,
            duration: normalized.duration,
            metadata: normalized.metadata as Prisma.InputJsonValue,
            updatedAt: new Date(),
          },
          create: normalized as Prisma.MediaWatchCreateInput,
        });

        successCount++;
      } catch (error) {
        console.error(`[${platform}] Failed to sync item ${item.history.bvid}:`, error);
        failedCount++;
      }
    }

    const duration = Date.now() - startTime;

    // Update job record
    await prisma.syncJob.update({
      where: { id: job.id },
      data: {
        status: failedCount > 0 ? "PARTIAL" : "SUCCESS",
        completedAt: new Date(),
        duration,
        itemsTotal: items.length,
        itemsSuccess: successCount,
        itemsFailed: failedCount,
      },
    });

    console.log(
      `[${platform}] Sync completed: ${successCount} success, ${failedCount} failed in ${duration}ms`
    );

    return {
      platform,
      success: true,
      itemsTotal: items.length,
      itemsSuccess: successCount,
      itemsFailed: failedCount,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Update job record with error
    await prisma.syncJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        duration,
        errorMessage,
        errorStack,
      },
    });

    console.error(`[${platform}] Sync failed:`, error);

    return {
      platform,
      success: false,
      itemsTotal: 0,
      itemsSuccess: 0,
      itemsFailed: 0,
      duration,
      error: errorMessage,
      errorStack,
    };
  }
}

/**
 * Sync Douban watch history
 */
export async function syncDouban(config: DoubanConfig): Promise<SyncResult> {
  const startTime = Date.now();
  const platform = "douban";

  // Create sync job record
  const job = await prisma.syncJob.create({
    data: {
      platform,
      status: "RUNNING",
      triggeredBy: "cron",
    },
  });

  try {
    console.log(`[${platform}] Starting sync...`);

    // Fetch watched items from Douban (fetch 25 pages = 375 items to ensure we get everything)
    const items = await fetchDoubanWatched(config, 25);
    console.log(`[${platform}] Fetched ${items.length} items`);

    let successCount = 0;
    let failedCount = 0;

    // Upsert each item to database
    for (const item of items) {
      try {
        const normalized = normalizeDoubanItem(item);

        await prisma.mediaWatch.upsert({
          where: {
            platform_externalId: {
              platform: normalized.platform,
              externalId: normalized.externalId,
            },
          },
          update: {
            title: normalized.title,
            cover: normalized.cover,
            url: normalized.url,
            watchedAt: normalized.watchedAt,
            rating: normalized.rating,
            metadata: normalized.metadata as Prisma.InputJsonValue,
            updatedAt: new Date(),
          },
          create: normalized as Prisma.MediaWatchCreateInput,
        });

        successCount++;
      } catch (error) {
        console.error(`[${platform}] Failed to sync item ${item.id}:`, error);
        failedCount++;
      }
    }

    const duration = Date.now() - startTime;

    // Update job record
    await prisma.syncJob.update({
      where: { id: job.id },
      data: {
        status: failedCount > 0 ? "PARTIAL" : "SUCCESS",
        completedAt: new Date(),
        duration,
        itemsTotal: items.length,
        itemsSuccess: successCount,
        itemsFailed: failedCount,
      },
    });

    console.log(
      `[${platform}] Sync completed: ${successCount} success, ${failedCount} failed in ${duration}ms`
    );

    return {
      platform,
      success: true,
      itemsTotal: items.length,
      itemsSuccess: successCount,
      itemsFailed: failedCount,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Update job record with error
    await prisma.syncJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        duration,
        errorMessage,
        errorStack,
      },
    });

    console.error(`[${platform}] Sync failed:`, error);

    return {
      platform,
      success: false,
      itemsTotal: 0,
      itemsSuccess: 0,
      itemsFailed: 0,
      duration,
      error: errorMessage,
      errorStack,
    };
  }
}

/**
 * Sync all platforms
 */
export async function syncAllPlatforms(): Promise<SyncResult[]> {
  console.log("[Media Sync] Starting sync for all platforms...");

  const results: SyncResult[] = [];

  // Sync Bilibili
  if (
    process.env.BILIBILI_SESSDATA &&
    process.env.BILIBILI_BILI_JCT &&
    process.env.BILIBILI_BUVID3
  ) {
    const bilibiliResult = await syncBilibili({
      sessdata: process.env.BILIBILI_SESSDATA,
      biliJct: process.env.BILIBILI_BILI_JCT,
      buvid3: process.env.BILIBILI_BUVID3,
    });
    results.push(bilibiliResult);
  } else {
    console.warn("[Bilibili] Skipping sync - missing credentials");
  }

  // Sync Douban
  if (process.env.DOUBAN_USER_ID) {
    const doubanResult = await syncDouban({
      userId: process.env.DOUBAN_USER_ID,
      cookie: process.env.DOUBAN_COOKIE,
    });
    results.push(doubanResult);
  } else {
    console.warn("[Douban] Skipping sync - missing user ID");
  }

  const totalSuccess = results.filter((r) => r.success).length;
  const totalFailed = results.filter((r) => !r.success).length;

  console.log(
    `[Media Sync] All platforms completed: ${totalSuccess} success, ${totalFailed} failed`
  );

  return results;
}

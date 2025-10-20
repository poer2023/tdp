/**
 * Media Sync Entry Point
 * Unified interface for syncing media watch history from multiple platforms
 */

import { prisma } from "../prisma";
import type { Prisma } from "@prisma/client";
import { fetchBilibiliHistory, normalizeBilibiliItem, type BilibiliConfig } from "./bilibili";
import { fetchDoubanWatched, normalizeDoubanItem, type DoubanConfig } from "./douban";
import { decryptCredential, isEncrypted } from "../encryption";

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
export async function syncBilibili(
  config: BilibiliConfig,
  credentialId?: string
): Promise<SyncResult> {
  const startTime = Date.now();
  const platform = "BILIBILI";
  const jobId = `sync_bilibili_${Date.now()}`;

  // Create sync job log record
  const job = await prisma.syncJobLog.create({
    data: {
      id: jobId,
      platform,
      jobType: "media_sync",
      status: "RUNNING",
      triggeredBy: credentialId ? "manual" : "cron",
      startedAt: new Date(startTime),
      credentialId,
    },
  });

  try {
    console.log(`[${platform}] Starting sync...`);

    // Fetch history from Bilibili (fetch 10 pages = 200 items)
    const items = await fetchBilibiliHistory(config, 10);
    console.log(`[${platform}] Fetched ${items.length} items`);

    let successCount = 0;
    let failedCount = 0;

    // Limit to most recent 100 items
    const itemsToSync = items.slice(0, 100);
    console.log(`[${platform}] Syncing ${itemsToSync.length} items (limited to 100)`);

    // Upsert each item to database
    for (const item of itemsToSync) {
      try {
        const normalized = normalizeBilibiliItem(item);

        // Upsert MediaWatch record
        const mediaWatch = await prisma.mediaWatch.upsert({
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

        // Create sync log relationship (many-to-many)
        try {
          await prisma.mediaWatchSyncLog.create({
            data: {
              mediaWatchId: mediaWatch.id,
              syncJobLogId: job.id,
            },
          });
        } catch (linkError: any) {
          // If duplicate relationship (already linked), ignore
          if (linkError.code !== "P2002") {
            throw linkError;
          }
        }

        successCount++;
      } catch (error) {
        console.error(`[${platform}] Failed to sync item ${item.history.bvid}:`, error);
        failedCount++;
      }
    }

    const duration = Date.now() - startTime;

    // Update job log record
    await prisma.syncJobLog.update({
      where: { id: job.id },
      data: {
        status: failedCount > 0 ? "PARTIAL" : "SUCCESS",
        completedAt: new Date(),
        duration,
        itemsTotal: itemsToSync.length,
        itemsSuccess: successCount,
        itemsFailed: failedCount,
        message: `Successfully synced ${successCount}/${itemsToSync.length} items`,
      },
    });

    console.log(
      `[${platform}] Sync completed: ${successCount} success, ${failedCount} failed in ${duration}ms`
    );

    return {
      platform,
      success: true,
      itemsTotal: itemsToSync.length,
      itemsSuccess: successCount,
      itemsFailed: failedCount,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Update job log record with error
    await prisma.syncJobLog.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        duration,
        message: errorMessage,
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
export async function syncDouban(
  config: DoubanConfig,
  credentialId?: string
): Promise<SyncResult> {
  const startTime = Date.now();
  const platform = "DOUBAN";
  const jobId = `sync_douban_${Date.now()}`;

  // Create sync job log record
  const job = await prisma.syncJobLog.create({
    data: {
      id: jobId,
      platform,
      jobType: "media_sync",
      status: "RUNNING",
      triggeredBy: credentialId ? "manual" : "cron",
      startedAt: new Date(startTime),
      credentialId,
    },
  });

  try {
    console.log(`[${platform}] Starting sync...`);

    // Fetch watched items from Douban (fetch 25 pages = 375 items to ensure we get everything)
    const items = await fetchDoubanWatched(config, 25);
    console.log(`[${platform}] Fetched ${items.length} items`);

    let successCount = 0;
    let failedCount = 0;

    // Limit to most recent 100 items
    const itemsToSync = items.slice(0, 100);
    console.log(`[${platform}] Syncing ${itemsToSync.length} items (limited to 100)`);

    // Upsert each item to database
    for (const item of itemsToSync) {
      try {
        const normalized = normalizeDoubanItem(item);

        // Upsert MediaWatch record
        const mediaWatch = await prisma.mediaWatch.upsert({
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

        // Create sync log relationship (many-to-many)
        try {
          await prisma.mediaWatchSyncLog.create({
            data: {
              mediaWatchId: mediaWatch.id,
              syncJobLogId: job.id,
            },
          });
        } catch (linkError: any) {
          // If duplicate relationship (already linked), ignore
          if (linkError.code !== "P2002") {
            throw linkError;
          }
        }

        successCount++;
      } catch (error) {
        console.error(`[${platform}] Failed to sync item ${item.id}:`, error);
        failedCount++;
      }
    }

    const duration = Date.now() - startTime;

    // Update job log record
    await prisma.syncJobLog.update({
      where: { id: job.id },
      data: {
        status: failedCount > 0 ? "PARTIAL" : "SUCCESS",
        completedAt: new Date(),
        duration,
        itemsTotal: itemsToSync.length,
        itemsSuccess: successCount,
        itemsFailed: failedCount,
        message: `Successfully synced ${successCount}/${itemsToSync.length} items`,
      },
    });

    console.log(
      `[${platform}] Sync completed: ${successCount} success, ${failedCount} failed in ${duration}ms`
    );

    return {
      platform,
      success: true,
      itemsTotal: itemsToSync.length,
      itemsSuccess: successCount,
      itemsFailed: failedCount,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Update job log record with error
    await prisma.syncJobLog.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        duration,
        message: errorMessage,
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
 * Sync all platforms using credentials from database
 */
export async function syncAllPlatforms(): Promise<SyncResult[]> {
  console.log("[Media Sync] Starting sync for all platforms...");

  const results: SyncResult[] = [];

  try {
    // Fetch all valid media credentials from database
    const credentials = await prisma.externalCredential.findMany({
      where: {
        platform: {
          in: ["BILIBILI", "DOUBAN"],
        },
        isValid: true,
      },
    });

    // Sync Bilibili platforms
    const bilibiliCredentials = credentials.filter((c) => c.platform === "BILIBILI");
    for (const credential of bilibiliCredentials) {
      // Decrypt credential value if encrypted
      const credentialValue = isEncrypted(credential.value)
        ? decryptCredential(credential.value)
        : credential.value;

      // Parse cookie value to extract required fields
      const cookieParts = credentialValue.split(";").reduce(
        (acc, part) => {
          const [key, value] = part.trim().split("=");
          if (key && value) {
            acc[key.trim()] = value.trim();
          }
          return acc;
        },
        {} as Record<string, string>
      );

      const sessdata = cookieParts["SESSDATA"];
      const biliJct = cookieParts["bili_jct"];
      const buvid3 = cookieParts["buvid3"];

      if (sessdata && biliJct && buvid3) {
        const bilibiliResult = await syncBilibili({
          sessdata,
          biliJct,
          buvid3,
        });
        results.push(bilibiliResult);
      } else {
        console.warn(
          `[Bilibili] Credential ${credential.id} missing required cookie fields, skipping`
        );
      }
    }

    // Fallback to environment variables if no Bilibili credentials configured
    if (
      bilibiliCredentials.length === 0 &&
      process.env.BILIBILI_SESSDATA &&
      process.env.BILIBILI_BILI_JCT &&
      process.env.BILIBILI_BUVID3
    ) {
      console.log("[Bilibili] No credentials in database, using environment variables");
      const bilibiliResult = await syncBilibili({
        sessdata: process.env.BILIBILI_SESSDATA,
        biliJct: process.env.BILIBILI_BILI_JCT,
        buvid3: process.env.BILIBILI_BUVID3,
      });
      results.push(bilibiliResult);
    }

    // Sync Douban platforms
    const doubanCredentials = credentials.filter((c) => c.platform === "DOUBAN");
    for (const credential of doubanCredentials) {
      // Support both user_id and userId formats in metadata
      const metadata = credential.metadata as { userId?: string; user_id?: string };
      const userId = metadata.userId || metadata.user_id || process.env.DOUBAN_USER_ID;

      if (userId) {
        // Decrypt credential value if encrypted
        const credentialValue = isEncrypted(credential.value)
          ? decryptCredential(credential.value)
          : credential.value;

        const doubanResult = await syncDouban({
          userId,
          cookie: credentialValue,
        });
        results.push(doubanResult);
      } else {
        console.warn(`[Douban] Credential ${credential.id} missing userId in metadata, skipping`);
      }
    }

    // Fallback to environment variables if no Douban credentials configured
    if (doubanCredentials.length === 0 && process.env.DOUBAN_USER_ID) {
      console.log("[Douban] No credentials in database, using environment variables");
      const doubanResult = await syncDouban({
        userId: process.env.DOUBAN_USER_ID,
        cookie: process.env.DOUBAN_COOKIE,
      });
      results.push(doubanResult);
    }

    if (results.length === 0) {
      console.warn(
        "[Media Sync] No valid media credentials found in database and no environment variables configured"
      );
    }
  } catch (error) {
    console.error("[Media Sync] Error fetching credentials from database:", error);

    // Fallback to environment variables on database error
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
    }

    if (process.env.DOUBAN_USER_ID) {
      const doubanResult = await syncDouban({
        userId: process.env.DOUBAN_USER_ID,
        cookie: process.env.DOUBAN_COOKIE,
      });
      results.push(doubanResult);
    }
  }

  const totalSuccess = results.filter((r) => r.success).length;
  const totalFailed = results.filter((r) => !r.success).length;

  console.log(
    `[Media Sync] All platforms completed: ${totalSuccess} success, ${totalFailed} failed`
  );

  return results;
}

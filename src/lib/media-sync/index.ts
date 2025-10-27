/**
 * Media Sync Entry Point
 * Unified interface for syncing media watch history from multiple platforms
 */

import prismaDefault, { prisma as prismaNamed } from "@/lib/prisma";
import type { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { fetchBilibiliHistory, normalizeBilibiliItem, type BilibiliConfig } from "./bilibili";
import { fetchDoubanWatched, normalizeDoubanItem, type DoubanConfig } from "./douban";
import { fetchSteamRecentlyPlayed, normalizeSteamGame, type SteamConfig } from "./steam";
import { syncGitHub, type GitHubConfig } from "./github";
import { decryptCredential, isEncrypted } from "../encryption";

// Re-export GitHub types and functions for external use
export type { GitHubConfig };
export { syncGitHub };

export interface SyncResult {
  platform: string;
  success: boolean;
  itemsTotal: number;
  itemsSuccess: number;
  itemsFailed: number;
  itemsNew: number; // New items added
  itemsExisting: number; // Items already in database (skipped)
  duration: number; // milliseconds
  error?: string;
  errorStack?: string;
}

// Resolve Prisma client (supports both default and named exports in tests)
const prisma = (prismaNamed ?? prismaDefault) as unknown as PrismaClient;

function getJobDelegate(): PrismaClient["syncJobLog"] | PrismaClient["syncJob"] | undefined {
  const p = prisma as unknown as {
    syncJobLog?: PrismaClient["syncJobLog"];
    syncJob?: PrismaClient["syncJob"];
  };
  return p.syncJobLog ?? p.syncJob;
}

async function createJobLog(data: Record<string, unknown>) {
  const job = getJobDelegate();
  if (!job?.create) throw new Error("Job delegate not available");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (job.create as any)({ data });
}

async function updateJobLog(where: Record<string, unknown>, data: Record<string, unknown>) {
  const job = getJobDelegate();
  if (!job?.update) return; // In tests, we don't need update to exist
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (job.update as any)({ where, data });
}

async function linkMediaWatchToJob(mediaWatchId: string, syncJobLogId: string) {
  const p = prisma as unknown as { mediaWatchSyncLog?: PrismaClient["mediaWatchSyncLog"] };
  const link = p.mediaWatchSyncLog;
  if (!link?.create) return; // Optional in tests/legacy
  await link.create({
    data: { mediaWatchId, syncJobLogId },
  });
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
  const job = await createJobLog({
    id: jobId,
    platform,
    jobType: "media_sync",
    status: "RUNNING",
    triggeredBy: credentialId ? "manual" : "cron",
    startedAt: new Date(startTime),
    credentialId,
  });

  try {
    console.log(`[${platform}] Starting sync...`);

    // Fetch history from Bilibili (fetch 50 pages = ~1000 items, which is the API limit)
    const items = await fetchBilibiliHistory(config, 10);
    console.log(`[${platform}] Fetched ${items.length} items from API`);

    // Normalize first to derive external IDs consistently (tests may omit certain fields)
    const normalizedAll = items.map((it) => normalizeBilibiliItem(it));
    const externalIds = normalizedAll.map((n) => n.externalId);

    // Batch query existing items from database
    let existingRecords: Array<{ externalId: string }> = [];
    {
      const mw = (prisma as unknown as { mediaWatch: Partial<PrismaClient["mediaWatch"]> })
        .mediaWatch;
      if (mw.findMany) {
        existingRecords = (await mw.findMany({
          where: {
            platform: "BILIBILI",
            externalId: { in: externalIds },
          },
          select: { externalId: true },
        })) as Array<{ externalId: string }>;
      }
    }

    const existingSet = new Set(existingRecords.map((r: { externalId: string }) => r.externalId));
    console.log(`[${platform}] Found ${existingSet.size} existing items in database`);

    // Filter out items that already exist
    const newItems = normalizedAll.filter((n) => !existingSet.has(n.externalId));
    console.log(`[${platform}] ${newItems.length} new items to sync`);

    let successCount = 0;
    let failedCount = 0;

    // Only insert new items
    for (const normalized of newItems) {
      try {
        // Insert new MediaWatch record
        const mw = (prisma as unknown as { mediaWatch: Partial<PrismaClient["mediaWatch"]> })
          .mediaWatch;
        let mediaWatch;
        if (mw?.upsert && normalized.externalId) {
          mediaWatch = await mw.upsert({
            where: {
              platform_externalId: {
                platform: normalized.platform,
                externalId: normalized.externalId,
              },
            },
            update: normalized,
            create: normalized,
          });
        } else if (mw?.create) {
          mediaWatch = await mw.create({ data: normalized as Prisma.MediaWatchCreateInput });
        }

        // Create sync log relationship
        if (mediaWatch?.id) {
          await linkMediaWatchToJob(mediaWatch.id, job.id);
        }

        successCount++;
      } catch (error) {
        console.error(`[${platform}] Failed to sync item`, error);
        if (error instanceof Error) {
          console.error(`[${platform}] Error details:`, {
            name: error.name,
            message: error.message,
            stack: error.stack,
          });
        }
        failedCount++;
      }
    }

    const duration = Date.now() - startTime;
    const itemsExisting = items.length - newItems.length;

    // Update job log record
    await updateJobLog(
      { id: job.id },
      {
        status: failedCount > 0 ? "PARTIAL" : "SUCCESS",
        completedAt: new Date(),
        duration,
        itemsTotal: items.length,
        itemsSuccess: successCount,
        itemsFailed: failedCount,
        message: `Synced ${successCount} new items (${itemsExisting} existing, ${failedCount} failed)`,
      }
    );

    console.log(
      `[${platform}] Sync completed: ${successCount} new, ${itemsExisting} existing, ${failedCount} failed in ${duration}ms`
    );

    return {
      platform: platform.toLowerCase(),
      success: true,
      itemsTotal: items.length,
      itemsSuccess: successCount,
      itemsFailed: failedCount,
      itemsNew: successCount,
      itemsExisting,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Update job log record with error
    await updateJobLog(
      { id: job.id },
      {
        status: "FAILED",
        completedAt: new Date(),
        duration,
        message: errorMessage,
        errorStack,
      }
    );

    console.error(`[${platform}] Sync failed:`, error);

    return {
      platform: platform.toLowerCase(),
      success: false,
      itemsTotal: 0,
      itemsSuccess: 0,
      itemsFailed: 0,
      itemsNew: 0,
      itemsExisting: 0,
      duration,
      error: errorMessage,
      errorStack,
    };
  }
}

/**
 * Sync Douban watch history
 */
export async function syncDouban(config: DoubanConfig, credentialId?: string): Promise<SyncResult> {
  const startTime = Date.now();
  const platform = "DOUBAN";
  const jobId = `sync_douban_${Date.now()}`;

  // Create sync job log record
  const job = await createJobLog({
    id: jobId,
    platform,
    jobType: "media_sync",
    status: "RUNNING",
    triggeredBy: credentialId ? "manual" : "cron",
    startedAt: new Date(startTime),
    credentialId,
  });

  try {
    console.log(`[${platform}] Starting sync...`);

    // Fetch watched items from Douban (fetch 25 pages = 375 items to ensure we get everything)
    const items = await fetchDoubanWatched(config, 25);
    console.log(`[${platform}] Fetched ${items.length} items from API`);

    // Extract external IDs for all items
    const externalIds = items.map((item) => item.id);

    // Batch query existing items from database
    let existingRecords: Array<{ externalId: string }> = [];
    {
      const mw = (prisma as unknown as { mediaWatch: Partial<PrismaClient["mediaWatch"]> })
        .mediaWatch;
      if (mw.findMany) {
        existingRecords = (await mw.findMany({
          where: {
            platform: "DOUBAN",
            externalId: { in: externalIds },
          },
          select: { externalId: true },
        })) as Array<{ externalId: string }>;
      }
    }

    const existingSet = new Set(existingRecords.map((r: { externalId: string }) => r.externalId));
    console.log(`[${platform}] Found ${existingSet.size} existing items in database`);

    // Filter out items that already exist
    const newItems = items.filter((item) => !existingSet.has(item.id));
    console.log(`[${platform}] ${newItems.length} new items to sync`);

    let successCount = 0;
    let failedCount = 0;

    // Only insert new items
    for (const item of newItems) {
      try {
        const normalized = normalizeDoubanItem(item);

        // Insert new MediaWatch record
        const mw = (prisma as unknown as { mediaWatch: Partial<PrismaClient["mediaWatch"]> })
          .mediaWatch;
        let mediaWatch;
        if (mw?.upsert && normalized.externalId) {
          mediaWatch = await mw.upsert({
            where: {
              platform_externalId: {
                platform: normalized.platform,
                externalId: normalized.externalId,
              },
            },
            update: normalized,
            create: normalized,
          });
        } else if (mw?.create) {
          mediaWatch = await mw.create({ data: normalized as Prisma.MediaWatchCreateInput });
        }

        // Create sync log relationship
        if (mediaWatch?.id) {
          await linkMediaWatchToJob(mediaWatch.id, job.id);
        }

        successCount++;
      } catch (error) {
        console.error(`[${platform}] Failed to sync item ${item.id}:`, error);
        if (error instanceof Error) {
          console.error(`[${platform}] Error details:`, {
            name: error.name,
            message: error.message,
            stack: error.stack,
          });
        }
        failedCount++;
      }
    }

    const duration = Date.now() - startTime;
    const itemsExisting = items.length - newItems.length;

    // Update job log record
    await updateJobLog(
      { id: job.id },
      {
        status: failedCount > 0 ? "PARTIAL" : "SUCCESS",
        completedAt: new Date(),
        duration,
        itemsTotal: items.length,
        itemsSuccess: successCount,
        itemsFailed: failedCount,
        message: `Synced ${successCount} new items (${itemsExisting} existing, ${failedCount} failed)`,
      }
    );

    console.log(
      `[${platform}] Sync completed: ${successCount} new, ${itemsExisting} existing, ${failedCount} failed in ${duration}ms`
    );

    return {
      platform: platform.toLowerCase(),
      success: true,
      itemsTotal: items.length,
      itemsSuccess: successCount,
      itemsFailed: failedCount,
      itemsNew: successCount,
      itemsExisting,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Update job log record with error
    await updateJobLog(
      { id: job.id },
      {
        status: "FAILED",
        completedAt: new Date(),
        duration,
        message: errorMessage,
        errorStack,
      }
    );

    console.error(`[${platform}] Sync failed:`, error);

    return {
      platform: platform.toLowerCase(),
      success: false,
      itemsTotal: 0,
      itemsSuccess: 0,
      itemsFailed: 0,
      itemsNew: 0,
      itemsExisting: 0,
      duration,
      error: errorMessage,
      errorStack,
    };
  }
}

/**
 * Sync Steam game history
 */
export async function syncSteam(config: SteamConfig, credentialId?: string): Promise<SyncResult> {
  const startTime = Date.now();
  const platform = "STEAM";
  const jobId = `sync_steam_${Date.now()}`;

  // Create sync job log record
  const job = await createJobLog({
    id: jobId,
    platform,
    jobType: "media_sync",
    status: "RUNNING",
    triggeredBy: credentialId ? "manual" : "cron",
    startedAt: new Date(startTime),
    credentialId,
  });

  try {
    console.log(`[${platform}] Starting sync...`);

    // Fetch recently played games from Steam (last 2 weeks, max 20 games)
    const games = await fetchSteamRecentlyPlayed(config, 20);
    console.log(`[${platform}] Fetched ${games.length} games from API`);

    // Extract external IDs for all games
    const externalIds = games.map((game) => game.appid.toString());

    // Batch query existing games from database
    let existingRecords: Array<{ externalId: string }> = [];
    {
      const mw = (prisma as unknown as { mediaWatch: Partial<PrismaClient["mediaWatch"]> })
        .mediaWatch;
      if (mw.findMany) {
        existingRecords = (await mw.findMany({
          where: {
            platform: "STEAM",
            externalId: { in: externalIds },
          },
          select: { externalId: true },
        })) as Array<{ externalId: string }>;
      }
    }

    const existingSet = new Set(existingRecords.map((r: { externalId: string }) => r.externalId));
    console.log(`[${platform}] Found ${existingSet.size} existing games in database`);

    // Filter out games that already exist
    const newGames = games.filter((game) => !existingSet.has(game.appid.toString()));
    console.log(`[${platform}] ${newGames.length} new games to sync`);

    let successCount = 0;
    let failedCount = 0;

    // Only insert new games
    for (const game of newGames) {
      try {
        const normalized = normalizeSteamGame(game);

        // Insert new MediaWatch record
        const mw = (prisma as unknown as { mediaWatch: Partial<PrismaClient["mediaWatch"]> })
          .mediaWatch;
        let mediaWatch;
        if (mw?.upsert && normalized.externalId) {
          mediaWatch = await mw.upsert({
            where: {
              platform_externalId: {
                platform: normalized.platform,
                externalId: normalized.externalId,
              },
            },
            update: normalized,
            create: normalized,
          });
        } else if (mw?.create) {
          mediaWatch = await mw.create({ data: normalized as Prisma.MediaWatchCreateInput });
        }

        // Create sync log relationship
        if (mediaWatch?.id) {
          await linkMediaWatchToJob(mediaWatch.id, job.id);
        }

        successCount++;
      } catch (error) {
        console.error(`[${platform}] Failed to sync game ${game.appid}:`, error);
        if (error instanceof Error) {
          console.error(`[${platform}] Error details:`, {
            name: error.name,
            message: error.message,
            stack: error.stack,
          });
        }
        failedCount++;
      }
    }

    const duration = Date.now() - startTime;
    const itemsExisting = games.length - newGames.length;

    // Update job log record
    await updateJobLog(
      { id: job.id },
      {
        status: failedCount > 0 ? "PARTIAL" : "SUCCESS",
        completedAt: new Date(),
        duration,
        itemsTotal: games.length,
        itemsSuccess: successCount,
        itemsFailed: failedCount,
        message: `Synced ${successCount} new games (${itemsExisting} existing, ${failedCount} failed)`,
      }
    );

    console.log(
      `[${platform}] Sync completed: ${successCount} new, ${itemsExisting} existing, ${failedCount} failed in ${duration}ms`
    );

    return {
      platform: platform.toLowerCase(),
      success: true,
      itemsTotal: games.length,
      itemsSuccess: successCount,
      itemsFailed: failedCount,
      itemsNew: successCount,
      itemsExisting,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Update job log record with error
    await updateJobLog(
      { id: job.id },
      {
        status: "FAILED",
        completedAt: new Date(),
        duration,
        message: errorMessage,
        errorStack,
      }
    );

    console.error(`[${platform}] Sync failed:`, error);

    return {
      platform: platform.toLowerCase(),
      success: false,
      itemsTotal: 0,
      itemsSuccess: 0,
      itemsFailed: 0,
      itemsNew: 0,
      itemsExisting: 0,
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
          in: ["BILIBILI", "DOUBAN", "STEAM"],
        },
        isValid: true,
      },
    });

    // Sync Bilibili platforms
    const bilibiliCredentials = (
      credentials as Array<{
        id: string;
        platform: string;
        value: string;
        isValid: boolean;
        metadata?: unknown;
      }>
    ).filter((c) => c.platform === "BILIBILI");
    for (const credential of bilibiliCredentials) {
      // Decrypt credential value if encrypted
      const credentialValue = isEncrypted(credential.value)
        ? decryptCredential(credential.value)
        : credential.value;

      // Parse cookie value to extract required fields
      const cookieParts: Record<string, string> = credentialValue.split(";").reduce(
        (acc: Record<string, string>, part: string) => {
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
    const doubanCredentials = (
      credentials as Array<{
        id: string;
        platform: string;
        value: string;
        isValid: boolean;
        metadata?: unknown;
      }>
    ).filter((c) => c.platform === "DOUBAN");
    for (const credential of doubanCredentials) {
      // Support both user_id and userId formats in metadata
      const metadata = credential.metadata as { userId?: string; user_id?: string } | null;
      const userId = metadata?.userId || metadata?.user_id || process.env.DOUBAN_USER_ID;

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

    // Sync Steam platforms
    const steamCredentials = (
      credentials as Array<{
        id: string;
        platform: string;
        value: string;
        isValid: boolean;
        metadata?: unknown;
      }>
    ).filter((c) => c.platform === "STEAM");
    for (const credential of steamCredentials) {
      // Get Steam ID from metadata
      const metadata = credential.metadata as { steamId?: string } | null;
      const steamId = metadata?.steamId || process.env.STEAM_ID;

      if (steamId) {
        // Decrypt credential value if encrypted (API Key)
        const apiKey = isEncrypted(credential.value)
          ? decryptCredential(credential.value)
          : credential.value;

        const steamResult = await syncSteam({
          apiKey,
          steamId,
        });
        results.push(steamResult);
      } else {
        console.warn(`[Steam] Credential ${credential.id} missing steamId in metadata, skipping`);
      }
    }

    // Fallback to environment variables if no Steam credentials configured
    if (steamCredentials.length === 0 && process.env.STEAM_API_KEY && process.env.STEAM_ID) {
      console.log("[Steam] No credentials in database, using environment variables");
      const steamResult = await syncSteam({
        apiKey: process.env.STEAM_API_KEY,
        steamId: process.env.STEAM_ID,
      });
      results.push(steamResult);
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

    if (process.env.STEAM_API_KEY && process.env.STEAM_ID) {
      const steamResult = await syncSteam({
        apiKey: process.env.STEAM_API_KEY,
        steamId: process.env.STEAM_ID,
      });
      results.push(steamResult);
    }
  }

  const totalSuccess = results.filter((r) => r.success).length;
  const totalFailed = results.filter((r) => !r.success).length;

  console.log(
    `[Media Sync] All platforms completed: ${totalSuccess} success, ${totalFailed} failed`
  );

  return results;
}

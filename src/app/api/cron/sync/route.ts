/**
 * Cron Job API for Automatic Sync Scheduling
 *
 * This endpoint is triggered by Vercel Cron Jobs to automatically sync data
 * from all configured platforms based on their sync frequency settings.
 *
 * Vercel Cron Configuration (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/sync",
 *     "schedule": "0 * * * *"  // Every hour
 *   }]
 * }
 *
 * Security:
 * - Vercel Cron uses CRON_SECRET for authentication
 * - Set CRON_SECRET in environment variables
 * - Endpoint validates authorization header
 *
 * Sync Frequency Logic:
 * - hourly: Sync if last sync was >1 hour ago
 * - daily: Sync if last sync was >24 hours ago
 * - weekly: Sync if last sync was >7 days ago
 * - disabled: Skip sync
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { syncAllPlatforms as syncMedia } from "@/lib/media-sync";
import { GamingSyncService } from "@/lib/gaming/sync-service";
import { decryptCredential, isEncrypted } from "@/lib/encryption";

type SyncFrequency = "hourly" | "daily" | "weekly" | "disabled";

interface SyncSchedule {
  credentialId: string;
  platform: string;
  frequency: SyncFrequency;
  lastSyncAt: Date | null;
  shouldSync: boolean;
  reason: string;
}

/**
 * Calculate if credential should be synced based on frequency and last sync time
 */
function shouldSyncCredential(
  frequency: SyncFrequency,
  lastSyncAt: Date | null
): { shouldSync: boolean; reason: string } {
  if (frequency === "disabled") {
    return { shouldSync: false, reason: "Sync disabled" };
  }

  if (!lastSyncAt) {
    return { shouldSync: true, reason: "Never synced before" };
  }

  const now = Date.now();
  const lastSync = lastSyncAt.getTime();
  const hoursSinceLastSync = (now - lastSync) / (1000 * 60 * 60);

  switch (frequency) {
    case "hourly":
      if (hoursSinceLastSync >= 1) {
        return { shouldSync: true, reason: `Last sync ${hoursSinceLastSync.toFixed(1)}h ago` };
      }
      return { shouldSync: false, reason: `Synced ${hoursSinceLastSync.toFixed(1)}h ago (< 1h)` };

    case "daily":
      if (hoursSinceLastSync >= 24) {
        return { shouldSync: true, reason: `Last sync ${(hoursSinceLastSync / 24).toFixed(1)}d ago` };
      }
      return {
        shouldSync: false,
        reason: `Synced ${hoursSinceLastSync.toFixed(1)}h ago (< 24h)`,
      };

    case "weekly":
      if (hoursSinceLastSync >= 168) {
        // 7 * 24
        return { shouldSync: true, reason: `Last sync ${(hoursSinceLastSync / 168).toFixed(1)}w ago` };
      }
      return {
        shouldSync: false,
        reason: `Synced ${(hoursSinceLastSync / 24).toFixed(1)}d ago (< 7d)`,
      };

    default:
      return { shouldSync: false, reason: "Unknown frequency" };
  }
}

/**
 * GET /api/cron/sync
 * Automatic sync endpoint triggered by Vercel Cron
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Security: Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.warn("[Cron Sync] Unauthorized access attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[Cron Sync] Starting automatic sync job...");

    // Fetch all valid credentials with auto-sync enabled
    const credentials = await prisma.externalCredential.findMany({
      where: {
        isValid: true,
        autoSync: true,
      },
      include: {
        syncJobLogs: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
        syncJobs: {
          orderBy: {
            startedAt: "desc",
          },
          take: 1,
        },
      },
    });

    console.log(`[Cron Sync] Found ${credentials.length} credentials with auto-sync enabled`);

    // Determine which credentials need syncing
    const syncSchedules: SyncSchedule[] = credentials.map((credential) => {
      const frequency = (credential.syncFrequency || "disabled") as SyncFrequency;

      // Get last sync time from either SyncJobLog or SyncJob
      const lastSyncJobLog = credential.syncJobLogs[0];
      const lastSyncJob = credential.syncJobs[0];

      const lastSyncAt =
        lastSyncJobLog?.createdAt || lastSyncJob?.startedAt || null;

      const { shouldSync, reason } = shouldSyncCredential(frequency, lastSyncAt);

      return {
        credentialId: credential.id,
        platform: credential.platform,
        frequency,
        lastSyncAt,
        shouldSync,
        reason,
      };
    });

    // Filter credentials that need syncing
    const credentialsToSync = syncSchedules.filter((s) => s.shouldSync);
    const skippedCredentials = syncSchedules.filter((s) => !s.shouldSync);

    console.log(`[Cron Sync] Syncing ${credentialsToSync.length} credentials`);
    console.log(`[Cron Sync] Skipping ${skippedCredentials.length} credentials`);

    // Log sync decisions
    syncSchedules.forEach((schedule) => {
      const prefix = schedule.shouldSync ? "✅ SYNC" : "⏭️  SKIP";
      console.log(
        `${prefix} ${schedule.platform} (${schedule.frequency}): ${schedule.reason}`
      );
    });

    // Execute syncs
    const syncResults: Array<{ platform: string; success: boolean; message?: string }> = [];

    // Group credentials by platform for efficient syncing
    const platformGroups = credentialsToSync.reduce(
      (acc, schedule) => {
        if (!acc[schedule.platform]) {
          acc[schedule.platform] = [];
        }
        acc[schedule.platform].push(schedule);
        return acc;
      },
      {} as Record<string, SyncSchedule[]>
    );

    // Sync each platform group
    for (const [platform, schedules] of Object.entries(platformGroups)) {
      try {
        console.log(`[Cron Sync] Syncing ${platform} (${schedules.length} credentials)...`);

        if (platform === "BILIBILI" || platform === "DOUBAN") {
          // Media platforms: sync all at once
          const mediaResults = await syncMedia();
          syncResults.push(
            ...mediaResults.map((result) => ({
              platform: result.platform,
              success: result.success,
              message: result.error || `${result.itemsSuccess} items synced`,
            }))
          );
        } else if (platform === "STEAM" || platform === "HOYOVERSE") {
          // Gaming platforms: sync each credential separately
          const gamingService = new GamingSyncService();

          for (const schedule of schedules) {
            const credential = credentials.find((c) => c.id === schedule.credentialId);
            if (!credential) continue;

            const metadata = credential.metadata as { steamId?: string; uid?: string };

            if (platform === "STEAM" && metadata.steamId) {
              const result = await gamingService.syncSteamData(metadata.steamId);
              syncResults.push({
                platform: "STEAM",
                success: result.success,
                message: result.message,
              });
            } else if (platform === "HOYOVERSE" && metadata.uid) {
              const result = await gamingService.syncZZZData(metadata.uid);
              syncResults.push({
                platform: "HOYOVERSE",
                success: result.success,
                message: result.message,
              });
            }
          }
        }
      } catch (error) {
        console.error(`[Cron Sync] Error syncing ${platform}:`, error);
        syncResults.push({
          platform,
          success: false,
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const duration = Date.now() - startTime;
    const successCount = syncResults.filter((r) => r.success).length;
    const failCount = syncResults.filter((r) => !r.success).length;

    console.log(
      `[Cron Sync] Completed in ${duration}ms: ${successCount} success, ${failCount} failed`
    );

    return NextResponse.json({
      success: true,
      duration,
      summary: {
        totalCredentials: credentials.length,
        synced: credentialsToSync.length,
        skipped: skippedCredentials.length,
        succeeded: successCount,
        failed: failCount,
      },
      schedules: syncSchedules,
      results: syncResults,
    });
  } catch (error) {
    console.error("[Cron Sync] Fatal error:", error);
    return NextResponse.json(
      {
        error: "Sync job failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

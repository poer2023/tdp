import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import type { SyncJobStatus } from "@prisma/client";

type SyncStatus = {
  platform: string;
  lastSyncAt: string;
  status: SyncJobStatus;
};

/**
 * Cached provider for sync status used on About page.
 * - Consolidates DB access and shields cold starts
 * - Tag-based invalidation via `sync-status`
 */
const getSyncStatusBase = async (): Promise<SyncStatus[]> => {
  const SKIP_DB = process.env.E2E_SKIP_DB === "1" || process.env.E2E_SKIP_DB === "true";
  if (SKIP_DB) return [];

  const platforms = ["bilibili", "douban", "steam", "hoyoverse", "jellyfin"] as const;

  const syncStatuses = await Promise.all(
    platforms.map(async (platform) => {
      const latestSync = await prisma.syncJobLog.findFirst({
        where: { platform: platform.toUpperCase() },
        orderBy: { createdAt: "desc" },
        select: { platform: true, status: true, createdAt: true },
      });

      if (!latestSync && (platform === "bilibili" || platform === "douban")) {
        const mediaSyncJob = await prisma.syncJob.findFirst({
          where: { platform },
          orderBy: { startedAt: "desc" },
          select: { platform: true, status: true, startedAt: true },
        });

        if (mediaSyncJob) {
          return {
            platform: mediaSyncJob.platform,
            lastSyncAt: mediaSyncJob.startedAt.toISOString(),
            status: mediaSyncJob.status,
          } satisfies SyncStatus;
        }
      }

      if (latestSync) {
        return {
          platform: latestSync.platform.toLowerCase(),
          lastSyncAt: latestSync.createdAt.toISOString(),
          status: latestSync.status,
        } satisfies SyncStatus;
      }

      return null;
    })
  );

  return syncStatuses.filter((s): s is SyncStatus => s !== null);
};

export const getSyncStatus =
  process.env.NODE_ENV === "test"
    ? getSyncStatusBase
    : unstable_cache(getSyncStatusBase, ["sync-status-cache"], {
        revalidate: 60,
        tags: ["sync-status"],
      });

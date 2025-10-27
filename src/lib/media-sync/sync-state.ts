/**
 * Sync State Management
 * Helper functions to query and manage incremental sync state
 */

import prismaDefault, { prisma as prismaNamed } from "@/lib/prisma";
import type { PrismaClient } from "@prisma/client";
import type { LastSyncInfo } from "./sync-config";

// Resolve Prisma client (supports both default and named exports in tests)
const prisma = (prismaNamed ?? prismaDefault) as unknown as PrismaClient;

/**
 * Get the last successful sync information for a platform
 * @param platform Platform name (e.g., "BILIBILI", "DOUBAN")
 * @returns Last sync information or null if no previous sync
 */
export async function getLastSuccessfulSync(platform: string): Promise<LastSyncInfo | null> {
  try {
    const syncJobLog = (prisma as unknown as { syncJobLog?: Partial<PrismaClient["syncJobLog"]> })
      .syncJobLog;

    if (!syncJobLog?.findFirst) {
      return null;
    }

    const lastSync = await syncJobLog.findFirst({
      where: {
        platform: platform.toUpperCase(),
        status: "SUCCESS",
      },
      orderBy: {
        completedAt: "desc",
      },
      select: {
        lastCursor: true,
        lastSyncedAt: true,
        completedAt: true,
        syncMode: true,
      },
    });

    if (!lastSync) {
      return null;
    }

    return {
      lastCursor: lastSync.lastCursor ?? undefined,
      lastSyncedAt: lastSync.lastSyncedAt ?? undefined,
      completedAt: lastSync.completedAt ?? undefined,
      syncMode: (lastSync.syncMode as "full" | "incremental") ?? undefined,
    };
  } catch (error) {
    console.error(`[${platform}] Failed to get last sync info:`, error);
    return null;
  }
}

/**
 * Check if an externalId already exists in the database
 * @param platform Platform name
 * @param externalIds Array of external IDs to check
 * @returns Set of existing external IDs
 */
export async function getExistingExternalIds(
  platform: string,
  externalIds: string[]
): Promise<Set<string>> {
  try {
    const mediaWatch = (prisma as unknown as { mediaWatch: Partial<PrismaClient["mediaWatch"]> })
      .mediaWatch;

    if (!mediaWatch?.findMany || externalIds.length === 0) {
      return new Set();
    }

    const existingRecords = await mediaWatch.findMany({
      where: {
        platform: platform.toUpperCase(),
        externalId: { in: externalIds },
      },
      select: { externalId: true },
    });

    return new Set(existingRecords.map((r: { externalId: string }) => r.externalId));
  } catch (error) {
    console.error(`[${platform}] Failed to query existing items:`, error);
    return new Set();
  }
}

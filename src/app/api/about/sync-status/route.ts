import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/about/sync-status
 * Returns sync status for all platforms (public API for About page)
 */
export async function GET() {
  const SKIP_DB = process.env.E2E_SKIP_DB === "1" || process.env.E2E_SKIP_DB === "true";

  if (SKIP_DB) {
    return NextResponse.json({ platforms: [] });
  }

  try {
    // Get latest sync jobs for each platform
    const platforms = ["bilibili", "douban", "steam", "hoyoverse", "jellyfin"];
    
    const syncStatuses = await Promise.all(
      platforms.map(async (platform) => {
        // Get latest sync job for each platform from SyncJobLog
        const latestSync = await prisma.syncJobLog.findFirst({
          where: {
            platform: platform.toUpperCase() as any,
          },
          orderBy: {
            createdAt: "desc",
          },
          select: {
            platform: true,
            status: true,
            createdAt: true,
          },
        });

        // If no sync found in SyncJobLog, try SyncJob for media platforms
        if (!latestSync && (platform === "bilibili" || platform === "douban")) {
          const mediaSyncJob = await prisma.syncJob.findFirst({
            where: {
              platform,
            },
            orderBy: {
              startedAt: "desc",
            },
            select: {
              platform: true,
              status: true,
              startedAt: true,
            },
          });

          if (mediaSyncJob) {
            return {
              platform: mediaSyncJob.platform,
              lastSyncAt: mediaSyncJob.startedAt.toISOString(),
              status: mediaSyncJob.status,
            };
          }
        }

        if (latestSync) {
          return {
            platform: latestSync.platform.toLowerCase(),
            lastSyncAt: latestSync.createdAt.toISOString(),
            status: latestSync.status,
          };
        }

        return null;
      })
    );

    // Filter out null values and return
    const validStatuses = syncStatuses.filter((status) => status !== null);

    return NextResponse.json(
      { platforms: validStatuses },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    console.error("[Sync Status API] Error:", error);
    return NextResponse.json({ platforms: [] }, { status: 500 });
  }
}

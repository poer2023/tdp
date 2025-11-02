import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/sync/status
 * Returns sync job status and statistics
 * Requires admin authentication
 */
export async function GET() {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch recent sync jobs (last 50)
    const recentJobs = await prisma.syncJob.findMany({
      orderBy: { startedAt: "desc" },
      take: 50,
    });

    // Calculate statistics
    const stats = {
      total: await prisma.syncJob.count(),
      success: await prisma.syncJob.count({ where: { status: "SUCCESS" } }),
      failed: await prisma.syncJob.count({ where: { status: "FAILED" } }),
      partial: await prisma.syncJob.count({ where: { status: "PARTIAL" } }),
      running: await prisma.syncJob.count({ where: { status: "RUNNING" } }),
    };

    // Platform-specific stats
    const platformStats = {
      bilibili: {
        total: await prisma.syncJob.count({ where: { platform: "bilibili" } }),
        lastSync: await prisma.syncJob.findFirst({
          where: { platform: "bilibili" },
          orderBy: { startedAt: "desc" },
        }),
      },
      douban: {
        total: await prisma.syncJob.count({ where: { platform: "douban" } }),
        lastSync: await prisma.syncJob.findFirst({
          where: { platform: "douban" },
          orderBy: { startedAt: "desc" },
        }),
      },
    };

    // Media watch statistics
    const mediaStats = {
      totalItems: await prisma.mediaWatch.count(),
      byPlatform: {
        bilibili: await prisma.mediaWatch.count({ where: { platform: "bilibili" } }),
        douban: await prisma.mediaWatch.count({ where: { platform: "douban" } }),
        jellyfin: await prisma.mediaWatch.count({ where: { platform: "jellyfin" } }),
      },
      recentlyAdded: await prisma.mediaWatch.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      }),
    };

    return NextResponse.json({
      stats,
      platformStats,
      mediaStats,
      recentJobs,
    });
  } catch (error) {
    console.error("[Sync Status API] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

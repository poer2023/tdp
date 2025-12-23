/**
 * API for fetching infrastructure statistics
 *
 * GET /api/infra/stats
 * Returns uptime statistics and performance metrics
 *
 * OPTIMIZED: Uses DB aggregation to avoid N+1 queries
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const revalidate = 60; // Cache for 1 minute

export async function GET(_request: NextRequest) {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get all active monitors
    const monitors = await prisma.monitor.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });

    const monitorIds = monitors.map((m) => m.id);

    // Use aggregation to get all stats in fewer queries
    const [
      // 24h stats grouped by monitor
      heartbeats24hAgg,
      // 30d stats grouped by monitor
      heartbeats30dAgg,
      // Latest heartbeat per monitor (using raw query for efficiency)
      latestHeartbeats,
    ] = await Promise.all([
      // 24h: count total and UP status per monitor, avg response time
      prisma.monitorHeartbeat.groupBy({
        by: ["monitorId", "status"],
        where: {
          monitorId: { in: monitorIds },
          timestamp: { gte: oneDayAgo },
        },
        _count: { id: true },
        _avg: { responseTime: true },
      }),
      // 30d: count total and UP status per monitor
      prisma.monitorHeartbeat.groupBy({
        by: ["monitorId", "status"],
        where: {
          monitorId: { in: monitorIds },
          timestamp: { gte: thirtyDaysAgo },
        },
        _count: { id: true },
      }),
      // Latest heartbeat per monitor using distinct on (more efficient than N findFirst calls)
      prisma.$queryRaw<Array<{ monitorId: string; status: string; responseTime: number | null }>>`
        SELECT DISTINCT ON ("monitorId")
          "monitorId",
          "status",
          "responseTime"
        FROM "MonitorHeartbeat"
        WHERE "monitorId" = ANY(${monitorIds}::text[])
        ORDER BY "monitorId", "timestamp" DESC
      `,
    ]);

    // Process aggregated results into monitor stats
    const monitorStats = monitors.map((monitor) => {
      // 24h stats
      const stats24h = heartbeats24hAgg.filter((s) => s.monitorId === monitor.id);
      const total24h = stats24h.reduce((sum, s) => sum + s._count.id, 0);
      const up24h = stats24h.find((s) => s.status === "UP")?._count.id || 0;
      const uptime24h = total24h > 0 ? (up24h / total24h) * 100 : 0;

      // Get average response time from UP heartbeats in 24h
      const upStats24h = stats24h.find((s) => s.status === "UP");
      const avgResponseTime = upStats24h?._avg.responseTime || null;

      // 30d stats
      const stats30d = heartbeats30dAgg.filter((s) => s.monitorId === monitor.id);
      const total30d = stats30d.reduce((sum, s) => sum + s._count.id, 0);
      const up30d = stats30d.find((s) => s.status === "UP")?._count.id || 0;
      const uptime30d = total30d > 0 ? (up30d / total30d) * 100 : 0;

      // Latest heartbeat
      const latest = latestHeartbeats.find((h) => h.monitorId === monitor.id);

      return {
        monitorId: monitor.id,
        monitorName: monitor.name,
        uptime24h: Math.round(uptime24h * 100) / 100,
        uptime30d: Math.round(uptime30d * 100) / 100,
        avgResponseTime: avgResponseTime ? Math.round(avgResponseTime) : null,
        currentStatus: latest?.status || "PENDING",
        lastResponseTime: latest?.responseTime || null,
      };
    });

    // Calculate overall stats
    const overallUptime24h =
      monitorStats.length > 0
        ? monitorStats.reduce((sum, s) => sum + s.uptime24h, 0) / monitorStats.length
        : 0;

    const overallUptime30d =
      monitorStats.length > 0
        ? monitorStats.reduce((sum, s) => sum + s.uptime30d, 0) / monitorStats.length
        : 0;

    const activeMonitors = monitorStats.filter((s) => s.currentStatus === "UP").length;
    const downMonitors = monitorStats.filter((s) => s.currentStatus === "DOWN").length;

    return NextResponse.json({
      success: true,
      overall: {
        uptime24h: Math.round(overallUptime24h * 100) / 100,
        uptime30d: Math.round(overallUptime30d * 100) / 100,
        totalMonitors: monitors.length,
        activeMonitors,
        downMonitors,
      },
      monitors: monitorStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[API /infra/stats] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch statistics",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

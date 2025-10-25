/**
 * API for fetching infrastructure statistics
 *
 * GET /api/infra/stats
 * Returns uptime statistics and performance metrics
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

    // Calculate stats for each monitor
    const monitorStats = await Promise.all(
      monitors.map(async (monitor) => {
        // Get heartbeats for 24h and 30d periods
        const [heartbeats24h, heartbeats30d, latestHeartbeat] = await Promise.all([
          prisma.monitorHeartbeat.findMany({
            where: {
              monitorId: monitor.id,
              timestamp: { gte: oneDayAgo },
            },
            select: { status: true, responseTime: true },
          }),
          prisma.monitorHeartbeat.findMany({
            where: {
              monitorId: monitor.id,
              timestamp: { gte: thirtyDaysAgo },
            },
            select: { status: true },
          }),
          prisma.monitorHeartbeat.findFirst({
            where: { monitorId: monitor.id },
            orderBy: { timestamp: "desc" },
            select: { status: true, responseTime: true },
          }),
        ]);

        // Calculate uptime percentages
        const uptime24h =
          heartbeats24h.length > 0
            ? (heartbeats24h.filter((h) => h.status === "UP").length / heartbeats24h.length) * 100
            : 0;

        const uptime30d =
          heartbeats30d.length > 0
            ? (heartbeats30d.filter((h) => h.status === "UP").length / heartbeats30d.length) * 100
            : 0;

        // Calculate average response time (24h)
        const validResponseTimes = heartbeats24h
          .map((h) => h.responseTime)
          .filter((rt): rt is number => rt !== null && rt > 0);

        const avgResponseTime =
          validResponseTimes.length > 0
            ? validResponseTimes.reduce((sum, rt) => sum + rt, 0) / validResponseTimes.length
            : null;

        return {
          monitorId: monitor.id,
          monitorName: monitor.name,
          uptime24h: Math.round(uptime24h * 100) / 100,
          uptime30d: Math.round(uptime30d * 100) / 100,
          avgResponseTime: avgResponseTime ? Math.round(avgResponseTime) : null,
          currentStatus: latestHeartbeat?.status || "PENDING",
          lastResponseTime: latestHeartbeat?.responseTime || null,
        };
      })
    );

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

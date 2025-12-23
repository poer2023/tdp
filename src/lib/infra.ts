/**
 * Infrastructure Data Layer
 *
 * Provides cached access to infrastructure monitoring data
 * Used by /api/about/live/infra and other routes
 */

import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import type { SelfHostedService, InfraEvent, Server } from "@/types/live-data";

// Cache tag for infra data invalidation
export const INFRA_TAG = "infra-data";

/**
 * Internal function to fetch monitors with their latest heartbeat
 */
async function _fetchMonitorsWithStatus(): Promise<SelfHostedService[]> {
    const monitors = await prisma.monitor.findMany({
        where: { isActive: true },
        include: {
            heartbeats: {
                orderBy: { timestamp: "desc" as const },
                take: 1,
            },
        },
        orderBy: { name: "asc" as const },
    });

    return monitors.map((monitor) => {
        const latestHeartbeat = monitor.heartbeats[0];
        const metadata: Record<string, string | number> = {};

        if (typeof latestHeartbeat?.responseTime === "number") {
            metadata.responseTime = latestHeartbeat.responseTime;
        }
        if (latestHeartbeat?.timestamp) {
            metadata.lastCheck = latestHeartbeat.timestamp.toISOString();
        }

        return {
            id: monitor.id,
            name: monitor.name.toLowerCase().replace(/\s+/g, "-"),
            displayName: monitor.name,
            status:
                latestHeartbeat?.status === "UP"
                    ? "running"
                    : latestHeartbeat?.status === "DOWN"
                        ? "stopped"
                        : "maintenance",
            url: monitor.url ?? undefined,
            server: "monitoring",
            uptime: 0, // Will be populated from stats if needed
            metadata,
        } satisfies SelfHostedService;
    });
}

/**
 * Internal function to fetch overall uptime stats
 */
async function _fetchOverallStats(): Promise<{
    uptime30d: number;
    downMonitors: number;
    activeMonitors: number;
    totalMonitors: number;
}> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const monitors = await prisma.monitor.findMany({
        where: { isActive: true },
        select: { id: true },
    });

    const monitorIds = monitors.map((m) => m.id);

    // Get 30d stats with aggregation
    const [heartbeats30d, latestByMonitor] = await Promise.all([
        prisma.monitorHeartbeat.groupBy({
            by: ["status"],
            where: {
                monitorId: { in: monitorIds },
                timestamp: { gte: thirtyDaysAgo },
            },
            _count: { id: true },
        }),
        prisma.$queryRaw<Array<{ status: string }>>`
      SELECT DISTINCT ON ("monitorId") "status"
      FROM "MonitorHeartbeat"
      WHERE "monitorId" = ANY(${monitorIds}::text[])
      ORDER BY "monitorId", "timestamp" DESC
    `,
    ]);

    const total = heartbeats30d.reduce((sum, s) => sum + s._count.id, 0);
    const up = heartbeats30d.find((s) => s.status === "UP")?._count.id || 0;
    const uptime30d = total > 0 ? (up / total) * 100 : 0;

    const activeMonitors = latestByMonitor.filter((h) => h.status === "UP").length;
    const downMonitors = latestByMonitor.filter((h) => h.status === "DOWN").length;

    return {
        uptime30d: Math.round(uptime30d * 100) / 100,
        downMonitors,
        activeMonitors,
        totalMonitors: monitors.length,
    };
}

/**
 * Internal function to fetch recent incidents
 */
async function _fetchRecentIncidents(limit: number = 10): Promise<InfraEvent[]> {
    const incidents = await prisma.monitorHeartbeat.findMany({
        where: { status: "DOWN" },
        include: {
            monitor: {
                select: { id: true, name: true },
            },
        },
        orderBy: { timestamp: "desc" as const },
        take: limit,
    });

    return incidents.slice(0, limit).map((incident) => ({
        timestamp: incident.timestamp,
        type: "warning" as const,
        message: `${incident.monitor.name} reported DOWN status`,
        serviceId: incident.monitor.id,
    }));
}

// Cached versions with 60s TTL
const getCachedMonitors = unstable_cache(_fetchMonitorsWithStatus, ["infra-monitors"], {
    revalidate: 60,
    tags: [INFRA_TAG],
});

const getCachedOverallStats = unstable_cache(_fetchOverallStats, ["infra-overall-stats"], {
    revalidate: 60,
    tags: [INFRA_TAG],
});

const getCachedRecentIncidents = unstable_cache(_fetchRecentIncidents, ["infra-recent-incidents"], {
    revalidate: 60,
    tags: [INFRA_TAG],
});

/**
 * Get infrastructure data for the live dashboard
 * Uses cached functions to avoid redundant DB queries
 */
export async function getInfraData(): Promise<{
    servers: Server[];
    services: SelfHostedService[];
    events: InfraEvent[];
}> {
    const [services, overallStats, incidents] = await Promise.all([
        getCachedMonitors(),
        getCachedOverallStats(),
        getCachedRecentIncidents(10),
    ]);

    // Create simplified server overview
    const servers: Server[] = [
        {
            id: "monitoring-01",
            name: "Monitoring System",
            location: "US",
            status: overallStats.downMonitors > 0 ? "warning" : "healthy",
            specs: {
                cpu: { cores: 0, usage: 0 },
                memory: { total: 0, used: 0 },
                disk: { total: 0, used: 0 },
            },
            services: services.map((s) => s.name),
            uptime: overallStats.uptime30d,
        },
    ];

    return { servers, services, events: incidents };
}

// Export individual cached functions for granular access
export { getCachedMonitors, getCachedOverallStats, getCachedRecentIncidents };

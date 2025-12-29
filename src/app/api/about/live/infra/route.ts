import { NextResponse } from "next/server";
import type { InfraData, Server, SelfHostedService, InfraEvent } from "@/types/live-data";

// Type definitions for API responses
interface Monitor {
  id: string;
  name: string;
  status: string;
  url?: string;
  responseTime?: number;
  lastCheck?: string;
}

interface MonitorStat {
  monitorId: string;
  uptime24h?: number;
  uptime30d?: number;
  avgResponseTime?: number;
}

interface Incident {
  monitorId: string;
  monitorName: string;
  startTime: string;
  duration?: number;
  isOngoing: boolean;
}

// Note: For self-hosted services, use the shared SelfHostedService type

/**
 * GET /api/about/live/infra
 * Returns infrastructure monitoring data from Uptime Kuma
 */
export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    // Fetch real monitoring data from our new APIs
    const [monitorsRes, statsRes, incidentsRes] = await Promise.all([
      fetch(`${baseUrl}/api/infra/monitors`, { cache: "no-store" }),
      fetch(`${baseUrl}/api/infra/stats`, { cache: "no-store" }),
      fetch(`${baseUrl}/api/infra/incidents?limit=10`, { cache: "no-store" }),
    ]);

    const [monitorsData, statsData, incidentsData] = await Promise.all([
      monitorsRes.json(),
      statsRes.json(),
      incidentsRes.json(),
    ]);

    // Transform monitor data to match existing InfraData format
    const services: SelfHostedService[] =
      (monitorsData.monitors as Monitor[] | undefined)?.map((monitor) => {
        const metadata: Record<string, string | number> = {};
        if (typeof monitor.responseTime === "number") {
          metadata.responseTime = monitor.responseTime;
        }
        if (typeof monitor.lastCheck === "string") {
          metadata.lastCheck = monitor.lastCheck;
        }
        return {
          id: monitor.id,
          name: monitor.name.toLowerCase().replace(/\s+/g, "-"),
          displayName: monitor.name,
          status:
            monitor.status === "UP"
              ? "running"
              : monitor.status === "DOWN"
                ? "stopped"
                : "maintenance",
          url: monitor.url,
          server: "monitoring", // Generic server label
          uptime: 0, // Will be populated from stats if available
          metadata,
        } satisfies SelfHostedService;
      }) ?? [];

    // Add uptime data from stats
    if (statsData.monitors) {
      (statsData.monitors as MonitorStat[]).forEach((stat) => {
        const service = services.find((s) => s.id === stat.monitorId);
        if (service) {
          service.uptime = stat.uptime30d || 0;
          const meta: Record<string, string | number> = {
            ...(service.metadata ?? {}),
          } as Record<string, string | number>;
          if (typeof stat.uptime24h === "number") meta.uptime24h = stat.uptime24h;
          if (typeof stat.uptime30d === "number") meta.uptime30d = stat.uptime30d;
          if (typeof stat.avgResponseTime === "number") meta.avgResponseTime = stat.avgResponseTime;
          service.metadata = meta;
        }
      });
    }

    // Transform incidents to events
    const events: InfraEvent[] =
      (incidentsData.incidents as Incident[] | undefined)?.slice(0, 10).map((incident) => ({
        timestamp: new Date(incident.startTime),
        type: incident.isOngoing ? "error" : "warning",
        message: incident.isOngoing
          ? `${incident.monitorName} is currently down`
          : `${incident.monitorName} was down for ${incident.duration || 0} minutes`,
        serviceId: incident.monitorId,
      })) ?? [];

    // Create simplified server overview (since Uptime Kuma doesn't provide server metrics)
    // We group monitors by type or create a generic overview
    const servers: Server[] = [
      {
        id: "monitoring-01",
        name: "Monitoring System",
        location: "US",
        status: statsData.overall?.downMonitors > 0 ? "warning" : "healthy",
        specs: {
          cpu: { cores: 0, usage: 0 },
          memory: { total: 0, used: 0 },
          disk: { total: 0, used: 0 },
        },
        services: services.map((s) => s.name),
        uptime: statsData.overall?.uptime30d || 0,
      },
    ];

    const data: InfraData = {
      servers,
      services,
      events,
      networkTraffic: [], // Uptime Kuma doesn't provide network traffic data
    };

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("[API /about/infra] Error fetching monitoring data:", error);

    // Fallback to minimal data on error
    const data: InfraData = {
      servers: [],
      services: [],
      events: [
        {
          timestamp: new Date(),
          type: "error",
          message: "Failed to fetch monitoring data from Uptime Kuma",
        },
      ],
      networkTraffic: [],
    };

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  }
}

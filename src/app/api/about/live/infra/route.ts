import { NextResponse } from "next/server";
import type { InfraData } from "@/types/live-data";

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

interface Service {
  id: string;
  name: string;
  displayName: string;
  status: string;
  url?: string;
  server: string;
  uptime: number;
  metadata?: Record<string, unknown>;
}

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
    const services: Service[] =
      (monitorsData.monitors as Monitor[] | undefined)?.map((monitor) => ({
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
        metadata: {
          responseTime: monitor.responseTime,
          lastCheck: monitor.lastCheck,
        },
      })) || [];

    // Add uptime data from stats
    if (statsData.monitors) {
      (statsData.monitors as MonitorStat[]).forEach((stat) => {
        const service = services.find((s) => s.id === stat.monitorId);
        if (service) {
          service.uptime = stat.uptime30d || 0;
          service.metadata = {
            ...service.metadata,
            uptime24h: stat.uptime24h,
            uptime30d: stat.uptime30d,
            avgResponseTime: stat.avgResponseTime,
          };
        }
      });
    }

    // Transform incidents to events
    const events =
      (incidentsData.incidents as Incident[] | undefined)?.slice(0, 10).map((incident) => ({
        timestamp: new Date(incident.startTime),
        type: incident.isOngoing ? "error" : "warning",
        message: incident.isOngoing
          ? `${incident.monitorName} is currently down`
          : `${incident.monitorName} was down for ${incident.duration || 0} minutes`,
        serviceId: incident.monitorId,
      })) || [];

    // Create simplified server overview (since Uptime Kuma doesn't provide server metrics)
    // We group monitors by type or create a generic overview
    const servers = [
      {
        id: "monitoring-01",
        name: "Monitoring System",
        location: "Cloud",
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
      networkTraffic: generateMockTrafficData(), // Keep mock data for network traffic as Uptime Kuma doesn't provide this
    };

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("[API /about/live/infra] Error fetching monitoring data:", error);

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

function generateMockTrafficData() {
  const traffic = [];
  const now = Date.now();
  for (let i = 23; i >= 0; i--) {
    traffic.push({
      timestamp: new Date(now - i * 60 * 60 * 1000),
      inbound: Math.random() * 2 + 0.5,
      outbound: Math.random() * 1.5 + 0.3,
    });
  }
  return traffic;
}

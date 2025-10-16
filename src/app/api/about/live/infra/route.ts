import { NextResponse } from "next/server";
import type { InfraData } from "@/types/live-data";

/**
 * GET /api/about/live/infra
 * Returns infrastructure monitoring data
 */
export async function GET() {
  // TODO: Replace with real monitoring API (Prometheus, custom endpoints, etc.)
  const data: InfraData = {
    servers: [
      {
        id: "cn-01",
        name: "CN-Server-01",
        location: "CN",
        status: "healthy",
        specs: {
          cpu: { cores: 2, usage: 15 },
          memory: { total: 4, used: 2.1 },
          disk: { total: 50, used: 20 },
        },
        services: ["jellyfin", "umami"],
        uptime: 45,
      },
      {
        id: "us-01",
        name: "US-Server-01",
        location: "US",
        status: "healthy",
        specs: {
          cpu: { cores: 4, usage: 34 },
          memory: { total: 8, used: 4.9 },
          disk: { total: 100, used: 45 },
        },
        services: ["miniflux", "vaultwarden"],
        uptime: 67,
      },
      {
        id: "jp-01",
        name: "JP-Server-01",
        location: "JP",
        status: "warning",
        specs: {
          cpu: { cores: 1, usage: 89 },
          memory: { total: 2, used: 1.9 },
          disk: { total: 25, used: 22 },
        },
        services: ["pocketbase"],
        uptime: 120,
      },
    ],
    services: [
      {
        id: "jellyfin",
        name: "jellyfin",
        displayName: "Jellyfin",
        status: "running",
        url: "https://jellyfin.example.com",
        server: "cn-01",
        uptime: 45,
        metadata: {
          users: 3,
          libraries: 5,
        },
      },
      {
        id: "miniflux",
        name: "miniflux",
        displayName: "Miniflux",
        status: "running",
        url: "https://rss.example.com",
        server: "us-01",
        uptime: 67,
        metadata: {
          feeds: 47,
          unread: 234,
        },
      },
      {
        id: "vaultwarden",
        name: "vaultwarden",
        displayName: "Vaultwarden",
        status: "running",
        url: "https://vault.example.com",
        server: "us-01",
        uptime: 120,
        metadata: {
          accounts: 2,
        },
      },
      {
        id: "umami",
        name: "umami",
        displayName: "Umami Analytics",
        status: "running",
        url: "https://analytics.example.com",
        server: "cn-01",
        uptime: 23,
        metadata: {
          sites: 3,
        },
      },
      {
        id: "pocketbase",
        name: "pocketbase",
        displayName: "PocketBase",
        status: "maintenance",
        url: "https://db.example.com",
        server: "jp-01",
        uptime: 0,
      },
    ],
    events: [
      {
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        type: "warning",
        message: "PocketBase entered maintenance mode",
        serviceId: "pocketbase",
      },
      {
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
        type: "error",
        message: "CN-01 CPU spike to 95% (resolved)",
        serverId: "cn-01",
      },
      {
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        type: "info",
        message: "Miniflux updated to v2.0.50",
        serviceId: "miniflux",
      },
      {
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        type: "info",
        message: "SSL certificate renewed for *.example.com",
      },
    ],
    networkTraffic: generateMockTrafficData(),
  };

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
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

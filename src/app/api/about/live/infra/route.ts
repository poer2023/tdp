/**
 * GET /api/about/live/infra
 * Returns infrastructure monitoring data
 *
 * OPTIMIZED: Uses cached data layer instead of internal fetch + no-store
 */

import { NextResponse } from "next/server";
import { getInfraData } from "@/lib/infra";
import type { InfraData } from "@/types/live-data";

// ISR: Revalidate every 60 seconds (matches upstream cache TTL)
export const revalidate = 60;

export async function GET() {
  try {
    // Use the cached data layer instead of making internal HTTP requests
    const { servers, services, events } = await getInfraData();

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
    console.error("[API /about/live/infra] Error fetching monitoring data:", error);

    // Fallback to minimal data on error
    const data: InfraData = {
      servers: [],
      services: [],
      events: [
        {
          timestamp: new Date(),
          type: "error",
          message: "Failed to fetch monitoring data",
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

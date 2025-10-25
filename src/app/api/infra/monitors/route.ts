/**
 * API for fetching monitor status and information
 *
 * GET /api/infra/monitors
 * Returns all active monitors with their latest status
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const revalidate = 0; // Don't cache

export async function GET(_request: NextRequest) {
  try {
    // Fetch all active monitors with their latest heartbeat
    const monitors = await prisma.monitor.findMany({
      where: {
        isActive: true,
      },
      include: {
        heartbeats: {
          orderBy: {
            timestamp: "desc",
          },
          take: 1, // Get only the latest heartbeat
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Transform data for frontend
    const monitorData = monitors.map((monitor) => {
      const latestHeartbeat = monitor.heartbeats[0];

      return {
        id: monitor.id,
        name: monitor.name,
        type: monitor.type,
        url: monitor.url,
        description: monitor.description,
        status: latestHeartbeat?.status || "PENDING",
        responseTime: latestHeartbeat?.responseTime || null,
        lastCheck: latestHeartbeat?.timestamp || null,
        message: latestHeartbeat?.message || null,
      };
    });

    return NextResponse.json({
      success: true,
      monitors: monitorData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[API /infra/monitors] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch monitors",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

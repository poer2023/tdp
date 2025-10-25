/**
 * API for fetching recent incidents (DOWN events)
 *
 * GET /api/infra/incidents?limit=10
 * Returns recent monitor failures and downtime events
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const revalidate = 0; // Don't cache

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    // Fetch recent DOWN status heartbeats
    const incidents = await prisma.monitorHeartbeat.findMany({
      where: {
        status: "DOWN",
      },
      include: {
        monitor: {
          select: {
            id: true,
            name: true,
            type: true,
            url: true,
          },
        },
      },
      orderBy: {
        timestamp: "desc",
      },
      take: Math.min(limit, 100), // Max 100 incidents
    });

    // Group consecutive DOWN events into incidents
    const incidentGroups: Array<{
      monitorId: string;
      monitorName: string;
      startTime: Date;
      endTime: Date | null;
      duration: number | null; // in minutes
      message: string | null;
      count: number; // number of DOWN heartbeats
    }> = [];

    let currentIncident: (typeof incidentGroups)[0] | null = null;

    for (const heartbeat of incidents) {
      if (
        !currentIncident ||
        currentIncident.monitorId !== heartbeat.monitor.id ||
        (currentIncident.startTime.getTime() - heartbeat.timestamp.getTime()) / (1000 * 60) > 30
      ) {
        // New incident (different monitor or gap > 30 minutes)
        if (currentIncident) {
          incidentGroups.push(currentIncident);
        }

        currentIncident = {
          monitorId: heartbeat.monitor.id,
          monitorName: heartbeat.monitor.name,
          startTime: heartbeat.timestamp,
          endTime: heartbeat.timestamp,
          duration: null,
          message: heartbeat.message,
          count: 1,
        };
      } else {
        // Same incident, update end time
        currentIncident.endTime = heartbeat.timestamp;
        currentIncident.count += 1;

        if (currentIncident.startTime && currentIncident.endTime) {
          currentIncident.duration = Math.round(
            (currentIncident.startTime.getTime() - currentIncident.endTime.getTime()) / (1000 * 60)
          );
        }
      }
    }

    // Add the last incident
    if (currentIncident) {
      incidentGroups.push(currentIncident);
    }

    // Check if incidents are still ongoing (no UP status after DOWN)
    const ongoingIncidents = await Promise.all(
      incidentGroups.slice(0, 10).map(async (incident) => {
        const nextHeartbeat = await prisma.monitorHeartbeat.findFirst({
          where: {
            monitorId: incident.monitorId,
            timestamp: { gt: incident.startTime },
          },
          orderBy: { timestamp: "asc" },
          select: { status: true, timestamp: true },
        });

        const isOngoing = !nextHeartbeat || nextHeartbeat.status === "DOWN";

        if (!isOngoing && nextHeartbeat) {
          // Calculate actual duration
          incident.duration = Math.round(
            (nextHeartbeat.timestamp.getTime() - incident.startTime.getTime()) / (1000 * 60)
          );
          incident.endTime = nextHeartbeat.timestamp;
        }

        return {
          ...incident,
          isOngoing,
          resolved: !isOngoing,
        };
      })
    );

    return NextResponse.json({
      success: true,
      incidents: ongoingIncidents,
      totalCount: incidentGroups.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[API /infra/incidents] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch incidents",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

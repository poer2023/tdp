/**
 * Cron Job API for Uptime Kuma Monitor Sync
 *
 * This endpoint is triggered by Vercel Cron Jobs to automatically sync
 * monitoring data from Uptime Kuma to the local database.
 *
 * Vercel Cron Configuration (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/sync-monitors",
 *     "schedule": "* /5 * * * *"
 *   }]
 * }
 * Note: Schedule runs every 5 minutes
 *
 * Security:
 * - Vercel Cron uses CRON_SECRET for authentication
 * - Set CRON_SECRET in environment variables
 * - Endpoint validates authorization header
 *
 * Sync Process:
 * 1. Fetch all monitors from Uptime Kuma
 * 2. Upsert monitors to local database
 * 3. Fetch recent heartbeats for each monitor
 * 4. Store heartbeats in database
 * 5. Clean up old heartbeat data (>3 months)
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  fetchMonitors,
  fetchMonitorHeartbeats,
  mapUptimeKumaStatus,
  mapMonitorType,
  validateConnection,
} from "@/lib/uptime-kuma";

/**
 * GET /api/cron/sync-monitors
 * Automatic monitor sync endpoint triggered by Vercel Cron
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Security: Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.warn("[Monitor Sync] Unauthorized access attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[Monitor Sync] Starting monitor sync job...");

    // Validate Uptime Kuma connection
    const isConnected = await validateConnection();
    if (!isConnected) {
      console.error("[Monitor Sync] Failed to connect to Uptime Kuma");
      return NextResponse.json({ error: "Failed to connect to Uptime Kuma" }, { status: 503 });
    }

    // Step 1: Fetch monitors from Uptime Kuma
    const uptimeKumaMonitors = await fetchMonitors();
    console.log(`[Monitor Sync] Fetched ${uptimeKumaMonitors.length} monitors from Uptime Kuma`);

    // Step 2: Upsert monitors to database
    const monitorResults = await Promise.allSettled(
      uptimeKumaMonitors.map(async (kumaMonitor) => {
        return prisma.monitor.upsert({
          where: { uptimeKumaId: kumaMonitor.id },
          create: {
            name: kumaMonitor.name,
            type: mapMonitorType(kumaMonitor.type),
            url: kumaMonitor.url || "",
            uptimeKumaId: kumaMonitor.id,
            interval: kumaMonitor.interval || 60,
            description: kumaMonitor.description,
            isActive: kumaMonitor.active,
          },
          update: {
            name: kumaMonitor.name,
            type: mapMonitorType(kumaMonitor.type),
            url: kumaMonitor.url || "",
            interval: kumaMonitor.interval || 60,
            description: kumaMonitor.description,
            isActive: kumaMonitor.active,
            updatedAt: new Date(),
          },
        });
      })
    );

    const successfulMonitors = monitorResults.filter((r) => r.status === "fulfilled").length;
    const failedMonitors = monitorResults.filter((r) => r.status === "rejected").length;

    console.log(`[Monitor Sync] Synced ${successfulMonitors} monitors (${failedMonitors} failed)`);

    // Step 3: Fetch and store heartbeats for each monitor
    let totalHeartbeats = 0;
    let heartbeatErrors = 0;

    for (const kumaMonitor of uptimeKumaMonitors) {
      try {
        // Fetch recent heartbeats (last 100)
        const heartbeats = await fetchMonitorHeartbeats(kumaMonitor.id, 100);

        // Get local monitor from database
        const localMonitor = await prisma.monitor.findUnique({
          where: { uptimeKumaId: kumaMonitor.id },
        });

        if (!localMonitor) {
          console.warn(`[Monitor Sync] Monitor ${kumaMonitor.id} not found in database`);
          continue;
        }

        // Store heartbeats
        for (const heartbeat of heartbeats) {
          try {
            await prisma.monitorHeartbeat.create({
              data: {
                monitorId: localMonitor.id,
                status: mapUptimeKumaStatus(heartbeat.status),
                responseTime: heartbeat.ping,
                statusCode: null, // Uptime Kuma doesn't always provide HTTP status code
                message: heartbeat.msg || null,
                timestamp: new Date(heartbeat.time),
              },
            });
            totalHeartbeats++;
          } catch (error) {
            // Ignore duplicate heartbeats (based on timestamp)
            if (error instanceof Error && error.message.includes("duplicate")) {
              continue;
            }
            heartbeatErrors++;
          }
        }
      } catch (error) {
        console.error(
          `[Monitor Sync] Error syncing heartbeats for monitor ${kumaMonitor.id}:`,
          error
        );
        heartbeatErrors++;
      }
    }

    console.log(`[Monitor Sync] Stored ${totalHeartbeats} heartbeats (${heartbeatErrors} errors)`);

    // Step 4: Clean up old heartbeat data (older than 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const deletedHeartbeats = await prisma.monitorHeartbeat.deleteMany({
      where: {
        timestamp: {
          lt: threeMonthsAgo,
        },
      },
    });

    console.log(`[Monitor Sync] Cleaned up ${deletedHeartbeats.count} old heartbeats`);

    const duration = Date.now() - startTime;

    console.log(`[Monitor Sync] Completed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      duration,
      summary: {
        totalMonitors: uptimeKumaMonitors.length,
        monitorsSynced: successfulMonitors,
        monitorsFailed: failedMonitors,
        heartbeatsStored: totalHeartbeats,
        heartbeatsErrors: heartbeatErrors,
        oldHeartbeatsDeleted: deletedHeartbeats.count,
      },
    });
  } catch (error) {
    console.error("[Monitor Sync] Fatal error:", error);
    return NextResponse.json(
      {
        error: "Monitor sync job failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

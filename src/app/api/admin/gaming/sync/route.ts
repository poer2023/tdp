/**
 * Admin API: Manual Gaming Data Sync
 * POST /api/admin/gaming/sync
 *
 * Triggers manual sync for Steam and HoYoverse gaming data
 */

import { NextRequest, NextResponse } from "next/server";
import { getGamingSyncService } from "@/lib/gaming/sync-service";

export async function POST(request: NextRequest) {
  try {
    // Simple API key authentication
    const authHeader = request.headers.get("authorization");
    const expectedKey = process.env.ADMIN_API_KEY;

    if (!expectedKey) {
      return NextResponse.json({ error: "Admin API key not configured" }, { status: 500 });
    }

    if (!authHeader || authHeader !== `Bearer ${expectedKey}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Trigger sync
    const syncService = getGamingSyncService();
    const results = await syncService.syncAllPlatforms();

    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: failedCount === 0,
      results,
      summary: {
        total: results.length,
        succeeded: successCount,
        failed: failedCount,
      },
    });
  } catch (error) {
    console.error("Gaming sync error:", error);

    return NextResponse.json(
      {
        error: "Sync failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

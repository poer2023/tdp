import { NextResponse } from "next/server";
import { getSyncStatus } from "@/lib/sync-status";

/**
 * GET /api/about/sync-status
 * Returns sync status for all platforms (public API for About page)
 */
export async function GET() {
  try {
    const platforms = await getSyncStatus();

    return NextResponse.json(
      { platforms },
      {
        headers: {
          // Keep in sync with lib/sync-status revalidation window for consistency
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    console.error("[Sync Status API] Error:", error);
    return NextResponse.json({ platforms: [] }, { status: 500 });
  }
}

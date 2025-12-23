/**
 * Dashboard Stats Data API
 *
 * GET /api/about/live/dashboard
 * Returns aggregated dashboard stats using the cached getDashboardStats function
 *
 * This route now delegates to the shared dashboard-stats.ts library,
 * which provides a 300s cached version of the stats.
 */

import { NextResponse } from "next/server";
import { getDashboardStats, type DashboardStatsData } from "@/lib/dashboard-stats";

// Export the type for consumers
export type { DashboardStatsData };

/**
 * GET /api/about/live/dashboard
 * Returns aggregated dashboard stats from the cached library
 */
export async function GET() {
  try {
    // Use the cached getDashboardStats function from dashboard-stats.ts
    // This avoids duplicating the DB queries that were previously in this file
    const data = await getDashboardStats();

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("[Dashboard API] Error fetching data:", error);

    // Return fallback data on error
    return NextResponse.json(
      {
        photoCount: 0,
        photosByWeek: [],
        routineData: [],
        stepsData: { entries: [], startDate: "", endDate: "" },
        movieCount: 0,
        movieData: [],
        skillData: [],
        currentGame: undefined,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
        status: 500,
      }
    );
  }
}

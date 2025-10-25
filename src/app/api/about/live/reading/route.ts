import { NextResponse } from "next/server";

/**
 * GET /api/about/live/reading
 * Returns reading activity data from Douban/database
 * Returns null if no data available (no mock fallback)
 *
 * TODO: Implement Douban data integration when credentials are available
 */
export async function GET() {
  try {
    // TODO: Fetch real reading data from MediaWatch table or Douban sync
    // For now, return null until real data source is implemented

    console.log("[Reading API] No reading data source implemented yet");
    return NextResponse.json(null, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
      status: 404,
    });
  } catch (error) {
    console.error("[Reading API] Error:", error);
    return NextResponse.json(null, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
      status: 500,
    });
  }
}

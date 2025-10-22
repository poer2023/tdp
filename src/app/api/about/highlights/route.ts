import { NextResponse } from "next/server";
import { getLiveHighlightsData } from "@/lib/about-live";

/**
 * GET /api/about/highlights
 * Returns lightweight summary data for the main about page
 */
export async function GET() {
  const data = await getLiveHighlightsData();

  return NextResponse.json(data, {
    headers: {
      // Shorter s-maxage to improve freshness; server function also caches by tag
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=600",
    },
  });
}

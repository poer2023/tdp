import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

/**
 * Force revalidate GitHub dev data cache
 * Usage: GET /api/about/live/dev/revalidate
 */
export async function GET() {
  try {
    // Revalidate the github-dev-data cache
    revalidateTag("github-dev-data");

    return NextResponse.json({
      success: true,
      message: "GitHub dev data cache cleared successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

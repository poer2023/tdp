import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { syncBilibili, syncDouban, syncAllPlatforms } from "@/lib/media-sync";

/**
 * POST /api/admin/sync/trigger
 * Manually triggers a sync job for specified platform(s)
 * Requires admin authentication
 *
 * Body: { platform: "bilibili" | "douban" | "all" }
 */
export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { platform } = body;

    if (!platform || !["bilibili", "douban", "all"].includes(platform)) {
      return NextResponse.json(
        { error: "Invalid platform. Must be 'bilibili', 'douban', or 'all'" },
        { status: 400 }
      );
    }

    // Trigger sync based on platform
    let results;

    if (platform === "bilibili") {
      if (
        !process.env.BILIBILI_SESSDATA ||
        !process.env.BILIBILI_BILI_JCT ||
        !process.env.BILIBILI_BUVID3
      ) {
        return NextResponse.json({ error: "Bilibili credentials not configured" }, { status: 400 });
      }

      const result = await syncBilibili({
        sessdata: process.env.BILIBILI_SESSDATA,
        biliJct: process.env.BILIBILI_BILI_JCT,
        buvid3: process.env.BILIBILI_BUVID3,
      });
      results = [result];
    } else if (platform === "douban") {
      if (!process.env.DOUBAN_USER_ID) {
        return NextResponse.json({ error: "Douban user ID not configured" }, { status: 400 });
      }

      const result = await syncDouban({
        userId: process.env.DOUBAN_USER_ID,
        cookie: process.env.DOUBAN_COOKIE,
      });
      results = [result];
    } else {
      // Sync all platforms
      results = await syncAllPlatforms();
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("[Sync Trigger API] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import type { SocialData } from "@/types/live-data";

/**
 * GET /api/about/live/social
 * Returns social activity data (privacy-first, anonymized)
 */
export async function GET() {
  // TODO: Replace with real social platform data (fully anonymized)
  const data: SocialData = {
    stats: {
      thisWeek: { conversations: 45, calls: 3 },
      thisMonth: { conversations: 180, calls: 12 },
      activePeople: 23,
      activeGroups: 8,
    },
    recentInteractions: [
      {
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        type: "chat",
        platform: "WeChat",
        anonymizedId: "user_a1b2c3",
        duration: undefined,
      },
      {
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
        type: "call",
        platform: "Telegram",
        anonymizedId: "user_d4e5f6",
        duration: 45,
      },
      {
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
        type: "group",
        platform: "Discord",
        anonymizedId: "user_g7h8i9",
        duration: undefined,
      },
      {
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
        type: "chat",
        platform: "WeChat",
        anonymizedId: "user_j0k1l2",
        duration: undefined,
      },
      {
        timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000),
        type: "call",
        platform: "WeChat",
        anonymizedId: "user_m3n4o5",
        duration: 23,
      },
    ],
    platformStats: {
      WeChat: 120,
      Telegram: 45,
      Discord: 30,
      Email: 15,
    },
  };

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
    },
  });
}

import { NextResponse } from "next/server";
import type { GamingData } from "@/types/live-data";

/**
 * GET /api/about/live/gaming
 * Returns gaming activity data (Steam, PSN, etc.)
 */
export async function GET() {
  // TODO: Replace with real Steam/PSN API integration
  const data: GamingData = {
    stats: {
      platforms: [
        { id: "steam", name: "Steam", activeGames: 3 },
        { id: "psn", name: "PlayStation", activeGames: 1 },
      ],
      thisMonth: { totalHours: 45, gamesPlayed: 2 },
      thisYear: { totalHours: 567, gamesPlayed: 23 },
    },
    currentlyPlaying: [
      {
        gameId: "elden-ring",
        gameName: "Elden Ring",
        platform: "steam",
        playtime: 87,
        lastPlayed: new Date(Date.now() - 2 * 60 * 60 * 1000),
        achievements: ["Defeated Malenia, Blade of Miquella"],
        progress: 65,
        cover: "/images/about/mock-game-1.jpg",
      },
      {
        gameId: "bg3",
        gameName: "Baldur's Gate 3",
        platform: "steam",
        playtime: 134,
        lastPlayed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        progress: 40,
        cover: "/images/about/mock-game-2.jpg",
      },
    ],
    recentSessions: [
      {
        date: new Date("2024-10-16"),
        gameName: "Elden Ring",
        duration: 3.4,
      },
      {
        date: new Date("2024-10-15"),
        gameName: "Elden Ring",
        duration: 2.25,
      },
      {
        date: new Date("2024-10-13"),
        gameName: "Baldur's Gate 3",
        duration: 4.87,
      },
      {
        date: new Date("2024-10-12"),
        gameName: "Elden Ring",
        duration: 1.78,
      },
    ],
    playtimeHeatmap: generateMockHeatmapData(),
  };

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
    },
  });
}

function generateMockHeatmapData() {
  const heatmap: Record<string, number> = {};
  const now = new Date();
  for (let i = 0; i < 365; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    if (dateStr) {
      heatmap[dateStr] = Math.random() < 0.7 ? Math.floor(Math.random() * 5) : 0;
    }
  }
  return heatmap;
}

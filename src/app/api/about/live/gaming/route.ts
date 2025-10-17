import { NextResponse } from "next/server";
import type { GamingData } from "@/types/live-data";
import prisma from "@/lib/prisma";
import { GamePlatform } from "@prisma/client";

/**
 * GET /api/about/live/gaming
 * Returns gaming activity data from Steam and HoYoverse
 */
export async function GET() {
  try {
    const data = await getGamingData();

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    console.error("Failed to fetch gaming data:", error);

    // Fallback to mock data on error
    return NextResponse.json(getMockData(), {
      headers: {
        "Cache-Control": "public, s-maxage=300",
      },
    });
  }
}

async function getGamingData(): Promise<GamingData> {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  // Get game sessions for calculations
  const [monthSessions, yearSessions, recentSessions, allGames] = await Promise.all([
    // This month's sessions
    prisma.gameSession.findMany({
      where: { startTime: { gte: lastMonth } },
      include: { game: true },
    }),

    // This year's sessions
    prisma.gameSession.findMany({
      where: { startTime: { gte: startOfYear } },
      include: { game: true },
    }),

    // Recent 10 sessions
    prisma.gameSession.findMany({
      take: 10,
      orderBy: { startTime: "desc" },
      include: { game: true },
    }),

    // All games with recent activity
    prisma.game.findMany({
      where: {
        sessions: {
          some: {
            startTime: { gte: lastMonth },
          },
        },
      },
      include: {
        sessions: {
          orderBy: { startTime: "desc" },
          take: 1,
        },
        achievements: {
          where: { isUnlocked: true },
          take: 5,
        },
      },
    }),
  ]);

  // Calculate stats
  const stats = {
    platforms: calculatePlatformStats(allGames),
    thisMonth: {
      totalHours: Math.round(monthSessions.reduce((sum, s) => sum + s.duration, 0) / 60),
      gamesPlayed: new Set(monthSessions.map((s) => s.gameId)).size,
    },
    thisYear: {
      totalHours: Math.round(yearSessions.reduce((sum, s) => sum + s.duration, 0) / 60),
      gamesPlayed: new Set(yearSessions.map((s) => s.gameId)).size,
    },
  };

  // Currently playing games
  const currentlyPlaying = allGames
    .map((game) => {
      const latestSession = game.sessions[0];
      if (!latestSession) return null;

      const totalPlaytime = Math.round(
        yearSessions.filter((s) => s.gameId === game.id).reduce((sum, s) => sum + s.duration, 0) /
          60
      );

      const platformId = mapPlatformToId(game.platform);

      return {
        gameId: game.platformId,
        gameName: game.nameZh || game.name,
        platform: platformId,
        playtime: totalPlaytime,
        lastPlayed: latestSession.startTime,
        achievements: game.achievements.length,
        totalAchievements: game.achievements.length > 0 ? game.achievements.length * 2 : undefined,
        progress: undefined, // Not available from API
        cover: game.cover || "/images/about/default-game-cover.jpg",
      };
    })
    .filter((g): g is NonNullable<typeof g> => g !== null)
    .slice(0, 4);

  // Recent sessions
  const recentSessionsData = recentSessions.slice(0, 5).map((session) => ({
    date: session.startTime,
    gameName: session.game.nameZh || session.game.name,
    duration: session.duration,
  }));

  // Generate heatmap data
  const heatmap = await generateHeatmapData(365);

  return {
    stats,
    currentlyPlaying,
    recentSessions: recentSessionsData,
    playtimeHeatmap: heatmap,
  };
}

function calculatePlatformStats(games: Array<{ platform: GamePlatform }>) {
  const platforms = new Map<GamePlatform, { activeGames: number }>();

  for (const game of games) {
    const current = platforms.get(game.platform) || { activeGames: 0 };
    current.activeGames++;
    platforms.set(game.platform, current);
  }

  return Array.from(platforms.entries()).map(([platform, stats]) => ({
    id: mapPlatformToId(platform),
    name: platform === GamePlatform.HOYOVERSE ? "绝区零" : platform,
    activeGames: stats.activeGames,
  }));
}

function mapPlatformToId(platform: GamePlatform): "steam" | "psn" | "switch" {
  switch (platform) {
    case GamePlatform.STEAM:
      return "steam";
    case GamePlatform.PSN:
      return "psn";
    case GamePlatform.SWITCH:
      return "switch";
    case GamePlatform.HOYOVERSE:
      return "steam"; // Map to steam for compatibility
    default:
      return "steam";
  }
}

async function generateHeatmapData(days: number) {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);

  // Get all sessions in the range
  const sessions = await prisma.gameSession.findMany({
    where: {
      startTime: { gte: startDate, lte: now },
    },
  });

  // Group by date
  const dateMap = new Map<string, number>();

  for (const session of sessions) {
    const dateKey = session.startTime.toISOString().split("T")[0];
    const hours = session.duration / 60;
    dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + hours);
  }

  // Generate heatmap array
  const heatmap: Array<{ date: Date; value: number }> = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split("T")[0];
    const value = Math.round((dateMap.get(dateKey) || 0) * 10) / 10;

    heatmap.push({ date, value });
  }

  return heatmap.reverse();
}

function getMockData(): GamingData {
  const now = new Date();
  return {
    stats: {
      platforms: [{ id: "steam", name: "Steam", activeGames: 0 }],
      thisMonth: { totalHours: 0, gamesPlayed: 0 },
      thisYear: { totalHours: 0, gamesPlayed: 0 },
    },
    currentlyPlaying: [],
    recentSessions: [],
    playtimeHeatmap: Array.from({ length: 365 }, (_, i) => ({
      date: new Date(now.getTime() - i * 24 * 60 * 60 * 1000),
      value: 0,
    })),
  };
}

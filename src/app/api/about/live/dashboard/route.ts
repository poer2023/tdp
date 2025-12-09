import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * Dashboard Stats Data structure for ZhiStatsDashboard
 */
export interface DashboardStatsData {
  photoCount: number;
  photosByWeek: { day: string; count: number }[];
  routineData: { name: string; value: number; color: string }[];
  stepsData: { day: string; steps: number }[];
  movieCount: number;
  movieData: { month: string; movies: number }[];
  skillData: { name: string; level: number }[];
  currentGame?: { name: string; progress: number };
}

/**
 * GET /api/about/live/dashboard
 * Returns aggregated dashboard stats from various data sources
 */
export async function GET() {
  try {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Fetch all data in parallel
    const [
      photoCount,
      recentPhotos,
      mediaThisYear,
      currentlyPlayingGame,
      languages,
    ] = await Promise.all([
      // Total photo count from gallery
      prisma.galleryImage.count(),

      // Recent photos (last 7 days) grouped by day
      prisma.galleryImage.findMany({
        where: {
          createdAt: {
            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        select: { createdAt: true },
        orderBy: { createdAt: "desc" },
      }),

      // Movies/series watched this year grouped by month
      prisma.mediaWatch.findMany({
        where: {
          type: "movie",
          watchedAt: { gte: startOfYear },
        },
        select: { watchedAt: true },
        orderBy: { watchedAt: "desc" },
      }),

      // Currently playing game (most recent session)
      getLatestGame(),

      // Programming languages from GitHub data
      getLanguagesFromDB(),
    ]);

    // Process photos by day of week
    const photosByWeek = processPhotosByWeek(recentPhotos);

    // Process movies by month
    const { movieCount, movieData } = processMoviesByMonth(mediaThisYear);

    // Build skill data from languages
    const skillData = buildSkillData(languages);

    // Build routine data (placeholder - could be from Apple Health sync in future)
    const routineData = [
      { name: "Work", value: 8, color: "#5c9c6d" },
      { name: "Sleep", value: 7, color: "#6366f1" },
      { name: "Creative", value: 4, color: "#f59e0b" },
      { name: "Exercise", value: 1, color: "#ef4444" },
      { name: "Other", value: 4, color: "#a8a29e" },
    ];

    // Build steps data (placeholder - could be from Apple Health sync in future)
    const stepsData = [
      { day: "M", steps: 8500 },
      { day: "T", steps: 6200 },
      { day: "W", steps: 9100 },
      { day: "T", steps: 7800 },
      { day: "F", steps: 11200 },
      { day: "S", steps: 15600 },
      { day: "S", steps: 12300 },
    ];

    const data: DashboardStatsData = {
      photoCount,
      photosByWeek,
      routineData,
      stepsData,
      movieCount,
      movieData,
      skillData,
      currentGame: currentlyPlayingGame,
    };

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
        stepsData: [],
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

/**
 * Get the latest game being played
 */
async function getLatestGame(): Promise<{ name: string; progress: number } | undefined> {
  try {
    const latestSession = await prisma.gameSession.findFirst({
      orderBy: { startTime: "desc" },
      include: { game: true },
    });

    if (!latestSession?.game) return undefined;

    // Calculate rough progress (could be based on achievements if available)
    const game = latestSession.game;
    let progress = 50; // Default progress

    // Check for achievements to estimate progress
    const achievements = await prisma.gameAchievement.findMany({
      where: { gameId: game.id },
    });

    if (achievements.length > 0) {
      const unlocked = achievements.filter((a) => a.isUnlocked).length;
      progress = Math.round((unlocked / achievements.length) * 100);
    }

    return {
      name: game.nameZh || game.name,
      progress,
    };
  } catch {
    return undefined;
  }
}

/**
 * Get programming languages from GitHub data
 */
async function getLanguagesFromDB(): Promise<
  Array<{ name: string; percentage: number; hours: number }>
> {
  try {
    // Access optional delegates dynamically
    const p = prisma as any;

    if (!p.gitHubLanguage?.findMany) return [];

    const langRecords = await p.gitHubLanguage.findMany({
      orderBy: { syncedAt: "desc" },
      take: 50,
    });

    const seen = new Set<string>();
    const languages: Array<{ name: string; percentage: number; hours: number }> = [];

    for (const l of langRecords) {
      const name = (l as { name: string }).name;
      if (name && !seen.has(name)) {
        seen.add(name);
        languages.push({
          name,
          percentage: (l as { percentage: number }).percentage,
          hours: (l as { hours: number }).hours,
        });
      }
      if (languages.length >= 4) break;
    }

    return languages;
  } catch {
    return [];
  }
}

/**
 * Process photos into weekly distribution
 */
function processPhotosByWeek(
  photos: Array<{ createdAt: Date }>
): Array<{ day: string; count: number }> {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const counts: Record<string, number> = {};

  // Initialize all days
  days.forEach((day) => {
    counts[day] = 0;
  });

  // Count photos per day of week
  photos.forEach((photo) => {
    const dayIndex = new Date(photo.createdAt).getDay();
    const dayName = days[dayIndex];
    if (dayName) {
      counts[dayName] = (counts[dayName] || 0) + 1;
    }
  });

  // Return in Mon-Sun order
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => ({
    day,
    count: counts[day] || 0,
  }));
}

/**
 * Process movies into monthly distribution
 */
function processMoviesByMonth(media: Array<{ watchedAt: Date | null }>): {
  movieCount: number;
  movieData: Array<{ month: string; movies: number }>;
} {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const counts: Record<string, number> = {};
  const now = new Date();

  // Get last 4 months
  const last4Months: string[] = [];
  for (let i = 3; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = months[d.getMonth()];
    if (monthName) {
      last4Months.push(monthName);
      counts[monthName] = 0;
    }
  }

  // Count movies per month
  media.forEach((item) => {
    if (!item.watchedAt) return;
    const watchedDate = new Date(item.watchedAt);
    const monthName = months[watchedDate.getMonth()];
    if (monthName && counts[monthName] !== undefined) {
      counts[monthName]++;
    }
  });

  return {
    movieCount: media.length,
    movieData: last4Months.map((month) => ({
      month,
      movies: counts[month] || 0,
    })),
  };
}

/**
 * Build skill data from programming languages
 */
function buildSkillData(
  languages: Array<{ name: string; percentage: number; hours: number }>
): Array<{ name: string; level: number }> {
  if (languages.length === 0) {
    // Fallback skill data
    return [
      { name: "React/Next.js", level: 90 },
      { name: "TypeScript", level: 85 },
      { name: "Product Design", level: 80 },
      { name: "Photography", level: 75 },
    ];
  }

  // Convert language percentages to skill levels (max 95)
  return languages.slice(0, 4).map((lang) => ({
    name: lang.name,
    level: Math.min(95, Math.round(lang.percentage * 1.2 + 50)),
  }));
}


import { NextResponse } from 'next/server';
import prismaDefault, { prisma as prismaNamed } from '@/lib/prisma';
import type { PrismaClient } from '@prisma/client';
import type { SteamData } from '@/types/bento-data';

// Resolve Prisma client
const prisma = (prismaNamed ?? prismaDefault) as unknown as PrismaClient;

/**
 * Steam gaming data API for Bento cards
 * Fetches from Game, GameSession, GameAchievement database tables
 */
export async function GET() {
  try {
    // Access Prisma dynamically to handle optional models
    const p: any = prisma as unknown as any;

    // Check if required models exist
    if (!p.gameSession?.findFirst || !p.game?.findFirst) {
      console.warn('Gaming tables not available, using fallback');
      return NextResponse.json(getFallbackSteamData());
    }

    // Find most recent gaming session
    const recentSession = await p.gameSession.findFirst({
      where: {
        game: {
          platform: 'STEAM', // Filter for Steam games only
        },
      },
      orderBy: { startTime: 'desc' },
      include: {
        game: {
          include: {
            achievements: {
              where: { isUnlocked: true },
            },
          },
        },
      },
    });

    if (!recentSession || !recentSession.game) {
      console.warn('No recent Steam gaming sessions found, using fallback');
      return NextResponse.json(getFallbackSteamData());
    }

    // Calculate total playtime for this game (in minutes)
    const totalPlaytime = await p.gameSession.aggregate({
      where: { gameId: recentSession.gameId },
      _sum: { duration: true },
    });

    const totalMinutes = totalPlaytime._sum.duration || 0;
    const totalHours = (totalMinutes / 60).toFixed(1);

    // Calculate achievement percentage
    const game = recentSession.game;
    const unlockedCount = game.achievements?.length || 0;
    const totalAchievements = game.totalAchievements || unlockedCount;
    const achievementPercentage =
      totalAchievements > 0
        ? Math.round((unlockedCount / totalAchievements) * 100)
        : 0;

    const data: SteamData = {
      playing: game.name,
      hours: `${totalHours}h`,
      bg: game.coverImage || getFallbackCover(),
      achievement: achievementPercentage,
    };

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
      },
    });
  } catch (error) {
    console.error('Error fetching Steam data:', error);
    return NextResponse.json(getFallbackSteamData());
  }
}

/**
 * Get fallback cover image
 */
function getFallbackCover(): string {
  return 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1245620/header.jpg';
}

/**
 * Fallback data when database is empty or fails
 */
function getFallbackSteamData(): SteamData {
  return {
    playing: 'Elden Ring',
    hours: '142.5h',
    bg: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1245620/header.jpg',
    achievement: 84,
  };
}

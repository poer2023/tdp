import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { MediaData, JellyfinItem, MediaApiParams } from "@/types/live-data";
import type { Prisma } from "@prisma/client";

/**
 * Cached statistics calculation function
 * Reduces database queries by caching stats for 15 minutes
 */
const getCachedStats = unstable_cache(
  async () => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    // Parallel execution of all stat queries
    const [
      // This Week stats
      thisWeekMovies,
      thisWeekSeries,
      thisWeekBilibili,
      thisWeekDouban,
      // This Month stats
      thisMonthMovies,
      thisMonthSeries,
      thisMonthBilibili,
      thisMonthDouban,
      // This Year stats
      thisYearItems,
      // Platform stats
      bilibiliMovies,
      bilibiliSeries,
      bilibiliTotal,
      doubanMovies,
      doubanSeries,
      doubanTotal,
    ] = await Promise.all([
      // This Week
      prisma.mediaWatch.count({ where: { type: "movie", watchedAt: { gte: oneWeekAgo } } }),
      prisma.mediaWatch.count({ where: { type: "series", watchedAt: { gte: oneWeekAgo } } }),
      prisma.mediaWatch.count({ where: { platform: "bilibili", watchedAt: { gte: oneWeekAgo } } }),
      prisma.mediaWatch.count({ where: { platform: "douban", watchedAt: { gte: oneWeekAgo } } }),
      // This Month
      prisma.mediaWatch.count({ where: { type: "movie", watchedAt: { gte: oneMonthAgo } } }),
      prisma.mediaWatch.count({ where: { type: "series", watchedAt: { gte: oneMonthAgo } } }),
      prisma.mediaWatch.count({ where: { platform: "bilibili", watchedAt: { gte: oneMonthAgo } } }),
      prisma.mediaWatch.count({ where: { platform: "douban", watchedAt: { gte: oneMonthAgo } } }),
      // This Year
      prisma.mediaWatch.findMany({
        where: { watchedAt: { gte: oneYearAgo } },
        select: { duration: true, platform: true },
      }),
      // Platform stats
      prisma.mediaWatch.count({ where: { platform: "bilibili", type: "movie" } }),
      prisma.mediaWatch.count({ where: { platform: "bilibili", type: "series" } }),
      prisma.mediaWatch.count({ where: { platform: "bilibili" } }),
      prisma.mediaWatch.count({ where: { platform: "douban", type: "movie" } }),
      prisma.mediaWatch.count({ where: { platform: "douban", type: "series" } }),
      prisma.mediaWatch.count({ where: { platform: "douban" } }),
    ]);

    const thisYearTotalHours = Math.round(
      thisYearItems.reduce((sum, r) => sum + (r.duration || 0), 0) / 60
    );
    const thisYearBilibili = thisYearItems.filter((r) => r.platform === "bilibili").length;
    const thisYearDouban = thisYearItems.filter((r) => r.platform === "douban").length;

    return {
      stats: {
        thisWeek: {
          movies: thisWeekMovies,
          series: thisWeekSeries,
          bilibili: thisWeekBilibili,
          douban: thisWeekDouban,
        },
        thisMonth: {
          movies: thisMonthMovies,
          series: thisMonthSeries,
          bilibili: thisMonthBilibili,
          douban: thisMonthDouban,
        },
        thisYear: {
          totalHours: thisYearTotalHours,
          totalItems: thisYearItems.length,
          bilibili: thisYearBilibili,
          douban: thisYearDouban,
        },
      },
      platformStats: {
        bilibili: {
          total: bilibiliTotal,
          movies: bilibiliMovies,
          series: bilibiliSeries,
        },
        douban: {
          total: doubanTotal,
          movies: doubanMovies,
          series: doubanSeries,
        },
      },
    };
  },
  ["media-stats"],
  {
    revalidate: 900, // Cache for 15 minutes
    tags: ["media-stats"],
  }
);

/**
 * GET /api/about/live/media
 * Returns media consumption data from Bilibili and Douban with pagination and filtering
 *
 * Query Parameters:
 * - platform: "all" | "bilibili" | "douban" (default: "all")
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - dateRange: "all" | "thisWeek" | "thisMonth" | "thisYear" | "custom" (default: "all")
 * - dateFrom: ISO date string (for custom range)
 * - dateTo: ISO date string (for custom range)
 * - completion: "all" | "completed" | "watching" | "notStarted" (Bilibili only)
 * - search: string (search in title)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const params: Required<MediaApiParams> = {
      platform: (searchParams.get("platform") as MediaApiParams["platform"]) || "all",
      page: Math.max(1, parseInt(searchParams.get("page") || "1")),
      limit: Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20"))),
      dateRange: (searchParams.get("dateRange") as MediaApiParams["dateRange"]) || "all",
      dateFrom: searchParams.get("dateFrom") || "",
      dateTo: searchParams.get("dateTo") || "",
      completion: (searchParams.get("completion") as MediaApiParams["completion"]) || "all",
      search: searchParams.get("search") || "",
    };

    // Build where clause for filtering
    const where: Prisma.MediaWatchWhereInput = {};

    // Platform filter
    if (params.platform !== "all") {
      where.platform = params.platform;
    }

    // Date range filter
    const now = new Date();
    if (params.dateRange === "thisWeek") {
      where.watchedAt = { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
    } else if (params.dateRange === "thisMonth") {
      where.watchedAt = { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
    } else if (params.dateRange === "thisYear") {
      where.watchedAt = { gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) };
    } else if (params.dateRange === "custom" && params.dateFrom && params.dateTo) {
      where.watchedAt = {
        gte: new Date(params.dateFrom),
        lte: new Date(params.dateTo),
      };
    }

    // Completion filter (Bilibili only)
    if (params.platform === "bilibili" && params.completion !== "all") {
      if (params.completion === "completed") {
        where.progress = { gte: 100 };
      } else if (params.completion === "watching") {
        where.progress = { gt: 0, lt: 100 };
      } else if (params.completion === "notStarted") {
        where.OR = [{ progress: { lte: 0 } }, { progress: null }];
      }
    }

    // Search filter
    if (params.search) {
      where.title = { contains: params.search, mode: "insensitive" };
    }

    // Count total items matching filters
    const totalItems = await prisma.mediaWatch.count({ where });

    // Calculate pagination
    const totalPages = Math.ceil(totalItems / params.limit);
    const skip = (params.page - 1) * params.limit;

    // Fetch paginated media records
    const mediaRecords = await prisma.mediaWatch.findMany({
      where,
      orderBy: { watchedAt: "desc" },
      take: params.limit,
      skip,
    });

    // Convert to JellyfinItem format with platform info
    const items: JellyfinItem[] = mediaRecords.map((record) => ({
      id: record.id,
      type: record.type as "movie" | "series" | "episode",
      title: record.title,
      poster: record.cover ?? undefined,
      url: record.url ?? undefined,
      watchedAt: record.watchedAt,
      progress: record.progress ?? undefined,
      season: record.season ?? undefined,
      episode: record.episode ?? undefined,
      rating: record.rating ?? undefined,
      platform: record.platform as "bilibili" | "douban",
    }));

    // Get cached statistics (reduces 13+ queries to 1 cached result)
    const { stats, platformStats } = await getCachedStats();

    // Currently watching: series with progress > 0 and < 100
    const currentlyWatchingRecords = await prisma.mediaWatch.findMany({
      where: {
        type: "series",
        progress: { gt: 0, lt: 100 },
      },
      orderBy: { watchedAt: "desc" },
      take: 5,
    });

    const currentlyWatching: JellyfinItem[] = currentlyWatchingRecords.map((record) => ({
      id: record.id,
      type: record.type as "movie" | "series" | "episode",
      title: record.title,
      poster: record.cover ?? undefined,
      url: record.url ?? undefined,
      watchedAt: record.watchedAt,
      progress: record.progress ?? undefined,
      season: record.season ?? undefined,
      episode: record.episode ?? undefined,
      platform: record.platform as "bilibili" | "douban",
    }));

    const data: MediaData = {
      stats,
      items,
      currentlyWatching,
      pagination: {
        currentPage: params.page,
        totalPages,
        totalItems,
        hasMore: params.page < totalPages,
      },
      platformStats,
    };

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("[Media API] Error fetching data:", error);

    return NextResponse.json({ error: "Failed to fetch media data" }, { status: 500 });
  }
}

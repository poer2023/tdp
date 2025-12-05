import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { ReadingData, Book, Article } from "@/types/live-data";

/**
 * GET /api/about/live/reading
 * Returns reading activity data from database
 * Looks for books from MediaWatch (type="book") or dedicated reading sources
 */
export async function GET() {
  try {
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    // Fetch reading data from MediaWatch (type="book" or platform="DOUBAN" with book type)
    const [
      booksThisMonth,
      booksThisYear,
      booksAllTime,
      currentlyReading,
      recentlyFinished,
      recentArticles,
    ] = await Promise.all([
      // Books this month
      prisma.mediaWatch.count({
        where: {
          type: "book",
          watchedAt: { gte: oneMonthAgo },
        },
      }),
      // Books this year
      prisma.mediaWatch.count({
        where: {
          type: "book",
          watchedAt: { gte: oneYearAgo },
        },
      }),
      // All time books
      prisma.mediaWatch.count({
        where: { type: "book" },
      }),
      // Currently reading (progress < 100)
      prisma.mediaWatch.findMany({
        where: {
          type: "book",
          progress: { lt: 100 },
        },
        orderBy: { watchedAt: "desc" },
        take: 4,
      }),
      // Recently finished (progress = 100 or null, sorted by recent)
      prisma.mediaWatch.findMany({
        where: {
          type: "book",
          OR: [{ progress: { gte: 100 } }, { progress: null }],
        },
        orderBy: { watchedAt: "desc" },
        take: 8,
      }),
      // Recent articles (from posts or external articles)
      getRecentArticles(),
    ]);

    // Convert MediaWatch records to Book format
    const toBook = (record: {
      title: string;
      cover: string | null;
      progress: number | null;
      rating: number | null;
      watchedAt: Date;
      metadata: unknown;
    }): Book => {
      const meta = (record.metadata || {}) as {
        author?: string;
        currentPage?: number;
        totalPages?: number;
        startedAt?: string;
      };
      return {
        title: record.title,
        author: meta.author || "Unknown Author",
        cover: record.cover || undefined,
        progress: record.progress || undefined,
        currentPage: meta.currentPage,
        totalPages: meta.totalPages,
        startedAt: meta.startedAt ? new Date(meta.startedAt) : undefined,
        finishedAt: record.progress === 100 ? record.watchedAt : undefined,
        rating: record.rating || undefined,
      };
    };

    const data: ReadingData = {
      stats: {
        thisMonth: { books: booksThisMonth, articles: recentArticles.length },
        thisYear: { books: booksThisYear, articles: 0 },
        allTime: { books: booksAllTime, articles: 0 },
      },
      currentlyReading: currentlyReading.map(toBook),
      recentlyFinished: recentlyFinished.map(toBook),
      recentArticles,
    };

    // If no reading data at all, return empty but valid structure
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("[Reading API] Error:", error);

    // Return empty data structure on error
    const emptyData: ReadingData = {
      stats: {
        thisMonth: { books: 0, articles: 0 },
        thisYear: { books: 0, articles: 0 },
        allTime: { books: 0, articles: 0 },
      },
      currentlyReading: [],
      recentlyFinished: [],
      recentArticles: [],
    };

    return NextResponse.json(emptyData, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  }
}

/**
 * Get recent articles from posts or external sources
 */
async function getRecentArticles(): Promise<Article[]> {
  try {
    // Get recent published posts as "articles read" (own content)
    const recentPosts = await prisma.post.findMany({
      where: {
        status: "PUBLISHED",
      },
      orderBy: { publishedAt: "desc" },
      take: 5,
      select: {
        title: true,
        slug: true,
        publishedAt: true,
        locale: true,
      },
    });

    return recentPosts.map((post) => ({
      title: post.title,
      source: "Blog",
      url: `/${post.locale.toLowerCase()}/posts/${post.slug}`,
      readAt: post.publishedAt || new Date(),
    }));
  } catch {
    return [];
  }
}

import { prisma } from "@/lib/prisma";
import { PostStatus } from "@prisma/client";

export type SiteStatistics = {
  postCount: number;
  photoCount: number;
  momentCount: number;
};

// In-memory cache for statistics
let cachedStats: SiteStatistics | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 60000; // 60 seconds cache TTL

/**
 * Get site-wide statistics for posts, photos, and moments
 * Returns counts of published/visible content only
 *
 * Features:
 * - 60-second in-memory cache to reduce database load
 * - Graceful degradation with cached data during database errors
 * - Enhanced error logging with Prisma error codes
 */
export async function getSiteStatistics(): Promise<SiteStatistics> {
  // Check if database queries should be skipped (for build/CI environments)
  if (process.env.SKIP_DB === "true") {
    return {
      postCount: 0,
      photoCount: 0,
      momentCount: 0,
    };
  }

  // Return cached data if still valid (within TTL)
  const now = Date.now();
  if (cachedStats && now - cacheTimestamp < CACHE_TTL) {
    return cachedStats;
  }

  try {
    const [postCount, photoCount, momentCount] = await Promise.all([
      // Count published posts only
      prisma.post.count({
        where: {
          status: PostStatus.PUBLISHED,
        },
      }),

      // Count all gallery images
      prisma.galleryImage.count(),

      // Count published moments that aren't deleted
      prisma.moment.count({
        where: {
          deletedAt: null,
          status: {
            in: ["PUBLISHED", "SCHEDULED"],
          },
          visibility: {
            in: ["PUBLIC", "UNLISTED"],
          },
        },
      }),
    ]);

    const stats = {
      postCount,
      photoCount,
      momentCount,
    };

    // Update cache with fresh data
    cachedStats = stats;
    cacheTimestamp = now;

    return stats;
  } catch (error: any) {
    // Enhanced error logging with Prisma error codes
    const errorCode = error?.code || "UNKNOWN";
    const errorMessage = error?.message || String(error);
    console.error(`[Statistics] Database error (${errorCode}): ${errorMessage}`);

    // Graceful degradation: return cached data if available
    if (cachedStats) {
      console.warn("[Statistics] Using stale cached data due to database error");
      return cachedStats;
    }

    // Only return zeros if no cached data available
    console.warn("[Statistics] No cached data available, returning zeros");
    return {
      postCount: 0,
      photoCount: 0,
      momentCount: 0,
    };
  }
}

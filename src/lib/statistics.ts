import { prisma } from "@/lib/prisma";
import { PostStatus } from "@prisma/client";

export type SiteStatistics = {
  postCount: number;
  photoCount: number;
  momentCount: number;
};

/**
 * Get site-wide statistics for posts, photos, and moments
 * Returns counts of published/visible content only
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

    return {
      postCount,
      photoCount,
      momentCount,
    };
  } catch (error) {
    console.error("Failed to fetch site statistics:", error);
    // Return zeros as fallback on error
    return {
      postCount: 0,
      photoCount: 0,
      momentCount: 0,
    };
  }
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

// Image source type
export type ImageSource = "post" | "moment" | "gallery";

// Unified image structure for hero selection
export interface SourceImage {
  id: string;
  url: string; // WebP thumbnail for display
  originalUrl: string; // Original image URL
  source: ImageSource;
  sourceId: string;
  title?: string;
  createdAt: string;
  isSelected: boolean;
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    throw new Error("UNAUTHORIZED");
  }
}

// Extract images from Moment's JSON images field
function extractMomentImages(
  momentId: string,
  images: unknown,
  createdAt: Date
): Array<{ url: string; index: number }> {
  if (!Array.isArray(images)) return [];

  return images
    .map((img, index) => {
      if (typeof img === "string") {
        return { url: img, index };
      }
      if (img && typeof img === "object" && "url" in img && typeof img.url === "string") {
        // Prefer previewUrl (WebP) if available
        const previewUrl =
          "previewUrl" in img && typeof img.previewUrl === "string"
            ? img.previewUrl
            : null;
        return { url: previewUrl || img.url, index };
      }
      return null;
    })
    .filter((item): item is { url: string; index: number } => item !== null);
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const sourceFilter = searchParams.get("source") as ImageSource | "all" | null;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "50", 10)));

    // Get current hero image URLs for selection status
    const heroImages = await prisma.heroImage.findMany({
      where: { active: true },
      select: { url: true },
    });
    const heroUrls = new Set(heroImages.map((h) => h.url));

    const allImages: SourceImage[] = [];

    // Fetch from Gallery
    if (!sourceFilter || sourceFilter === "all" || sourceFilter === "gallery") {
      const galleryImages = await prisma.galleryImage.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          filePath: true,
          smallThumbPath: true,
          mediumPath: true,
          title: true,
          createdAt: true,
        },
      });

      for (const img of galleryImages) {
        // Prefer WebP thumbnails
        const displayUrl = img.smallThumbPath || img.mediumPath || img.filePath;
        const originalUrl = img.filePath;

        if (displayUrl) {
          allImages.push({
            id: `gallery-${img.id}`,
            url: displayUrl,
            originalUrl: originalUrl,
            source: "gallery",
            sourceId: img.id,
            title: img.title || undefined,
            createdAt: img.createdAt.toISOString(),
            isSelected: heroUrls.has(displayUrl) || heroUrls.has(originalUrl),
          });
        }
      }
    }

    // Fetch from Posts (cover images)
    if (!sourceFilter || sourceFilter === "all" || sourceFilter === "post") {
      const posts = await prisma.post.findMany({
        where: {
          coverImagePath: { not: null },
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          coverImagePath: true,
          createdAt: true,
        },
      });

      for (const post of posts) {
        if (post.coverImagePath) {
          allImages.push({
            id: `post-${post.id}`,
            url: post.coverImagePath,
            originalUrl: post.coverImagePath,
            source: "post",
            sourceId: post.id,
            title: post.title,
            createdAt: post.createdAt.toISOString(),
            isSelected: heroUrls.has(post.coverImagePath),
          });
        }
      }
    }

    // Fetch from Moments (images array)
    if (!sourceFilter || sourceFilter === "all" || sourceFilter === "moment") {
      const moments = await prisma.moment.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          content: true,
          images: true,
          createdAt: true,
        },
      });

      for (const moment of moments) {
        const momentImages = extractMomentImages(moment.id, moment.images, moment.createdAt);

        for (const { url, index } of momentImages) {
          // Generate a unique ID for each image in the moment
          const imageId = `moment-${moment.id}-${index}`;
          const title = moment.content
            ? moment.content.slice(0, 50) + (moment.content.length > 50 ? "..." : "")
            : undefined;

          allImages.push({
            id: imageId,
            url: url,
            originalUrl: url,
            source: "moment",
            sourceId: moment.id,
            title,
            createdAt: moment.createdAt.toISOString(),
            isSelected: heroUrls.has(url),
          });
        }
      }
    }

    // Sort by createdAt descending
    allImages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Pagination
    const total = allImages.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedImages = allImages.slice(startIndex, startIndex + pageSize);

    return NextResponse.json({
      images: paginatedImages,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Admin] fetch hero sources failed", error);
    return NextResponse.json({ error: "Failed to fetch image sources" }, { status: 500 });
  }
}

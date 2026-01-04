import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole, GalleryCategory } from "@prisma/client";
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
// Returns ONE best thumbnail per image, avoiding duplicates
function extractMomentImages(
  _momentId: string,
  images: unknown,
  _createdAt: Date
): Array<{ url: string; originalUrl: string; index: number }> {
  if (!Array.isArray(images)) return [];

  return images
    .map((img, index) => {
      if (typeof img === "string") {
        return { url: img, originalUrl: img, index };
      }
      if (img && typeof img === "object" && "url" in img && typeof img.url === "string") {
        const record = img as {
          url: string;
          previewUrl?: string;
          smallThumbUrl?: string;
          mediumThumbUrl?: string;
        };
        // Prefer small WebP thumbnails for display, keep original url for dedup
        const displayUrl = record.smallThumbUrl || record.previewUrl || record.url;
        const originalUrl = record.url;
        return { url: displayUrl, originalUrl, index };
      }
      return null;
    })
    .filter((item): item is { url: string; originalUrl: string; index: number } => item !== null);
}

function normalizeImageKey(rawUrl: string): string {
  const cleanUrl = rawUrl.split("?")[0] ?? rawUrl;
  const marker = cleanUrl.toLowerCase().lastIndexOf("/gallery/");
  if (marker === -1) return cleanUrl;

  const pathPart = cleanUrl.slice(marker + "/gallery/".length);
  if (!pathPart) return cleanUrl;

  const segments = pathPart.split("/").filter(Boolean);
  const filename = segments.pop();
  if (!filename) return cleanUrl;

  const withoutExt = filename.replace(/\.(webp|jpe?g|png)$/i, "");
  const withoutSize = withoutExt.replace(/_(micro|small|medium|preview|thumb|large)$/i, "");
  const normalizedPath = [...segments, withoutSize].join("/");
  return `gallery:${normalizedPath.toLowerCase()}`;
}

function isPreferredImage(current: SourceImage, candidate: SourceImage): boolean {
  const currentTime = Date.parse(current.createdAt);
  const candidateTime = Date.parse(candidate.createdAt);

  if (Number.isFinite(currentTime) && Number.isFinite(candidateTime) && candidateTime !== currentTime) {
    return candidateTime > currentTime;
  }

  const sourcePriority: Record<ImageSource, number> = {
    moment: 0,
    post: 1,
    gallery: 2,
  };

  return sourcePriority[candidate.source] < sourcePriority[current.source];
}

function dedupeImages(images: SourceImage[]): { images: SourceImage[]; duplicates: number } {
  const byKey = new Map<string, SourceImage>();

  for (const image of images) {
    const key = normalizeImageKey(image.originalUrl || image.url || image.id);
    const existing = byKey.get(key);

    if (!existing || isPreferredImage(existing, image)) {
      byKey.set(key, image);
    }
  }

  const uniqueImages = Array.from(byKey.values());
  return { images: uniqueImages, duplicates: images.length - uniqueImages.length };
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const sourceFilter = searchParams.get("source") as ImageSource | "all" | null;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "50", 10)));
    const startIndex = (page - 1) * pageSize;

    // Get current hero image URLs for selection status
    const heroImages = await prisma.heroImage.findMany({
      where: { active: true },
      select: { url: true },
    });
    const heroUrls = new Set(heroImages.map((h) => h.url));

    const allImages: SourceImage[] = [];

    // Total count for pagination
    let total = 0;

    // Fetch from Gallery (exclude MOMENT category to avoid duplicates with Moments source)
    if (!sourceFilter || sourceFilter === "all" || sourceFilter === "gallery") {
      const take = sourceFilter === "gallery" ? pageSize : pageSize * page;
      const skip = sourceFilter === "gallery" ? startIndex : 0;

      // When fetching "all" (sourceFilter is null or "all"), exclude MOMENT category 
      // since those images will come from the Moments source
      const categoryFilter = !sourceFilter || sourceFilter === "all"
        ? { category: { not: GalleryCategory.MOMENT } }
        : {};

      const [count, galleryImages] = await Promise.all([
        prisma.galleryImage.count({ where: categoryFilter }),
        prisma.galleryImage.findMany({
          where: categoryFilter,
          orderBy: { createdAt: "desc" },
          take,
          skip,
          select: {
            id: true,
            filePath: true,
            smallThumbPath: true,
            mediumPath: true,
            title: true,
            createdAt: true,
          },
        })
      ]);

      total += count;

      for (const img of galleryImages) {
        const displayUrl = img.smallThumbPath || img.mediumPath || img.filePath;
        const originalUrl = img.filePath;

        if (displayUrl) {
          const isSelected = [
            displayUrl,
            originalUrl,
            img.smallThumbPath,
            img.mediumPath,
          ].some((u) => typeof u === "string" && heroUrls.has(u));

          allImages.push({
            id: `gallery-${img.id}`,
            url: displayUrl,
            originalUrl: originalUrl,
            source: "gallery",
            sourceId: img.id,
            title: img.title || undefined,
            createdAt: img.createdAt.toISOString(),
            isSelected,
          });
        }
      }
    }

    // Fetch from Posts (cover images)
    if (!sourceFilter || sourceFilter === "all" || sourceFilter === "post") {
      const take = sourceFilter === "post" ? pageSize : pageSize * page;
      const skip = sourceFilter === "post" ? startIndex : 0;

      const [count, posts] = await Promise.all([
        prisma.post.count({ where: { coverImagePath: { not: null } } }),
        prisma.post.findMany({
          where: {
            coverImagePath: { not: null },
          },
          orderBy: { createdAt: "desc" },
          take,
          skip,
          select: {
            id: true,
            title: true,
            coverImagePath: true,
            createdAt: true,
          },
        })
      ]);

      total += count;

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
      // Moments are tricky because one moment can have multiple images.
      // We'll fetch a bit more to be safe, or just fetch moments and expand.
      // 1 moment ~= 1-9 images.
      // For specific pagination, we can't easily map moment index to image index in DB.
      // So we fetch 'take: pageSize' moments, which might result in >pageSize images.
      const take = sourceFilter === "moment" ? pageSize : pageSize * page;
      const skip = sourceFilter === "moment" ? startIndex : 0;

      const [count, moments] = await Promise.all([
        prisma.moment.count(),
        prisma.moment.findMany({
          orderBy: { createdAt: "desc" },
          take, // rough approximation
          skip,
          select: {
            id: true,
            content: true,
            images: true,
            createdAt: true,
          },
        })
      ]);

      // Moment count is MOMENTS, not IMAGES. This is a discrepancy.
      // We'll trust the moment count roughly represents "items with images".
      // It's hard to get exact image count without a normalized table.
      total += count;

      for (const moment of moments) {
        const momentImages = extractMomentImages(moment.id, moment.images, moment.createdAt);

        for (const { url, originalUrl, index } of momentImages) {
          const imageId = `moment-${moment.id}-${index}`;
          const title = moment.content
            ? moment.content.slice(0, 50) + (moment.content.length > 50 ? "..." : "")
            : undefined;

          allImages.push({
            id: imageId,
            url: url,
            originalUrl: originalUrl,
            source: "moment",
            sourceId: moment.id,
            title,
            createdAt: moment.createdAt.toISOString(),
            isSelected: heroUrls.has(url) || heroUrls.has(originalUrl),
          });
        }
      }
    }

    // If "all" filter, we fetched top (page*pageSize) from each.
    // Now sort and slice the correct window.
    if (!sourceFilter || sourceFilter === "all") {
      const { images: dedupedImages, duplicates } = dedupeImages(allImages);

      dedupedImages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Since we fetched (page*pageSize) from EACH source, 
      // we have enough data to cover the requested page even after inter-leaving.
      // We just need to take the slice for the current page.
      const paginatedImages = dedupedImages.slice(startIndex, startIndex + pageSize);

      const adjustedTotal = Math.max(0, total - duplicates);

      return NextResponse.json({
        images: paginatedImages,
        pagination: {
          total: adjustedTotal, // Approximation (sum of counts minus local duplicates)
          page,
          pageSize,
          totalPages: Math.ceil(adjustedTotal / pageSize),
        },
      });
    } else {
      // Single source: We already skipped and took correctly (mostly).
      // For moments, we might have expanded more images than 'pageSize'.
      // So we still slice to be safe.
      // Also moments might have been sorted by moment.createdAt, but moment images
      // effectively share that time.

      let paginatedImages = allImages;

      // For moments, specifically, we might have fetched 'pageSize' moments,
      // resulting in e.g. 3 * pageSize images. We should slice to respect pageSize.
      if (sourceFilter === "moment") {
        paginatedImages = allImages.slice(0, pageSize);
      }

      return NextResponse.json({
        images: paginatedImages,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      });
    }
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Admin] fetch hero sources failed", error);
    return NextResponse.json({ error: "Failed to fetch image sources" }, { status: 500 });
  }
}

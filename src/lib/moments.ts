import prisma from "@/lib/prisma";
import { revalidatePath, unstable_cache, revalidateTag } from "next/cache";
import type { Prisma } from "@prisma/client";
import { withDbFallback } from "@/lib/utils/db-fallback";

// Cache tags for invalidation (exported for use in API routes)
export const MOMENTS_PUBLIC_TAG = "moments:public";

export type MomentVisibility = "PUBLIC" | "UNLISTED" | "PRIVATE";
export type MomentStatus = "DRAFT" | "PUBLISHED" | "SCHEDULED";

export type MomentImage = {
  url: string;
  w?: number | null;
  h?: number | null;
  alt?: string | null;
  previewUrl?: string | null;
  microThumbUrl?: string | null;
  smallThumbUrl?: string | null;
  mediumUrl?: string | null;
};

export type MomentVideo = {
  url: string; // Original video URL
  previewUrl?: string | null; // Compressed preview for autoplay (~50-200KB)
  thumbnailUrl?: string | null; // Poster image
  duration?: number | null; // Duration in seconds
  w?: number | null;
  h?: number | null;
};

export type MomentListItem = {
  id: string;
  slug: string | null;
  content: string;
  images: MomentImage[];
  videos: MomentVideo[];
  createdAt: Date;
  visibility: MomentVisibility;
  location: unknown | null;
  tags: string[];
  lang: string;
  authorId: string;
  author: { id: string; name: string | null; image: string | null };
  likeCount: number;
  commentsCount?: number;
  likedByViewer?: boolean;
};

// Internal function to fetch moments (used by cached and uncached versions)
async function _fetchMoments(options?: {
  limit?: number;
  cursor?: string | null;
  visibility?: MomentVisibility;
  lang?: string | null;
  tag?: string | null;
  q?: string | null;
  viewerId?: string | null;
}): Promise<MomentListItem[]> {
  return withDbFallback(
    async () => {
      const limit = options?.limit ?? 20;
      const cursor = options?.cursor ?? null;
      const now = new Date();
      const where: Prisma.MomentWhereInput = {
        deletedAt: null,
        OR: [{ status: "PUBLISHED" }, { status: "SCHEDULED", scheduledAt: { lte: now } }],
      };
      if (options?.visibility) where.visibility = options.visibility;
      else where.visibility = { in: ["PUBLIC", "UNLISTED"] };
      if (options?.lang) where.lang = options.lang;
      const extraAnd: Prisma.MomentWhereInput[] = [];
      if (options?.tag) extraAnd.push({ tags: { has: options.tag } });
      if (options?.q) extraAnd.push({ content: { contains: options.q, mode: "insensitive" } });
      if (extraAnd.length) {
        if (Array.isArray((where as Prisma.MomentWhereInput).AND)) {
          (where as Prisma.MomentWhereInput).AND = [
            ...((where as Prisma.MomentWhereInput).AND as Prisma.MomentWhereInput[]),
            ...extraAnd,
          ];
        } else {
          (where as Prisma.MomentWhereInput).AND = extraAnd;
        }
      }

      const select: Prisma.MomentSelect = {
        id: true,
        slug: true,
        content: true,
        images: true,
        videos: true,
        createdAt: true,
        visibility: true,
        location: true,
        tags: true,
        lang: true,
        authorId: true,
        author: { select: { id: true, name: true, image: true } },
        likeStats: { select: { likeCount: true } },
        _count: { select: { comments: true } },
      };

      if (options?.viewerId) {
        // Get viewer's like state via likes relation
        (select as Prisma.MomentSelect & { likes: unknown }).likes = {
          where: { userId: options.viewerId },
          select: { id: true },
        };
      }

      const items = await prisma.moment.findMany({
        where,
        take: limit,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        orderBy: { createdAt: "desc" },
        select,
      });
      return items.map((m) => {
        const mWithExtras = m as typeof m & {
          likes?: { id: string }[];
          likeStats?: { likeCount: number };
          _count?: { comments: number };
        };
        return {
          ...m,
          images: (m.images as MomentImage[] | null) ?? [],
          videos: (m.videos as MomentVideo[] | null) ?? [],
          likeCount: mWithExtras.likeStats?.likeCount ?? 0,
          commentsCount: mWithExtras._count?.comments ?? 0,
          likedByViewer: options?.viewerId && Array.isArray(mWithExtras.likes)
            ? mWithExtras.likes.length > 0
            : false,
        };
      });
    },
    async () => [],
    "moments:list"
  );
}

// Cached version for public moments list (no viewerId, no cursor, no tag, no q)
// Uses 60s TTL to balance freshness with performance
async function _fetchPublicMomentsCached(
  limit: number,
  visibility: MomentVisibility | undefined,
  lang: string | null | undefined
): Promise<MomentListItem[]> {
  return _fetchMoments({ limit, visibility, lang });
}

const getCachedPublicMoments = unstable_cache(
  _fetchPublicMomentsCached,
  ["moments-public-list"],
  { revalidate: 60, tags: [MOMENTS_PUBLIC_TAG] }
);

export async function listMoments(options?: {
  limit?: number;
  cursor?: string | null;
  visibility?: MomentVisibility;
  lang?: string | null;
  tag?: string | null;
  q?: string | null;
  viewerId?: string | null;
}): Promise<MomentListItem[]> {
  // Use cached version for simple public list queries (no dynamic params)
  const isCacheable = !options?.cursor && !options?.tag && !options?.q && !options?.viewerId;

  if (isCacheable) {
    return getCachedPublicMoments(
      options?.limit ?? 20,
      options?.visibility,
      options?.lang
    );
  }

  // Fall back to uncached version for queries with dynamic params
  return _fetchMoments(options);
}

// Internal function to fetch moment by ID or slug
async function _getMomentByIdOrSlug(idOrSlug: string) {
  return withDbFallback(
    async () => {
      const now = new Date();
      const m = await prisma.moment.findFirst({
        where: {
          deletedAt: null,
          AND: [
            { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
            { OR: [{ status: "PUBLISHED" }, { status: "SCHEDULED", scheduledAt: { lte: now } }] },
          ],
        },
        include: {
          author: { select: { id: true, name: true, image: true } },
        },
      });
      if (!m) return null;
      return { ...m, images: (m.images as MomentImage[] | null) ?? [] };
    },
    async () => null,
    "moments:detail"
  );
}

// Cached version of getMomentByIdOrSlug with 60s TTL
const getCachedMomentByIdOrSlug = unstable_cache(
  _getMomentByIdOrSlug,
  ["moment-detail"],
  { revalidate: 60, tags: [MOMENTS_PUBLIC_TAG] }
);

export async function getMomentByIdOrSlug(idOrSlug: string) {
  return getCachedMomentByIdOrSlug(idOrSlug);
}

// Lightweight type for feed/rss routes
export type MomentFeedItem = {
  id: string;
  slug: string | null;
  content: string;
  createdAt: Date;
};

// Internal function for feed items
async function _fetchMomentsForFeed(limit: number): Promise<MomentFeedItem[]> {
  return withDbFallback(
    async () =>
      prisma.moment.findMany({
        where: { status: "PUBLISHED", visibility: "PUBLIC" },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: { id: true, slug: true, content: true, createdAt: true },
      }),
    async () => [],
    "moments:feed"
  );
}

// Cached version with 600s TTL (matches Cache-Control header)
const getCachedMomentsForFeed = unstable_cache(
  _fetchMomentsForFeed,
  ["moments-for-feed"],
  { revalidate: 600, tags: [MOMENTS_PUBLIC_TAG] }
);

/**
 * Get cached moments for feed/rss generation
 */
export async function listMomentsForFeed(limit: number = 50): Promise<MomentFeedItem[]> {
  return getCachedMomentsForFeed(limit);
}

// Lightweight type for sitemap routes
export type MomentSitemapItem = {
  id: string;
  slug: string | null;
  updatedAt: Date;
};

// Internal function for sitemap items
async function _fetchMomentsForSitemap(limit: number): Promise<MomentSitemapItem[]> {
  return withDbFallback(
    async () =>
      prisma.moment.findMany({
        where: { status: "PUBLISHED", visibility: "PUBLIC" },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: { id: true, slug: true, updatedAt: true },
      }),
    async () => [],
    "moments:sitemap"
  );
}

// Cached version with 600s TTL
const getCachedMomentsForSitemap = unstable_cache(
  _fetchMomentsForSitemap,
  ["moments-for-sitemap"],
  { revalidate: 600, tags: [MOMENTS_PUBLIC_TAG] }
);

/**
 * Get cached moments for sitemap generation
 */
export async function listMomentsForSitemap(limit: number = 500): Promise<MomentSitemapItem[]> {
  return getCachedMomentsForSitemap(limit);
}

export async function softDeleteMoment(id: string, requester: { id: string; role?: string }) {
  const m = await prisma.moment.findUnique({ where: { id } });
  if (!m) throw new Error("not found");
  const can = requester.role === "ADMIN" || requester.id === m.authorId;
  if (!can) throw new Error("forbidden");
  await prisma.moment.update({ where: { id }, data: { deletedAt: new Date() } });
  // Invalidate cache so deleted moment disappears from lists
  revalidatePath("/moments");
  revalidatePath("/zh/moments");
  revalidateTag(MOMENTS_PUBLIC_TAG, "max");
}

export async function restoreMoment(id: string, requester: { id: string; role?: string }) {
  const m = await prisma.moment.findUnique({ where: { id } });
  if (!m) throw new Error("not found");
  const can = requester.role === "ADMIN" || requester.id === m.authorId;
  if (!can) throw new Error("forbidden");
  await prisma.moment.update({ where: { id }, data: { deletedAt: null } });
  // Invalidate cache so restored moment appears in lists
  revalidatePath("/moments");
  revalidatePath("/zh/moments");
  revalidateTag(MOMENTS_PUBLIC_TAG, "max");
}

export async function purgeMoment(id: string, requester: { id: string; role?: string }) {
  const m = await prisma.moment.findUnique({ where: { id } });
  if (!m) return;
  const can = requester.role === "ADMIN" || requester.id === m.authorId;
  if (!can) throw new Error("forbidden");
  await prisma.moment.delete({ where: { id } });
  // Invalidate cache so purged moment disappears from lists
  revalidatePath("/moments");
  revalidatePath("/zh/moments");
  revalidateTag(MOMENTS_PUBLIC_TAG, "max");
}

export async function publishDueScheduled(): Promise<number> {
  const now = new Date();
  const res = await prisma.moment.updateMany({
    where: { status: "SCHEDULED", scheduledAt: { lte: now }, deletedAt: null },
    data: { status: "PUBLISHED" },
  });
  return res.count;
}

export async function createMoment(input: {
  authorId: string;
  content: string;
  images?: MomentImage[];
  visibility?: MomentVisibility;
  tags?: string[];
  location?: { name?: string; lat?: number; lng?: number } | null;
  lang?: string;
  status?: MomentStatus;
  showLocation?: boolean;
}) {
  const moment = await prisma.moment.create({
    data: {
      authorId: input.authorId,
      content: input.content,
      images: (input.images ?? []) as unknown as Prisma.InputJsonValue,
      visibility: input.visibility ?? "PUBLIC",
      tags: input.tags ?? [],
      location: (input.location ?? null) as Prisma.InputJsonValue,
      lang: input.lang ?? "en-US",
      status: input.status ?? "PUBLISHED",
      showLocation: input.showLocation ?? true,
    },
    select: { id: true },
  });

  // Revalidate key pages and cache
  revalidatePath("/moments");
  revalidatePath("/zh/moments");
  revalidateTag(MOMENTS_PUBLIC_TAG, "max");
  return moment.id;
}

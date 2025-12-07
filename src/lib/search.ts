import { PostStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export type SearchResult = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string | null;
  locale: "EN" | "ZH";
  authorName: string | null;
};

export type GallerySearchResult = {
  id: string;
  title: string | null;
  description: string | null;
  microThumbPath: string | null;
  smallThumbPath: string | null;
  locationName: string | null;
  city: string | null;
  country: string | null;
  category: string;
  createdAt: string;
};

export type MomentSearchResult = {
  id: string;
  slug: string | null;
  content: string;
  tags: string[];
  createdAt: string;
  lang: string;
};

const SKIP_DB = process.env.E2E_SKIP_DB === "1" || process.env.E2E_SKIP_DB === "true";

// Helper: Sanitize query for PostgreSQL full-text search
function sanitizeQuery(query: string): string {
  // Remove special characters and trim
  return query
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .join(" & "); // Use AND operator for multi-word queries
}

export async function searchPosts(
  query: string,
  options?: { locale?: "EN" | "ZH"; limit?: number }
): Promise<SearchResult[]> {
  const q = (query || "").trim();
  if (!q) return [];
  if (SKIP_DB) return [];

  const limit = options?.limit ?? 10;
  const locale = options?.locale;

  // Try full-text search first (using GIN index)
  try {
    const sanitized = sanitizeQuery(q);
    const localeFilter = locale ? Prisma.sql`AND p.locale = ${locale}` : Prisma.empty;

    // Only try full-text if sanitized query is valid
    if (sanitized && sanitized.length > 0) {
      const results = await prisma.$queryRaw<
        Array<{
          id: string;
          title: string;
          slug: string;
          excerpt: string;
          publishedAt: Date | null;
          locale: string;
          authorName: string | null;
          rank: number;
        }>
      >`
        SELECT
          p.id,
          p.title,
          p.slug,
          p.excerpt,
          p."publishedAt",
          p.locale,
          u.name as "authorName",
          ts_rank(
            COALESCE(
              p."searchVector",
              to_tsvector('simple',
                COALESCE(p.title, '') || ' ' ||
                COALESCE(p.excerpt, '') || ' ' ||
                COALESCE(p.content, '') || ' ' ||
                COALESCE(p.tags, '')
              )
            ),
            to_tsquery('simple', ${sanitized})
          ) as rank
        FROM "Post" p
        LEFT JOIN "User" u ON p."authorId" = u.id
        WHERE p.status = 'PUBLISHED'
          ${localeFilter}
          AND COALESCE(
            p."searchVector",
            to_tsvector('simple',
              COALESCE(p.title, '') || ' ' ||
              COALESCE(p.excerpt, '') || ' ' ||
              COALESCE(p.content, '') || ' ' ||
              COALESCE(p.tags, '')
            )
          ) @@ to_tsquery('simple', ${sanitized})
        ORDER BY rank DESC, p."publishedAt" DESC NULLS LAST
        LIMIT ${limit}
      `;

      if (results.length > 0) {
        return results.map((p) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          excerpt: p.excerpt,
          publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
          locale: p.locale as "EN" | "ZH",
          authorName: p.authorName,
        }));
      }
    }
  } catch (error) {
    console.error("Full-text search failed:", error);
  }

  // Try fuzzy matching using pg_trgm similarity
  try {
    const localeFilter = locale ? Prisma.sql`AND p.locale = ${locale}` : Prisma.empty;
    const fuzzyResults = await prisma.$queryRaw<
      Array<{
        id: string;
        title: string;
        slug: string;
        excerpt: string;
        publishedAt: Date | null;
        locale: string;
        authorName: string | null;
        similarity: number;
      }>
    >`
      SELECT
        p.id,
        p.title,
        p.slug,
        p.excerpt,
        p."publishedAt",
        p.locale,
        u.name as "authorName",
        GREATEST(
          similarity(p.title, ${q}),
          similarity(p.content, ${q})
        ) as similarity
      FROM "Post" p
      LEFT JOIN "User" u ON p."authorId" = u.id
      WHERE p.status = 'PUBLISHED'
        ${localeFilter}
        AND (
          similarity(p.title, ${q}) > 0.15
          OR similarity(p.content, ${q}) > 0.1
        )
      ORDER BY similarity DESC, p."publishedAt" DESC NULLS LAST
      LIMIT ${limit}
    `;

    if (fuzzyResults.length > 0) {
      return fuzzyResults.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
        locale: p.locale as "EN" | "ZH",
        authorName: p.authorName,
      }));
    }
  } catch (error) {
    console.error("Fuzzy search failed:", error);
  }

  // Final fallback: LIKE search (always works, no extension required)
  try {
    const posts = await prisma.post.findMany({
      where: {
        status: PostStatus.PUBLISHED,
        ...(locale ? { locale } : {}),
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { excerpt: { contains: q, mode: "insensitive" } },
          { content: { contains: q, mode: "insensitive" } },
          { tags: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: [{ publishedAt: "desc" }],
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        publishedAt: true,
        locale: true,
        author: { select: { name: true } },
      },
    });

    return posts.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
      locale: p.locale as "EN" | "ZH",
      authorName: p.author?.name ?? null,
    }));
  } catch (error) {
    console.error("LIKE search failed:", error);
    return [];
  }
}

export async function searchGalleryImages(
  query: string,
  options?: { limit?: number }
): Promise<GallerySearchResult[]> {
  const q = (query || "").trim();
  if (!q) return [];
  if (SKIP_DB) return [];

  const limit = options?.limit ?? 6;

  try {
    // Try full-text search first
    const sanitized = sanitizeQuery(q);

    const results = await prisma.$queryRaw<
      Array<{
        id: string;
        title: string | null;
        description: string | null;
        microThumbPath: string | null;
        smallThumbPath: string | null;
        locationName: string | null;
        city: string | null;
        country: string | null;
        category: string;
        createdAt: Date;
        rank: number;
      }>
    >`
      SELECT
        id,
        title,
        description,
        "microThumbPath",
        "smallThumbPath",
        "locationName",
        city,
        country,
        category,
        "createdAt",
        ts_rank(
          to_tsvector('simple',
            COALESCE(title, '') || ' ' ||
            COALESCE(description, '') || ' ' ||
            COALESCE("locationName", '') || ' ' ||
            COALESCE(city, '') || ' ' ||
            COALESCE(country, '')
          ),
          to_tsquery('simple', ${sanitized})
        ) as rank
      FROM "GalleryImage"
      WHERE to_tsvector('simple',
        COALESCE(title, '') || ' ' ||
        COALESCE(description, '') || ' ' ||
        COALESCE("locationName", '') || ' ' ||
        COALESCE(city, '') || ' ' ||
        COALESCE(country, '')
      ) @@ to_tsquery('simple', ${sanitized})
      ORDER BY rank DESC, "createdAt" DESC
      LIMIT ${limit}
    `;

    if (results.length > 0) {
      return results.map((img) => ({
        id: img.id,
        title: img.title,
        description: img.description,
        microThumbPath: img.microThumbPath,
        smallThumbPath: img.smallThumbPath,
        locationName: img.locationName,
        city: img.city,
        country: img.country,
        category: img.category,
        createdAt: img.createdAt.toISOString(),
      }));
    }

    // Fallback: fuzzy matching
    const fuzzyResults = await prisma.$queryRaw<
      Array<{
        id: string;
        title: string | null;
        description: string | null;
        microThumbPath: string | null;
        smallThumbPath: string | null;
        locationName: string | null;
        city: string | null;
        country: string | null;
        category: string;
        createdAt: Date;
        similarity: number;
      }>
    >`
      SELECT
        id,
        title,
        description,
        "microThumbPath",
        "smallThumbPath",
        "locationName",
        city,
        country,
        category,
        "createdAt",
        GREATEST(
          COALESCE(similarity(title, ${q}), 0),
          COALESCE(similarity("locationName", ${q}), 0),
          COALESCE(similarity(city, ${q}), 0)
        ) as similarity
      FROM "GalleryImage"
      WHERE (
        similarity(title, ${q}) > 0.3
        OR similarity("locationName", ${q}) > 0.3
        OR similarity(city, ${q}) > 0.3
      )
      ORDER BY similarity DESC, "createdAt" DESC
      LIMIT ${limit}
    `;

    return fuzzyResults.map((img) => ({
      id: img.id,
      title: img.title,
      description: img.description,
      microThumbPath: img.microThumbPath,
      smallThumbPath: img.smallThumbPath,
      locationName: img.locationName,
      city: img.city,
      country: img.country,
      category: img.category,
      createdAt: img.createdAt.toISOString(),
    }));
  } catch (error) {
    // Fallback to LIKE search
    console.error("Full-text search failed for gallery, falling back to LIKE:", error);

    const images = await prisma.galleryImage.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { locationName: { contains: q, mode: "insensitive" } },
          { city: { contains: q, mode: "insensitive" } },
          { country: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: [{ createdAt: "desc" }],
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        microThumbPath: true,
        smallThumbPath: true,
        locationName: true,
        city: true,
        country: true,
        category: true,
        createdAt: true,
      },
    });

    return images.map((img) => ({
      id: img.id,
      title: img.title,
      description: img.description,
      microThumbPath: img.microThumbPath,
      smallThumbPath: img.smallThumbPath,
      locationName: img.locationName,
      city: img.city,
      country: img.country,
      category: img.category,
      createdAt: img.createdAt.toISOString(),
    }));
  }
}

export async function searchMoments(
  query: string,
  options?: { lang?: string; limit?: number }
): Promise<MomentSearchResult[]> {
  const q = (query || "").trim();
  if (!q) return [];
  if (SKIP_DB) return [];

  const limit = options?.limit ?? 4;
  const lang = options?.lang;

  try {
    // Try full-text search first
    const sanitized = sanitizeQuery(q);
    const now = new Date();
    const langFilter = lang ? Prisma.sql`AND m.lang = ${lang}` : Prisma.empty;

    const results = await prisma.$queryRaw<
      Array<{
        id: string;
        slug: string | null;
        content: string;
        tags: string[];
        createdAt: Date;
        lang: string;
        rank: number;
      }>
    >`
      SELECT
        m.id,
        m.slug,
        m.content,
        m.tags,
        m."createdAt",
        m.lang,
        ts_rank(
          to_tsvector('simple', COALESCE(m.content, '')),
          to_tsquery('simple', ${sanitized})
        ) as rank
      FROM "Moment" m
      WHERE m."deletedAt" IS NULL
        AND (
          m.status = 'PUBLISHED'
          OR (m.status = 'SCHEDULED' AND m."scheduledAt" <= ${now})
        )
        AND m.visibility IN ('PUBLIC', 'UNLISTED')
        ${langFilter}
        AND to_tsvector('simple', COALESCE(m.content, ''))
          @@ to_tsquery('simple', ${sanitized})
      ORDER BY rank DESC, m."createdAt" DESC
      LIMIT ${limit}
    `;

    if (results.length > 0) {
      return results.map((m) => ({
        id: m.id,
        slug: m.slug,
        content: m.content,
        tags: m.tags,
        createdAt: m.createdAt.toISOString(),
        lang: m.lang,
      }));
    }

    // Fallback: fuzzy matching
    const fuzzyResults = await prisma.$queryRaw<
      Array<{
        id: string;
        slug: string | null;
        content: string;
        tags: string[];
        createdAt: Date;
        lang: string;
        similarity: number;
      }>
    >`
      SELECT
        m.id,
        m.slug,
        m.content,
        m.tags,
        m."createdAt",
        m.lang,
        similarity(m.content, ${q}) as similarity
      FROM "Moment" m
      WHERE m."deletedAt" IS NULL
        AND (
          m.status = 'PUBLISHED'
          OR (m.status = 'SCHEDULED' AND m."scheduledAt" <= ${now})
        )
        AND m.visibility IN ('PUBLIC', 'UNLISTED')
        ${langFilter}
        AND similarity(m.content, ${q}) > 0.2
      ORDER BY similarity DESC, m."createdAt" DESC
      LIMIT ${limit}
    `;

    return fuzzyResults.map((m) => ({
      id: m.id,
      slug: m.slug,
      content: m.content,
      tags: m.tags,
      createdAt: m.createdAt.toISOString(),
      lang: m.lang,
    }));
  } catch (error) {
    // Fallback to LIKE search
    console.error("Full-text search failed for moments, falling back to LIKE:", error);

    const now = new Date();
    const moments = await prisma.moment.findMany({
      where: {
        deletedAt: null,
        OR: [{ status: "PUBLISHED" }, { status: "SCHEDULED", scheduledAt: { lte: now } }],
        visibility: { in: ["PUBLIC", "UNLISTED"] },
        ...(lang ? { lang } : {}),
        AND: [
          {
            OR: [{ content: { contains: q, mode: "insensitive" } }, { tags: { has: q } }],
          },
        ],
      },
      orderBy: [{ createdAt: "desc" }],
      take: limit,
      select: {
        id: true,
        slug: true,
        content: true,
        tags: true,
        createdAt: true,
        lang: true,
      },
    });

    return moments.map((m) => ({
      id: m.id,
      slug: m.slug,
      content: m.content,
      tags: m.tags,
      createdAt: m.createdAt.toISOString(),
      lang: m.lang,
    }));
  }
}

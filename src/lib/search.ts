import { PostStatus } from "@prisma/client";
import prisma from "@/lib/prisma";

export type SearchResult = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string | null;
  locale: "EN" | "ZH";
  authorName: string | null;
};

const SKIP_DB = process.env.E2E_SKIP_DB === "1" || process.env.E2E_SKIP_DB === "true";

export async function searchPosts(
  query: string,
  options?: { locale?: "EN" | "ZH"; limit?: number }
): Promise<SearchResult[]> {
  const q = (query || "").trim();
  if (!q) return [];
  if (SKIP_DB) return [];

  const limit = options?.limit ?? 10;
  const locale = options?.locale;

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
    include: { author: { select: { name: true } } },
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
}

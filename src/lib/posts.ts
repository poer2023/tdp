import { PostLocale, PostStatus, type Prisma } from "@prisma/client";
import { unstable_cache, revalidateTag } from "next/cache";
import prisma from "@/lib/prisma";
import { shouldSkipDb, withDbFallback } from "@/lib/utils/db-fallback";
import { toPinyinString } from "@/lib/pinyin";

// Cache tags for invalidation
const POSTS_PUBLIC_TAG = "posts:public";

export type PublicPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImagePath: string | null;
  tags: string[];
  status: PostStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  locale: PostLocale;
  viewCount?: number;
  author?: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
};

export type PostSummary = Pick<PublicPost, "id" | "title" | "slug" | "status">;
export type PublicPostSummary = Omit<PublicPost, "content">;

export type RecentActivity = {
  type: "post" | "gallery";
  title: string;
  slug?: string;
  id: string;
  date: string;
  image: string;
};

export type CreatePostInput = {
  title: string;
  excerpt: string;
  content: string;
  tags?: string[];
  status?: PostStatus;
  coverImagePath?: string | null;
  authorId?: string;
  locale?: PostLocale;
};

export type UpdatePostInput = {
  title?: string;
  excerpt?: string;
  content?: string;
  tags?: string[];
  status?: PostStatus;
  coverImagePath?: string | null;
  publishedAt?: Date | null;
  locale?: PostLocale;
};

type PostWithAuthor = Prisma.PostGetPayload<{ include: { author: true } }>;

const SKIP_DB = shouldSkipDb();

export async function listPublishedPosts(options?: { limit?: number }): Promise<PublicPost[]> {
  return withDbFallback(
    async () => {
      const posts = await prisma.post.findMany({
        where: { status: PostStatus.PUBLISHED },
        include: { author: true },
        orderBy: { publishedAt: "desc" },
        ...(options?.limit ? { take: options.limit } : {}),
      });
      return posts.map(toPublicPost);
    },
    async () => []
  );
}

// Internal function to fetch post summaries (used by cached version)
async function _fetchPublishedPostSummaries(limit?: number): Promise<PublicPostSummary[]> {
  return withDbFallback(
    async () => {
      const posts = await prisma.post.findMany({
        where: { status: PostStatus.PUBLISHED },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImagePath: true,
          tags: true,
          status: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
          locale: true,
          viewCount: true,
          author: { select: { id: true, name: true, image: true } },
        },
        orderBy: { publishedAt: "desc" },
        ...(limit ? { take: limit } : {}),
      });

      return posts.map((post) => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        coverImagePath: post.coverImagePath,
        tags: parseTags(post.tags),
        status: post.status,
        publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
        locale: post.locale,
        viewCount: post.viewCount || 0,
        author: post.author
          ? {
            id: post.author.id,
            name: post.author.name,
            image: post.author.image,
          }
          : null,
      }));
    },
    async () => []
  );
}

// Cached version with 60s TTL
const getCachedPublishedPostSummaries = unstable_cache(
  _fetchPublishedPostSummaries,
  ["posts-published-summaries"],
  { revalidate: 60, tags: [POSTS_PUBLIC_TAG] }
);

export async function listPublishedPostSummaries(options?: {
  limit?: number;
}): Promise<PublicPostSummary[]> {
  return getCachedPublishedPostSummaries(options?.limit);
}

// Lightweight type for sitemap routes
export type PostSitemapItem = {
  slug: string;
  updatedAt: Date;
};

// Internal function for sitemap items by locale
async function _fetchPostsForSitemap(localeCode: "EN" | "ZH"): Promise<PostSitemapItem[]> {
  return withDbFallback(
    async () => {
      const posts = await prisma.post.findMany({
        where: {
          locale: localeCode,
          status: PostStatus.PUBLISHED,
        },
        select: { slug: true, updatedAt: true },
        orderBy: { publishedAt: "desc" },
      });
      return posts;
    },
    async () => [],
    "posts:sitemap"
  );
}

// Cached version with 3600s TTL (matches Cache-Control header)
const getCachedPostsForSitemap = unstable_cache(
  _fetchPostsForSitemap,
  ["posts-for-sitemap"],
  { revalidate: 3600, tags: [POSTS_PUBLIC_TAG] }
);

/**
 * Get cached posts for sitemap generation by locale
 * Note: In CI environment, bypass cache to ensure E2E tests see freshly seeded data
 */
export async function listPostsForSitemap(locale: "EN" | "ZH"): Promise<PostSitemapItem[]> {
  // Bypass cache in CI to avoid stale data issues in E2E tests
  if (process.env.CI === "true") {
    return _fetchPostsForSitemap(locale);
  }
  return getCachedPostsForSitemap(locale);
}


export async function listAllPosts(): Promise<PublicPost[]> {
  return withDbFallback(
    async () => {
      const posts = await prisma.post.findMany({
        include: { author: true },
        orderBy: { createdAt: "desc" },
      });
      return posts.map(toPublicPost);
    },
    async () => []
  );
}

export async function listPostSummaries(): Promise<PostSummary[]> {
  return withDbFallback(
    async () => {
      const posts = await prisma.post.findMany({
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
        },
        orderBy: { createdAt: "desc" },
      });
      return posts.map((post) => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        status: post.status as PostStatus,
      }));
    },
    async () => []
  );
}

export async function getPostBySlug(
  slug: string,
  locale: "EN" | "ZH" = "EN"
): Promise<PublicPost | null> {
  return withDbFallback(
    async () => {
      const post = await prisma.post.findUnique({
        where: {
          locale_slug: {
            locale,
            slug,
          },
        },
        include: { author: true },
      });
      return post ? toPublicPost(post) : null;
    },
    async () => null
  );
}

export async function getPostById(id: string): Promise<PublicPost | null> {
  return withDbFallback(
    async () => {
      const post = await prisma.post.findUnique({
        where: { id },
        include: { author: true },
      });
      return post ? toPublicPost(post) : null;
    },
    async () => null
  );
}

export async function createPost(input: CreatePostInput): Promise<PublicPost> {
  const title = input.title.trim();
  const locale = input.locale ?? PostLocale.EN;
  const slug = await createUniqueSlug(title, locale);
  const status = input.status ?? PostStatus.DRAFT;

  const now = new Date();
  const publishedAt = status === PostStatus.PUBLISHED ? now : null;

  try {
    const post = await prisma.post.create({
      data: {
        title,
        slug,
        excerpt: input.excerpt.trim(),
        content: input.content.trim(),
        tags: serializeTags(input.tags),
        status,
        coverImagePath: input.coverImagePath ?? null,
        publishedAt,
        locale,
        ...(input.authorId ? { author: { connect: { id: input.authorId } } } : {}),
      },
      include: { author: true },
    });
    // Invalidate public posts cache
    revalidateTag(POSTS_PUBLIC_TAG, "max");
    return toPublicPost(post);
  } catch (_e) {
    throw new Error("数据库不可用，无法创建文章");
  }
}

export async function updatePost(id: string, input: UpdatePostInput): Promise<PublicPost> {
  const existing = await prisma.post.findUnique({ where: { id } }).catch(() => null);
  if (!existing) {
    throw new Error("未找到对应文章");
  }

  const status = input.status ?? existing.status;
  const publishedAt =
    status === PostStatus.PUBLISHED
      ? (input.publishedAt ?? existing.publishedAt ?? new Date())
      : null;
  const locale = input.locale ?? existing.locale;

  try {
    const post = await prisma.post.update({
      where: { id },
      data: {
        title: input.title?.trim() ?? existing.title,
        excerpt: input.excerpt?.trim() ?? existing.excerpt,
        content: input.content?.trim() ?? existing.content,
        tags: serializeTags(input.tags ?? parseTags(existing.tags)),
        status,
        coverImagePath: input.coverImagePath ?? existing.coverImagePath,
        publishedAt,
        locale,
      },
      include: { author: true },
    });
    // Invalidate public posts cache
    revalidateTag(POSTS_PUBLIC_TAG, "max");
    return toPublicPost(post);
  } catch (_e) {
    throw new Error("数据库不可用，无法更新文章");
  }
}

export async function deletePost(id: string): Promise<void> {
  try {
    await prisma.post.delete({ where: { id } });
    // Invalidate public posts cache so deleted post disappears from lists
    revalidateTag(POSTS_PUBLIC_TAG, "max");
  } catch (_e) {
    throw new Error("数据库不可用，无法删除文章");
  }
}

export function parseTags(raw?: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function serializeTags(tags?: string[]): string | null {
  if (!tags || !tags.length) return null;
  return tags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .join(",");
}

async function createUniqueSlug(title: string, locale: PostLocale = PostLocale.EN): Promise<string> {
  const base = await slugify(title);
  let candidate = base || `post-${Date.now()}`;
  let suffix = 2;

  while (true) {
    const existing = await prisma.post.findFirst({
      where: {
        locale,
        slug: candidate,
      },
    });
    if (!existing) {
      return candidate;
    }
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

async function slugify(input: string): Promise<string> {
  const text = String(input || "");

  // 将中文转换为拼音（无声调），其他字符保留，随后统一做 URL 安全清洗
  let converted = text;
  try {
    // pinyin-pro: 输出为字符串，使用 v 代替 ü，移除音调
    converted = await toPinyinString(text, {
      toneType: "none",
      type: "string",
      v: true,
    });
  } catch {
    // 如果转换失败，回退到原始文本
    converted = text;
  }

  // 归一化并仅保留 ASCII 字母、数字、空格与连字符
  return converted
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function toPublicPost(post: PostWithAuthor): PublicPost {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    coverImagePath: post.coverImagePath,
    tags: parseTags(post.tags),
    status: post.status,
    publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    locale: post.locale,
    viewCount: post.viewCount || 0,
    author: post.author
      ? {
        id: post.author.id,
        name: post.author.name,
        image: post.author.image,
      }
      : null,
  };
}

export async function getRecentActivities(limit = 4): Promise<RecentActivity[]> {
  if (SKIP_DB) return [];
  try {
    const [posts, images] = await Promise.all([
      prisma.post.findMany({
        where: { status: PostStatus.PUBLISHED },
        select: { id: true, title: true, slug: true, publishedAt: true, coverImagePath: true },
        orderBy: { publishedAt: "desc" },
        take: limit,
      }),
      prisma.galleryImage.findMany({
        select: {
          id: true,
          title: true,
          createdAt: true,
          smallThumbPath: true,
          microThumbPath: true,
          filePath: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
    ]);

    const activities: RecentActivity[] = [
      ...posts.map((p) => ({
        type: "post" as const,
        title: p.title,
        slug: p.slug,
        id: p.id,
        date: p.publishedAt ? p.publishedAt.toISOString() : new Date().toISOString(),
        image: p.coverImagePath ?? "/images/placeholder-cover.svg",
      })),
      ...images.map((img) => ({
        type: "gallery" as const,
        title: img.title || "Untitled Photo",
        id: img.id,
        date: img.createdAt.toISOString(),
        image: img.smallThumbPath ?? img.microThumbPath ?? img.filePath,
      })),
    ];

    return activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  } catch (_e) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("DB unavailable in getRecentActivities, returning empty list.", _e);
    }
    return [];
  }
}

/**
 * 将 PublicPost 或 PublicPostSummary 转换为 Blog8 组件所需的格式
 * Both types work since this function only uses fields present in PublicPostSummary
 */
export function toBlog8Post(
  post: PublicPost | PublicPostSummary,
  locale: string = "en"
): {
  id: string;
  title: string;
  summary: string;
  author: string;
  published: string;
  url: string;
  image: string;
  tags?: string[];
} {
  const formatDate = (isoString: string | null) => {
    if (!isoString) return locale === "zh" ? "未发布" : "Not published";
    const date = new Date(isoString);
    if (locale === "zh") {
      return date.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return {
    id: post.id,
    title: post.title,
    summary: post.excerpt,
    author: post.author?.name || (locale === "zh" ? "匿名" : "Anonymous"),
    published: formatDate(post.publishedAt),
    url: `/${locale}/posts/${post.slug}`,
    image: post.coverImagePath || "/images/placeholder-cover.svg",
    tags: post.tags,
  };
}

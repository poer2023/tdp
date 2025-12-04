import { PostLocale, PostStatus, type Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { pinyin } from "pinyin-pro";
import { shouldSkipDb, withDbFallback } from "@/lib/utils/db-fallback";

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

export async function listPublishedPosts(): Promise<PublicPost[]> {
  return withDbFallback(
    async () => {
      const posts = await prisma.post.findMany({
        where: { status: PostStatus.PUBLISHED },
        include: { author: true },
        orderBy: { publishedAt: "desc" },
      });
      return posts.map(toPublicPost);
    },
    async () => []
  );
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
    return toPublicPost(post);
  } catch (_e) {
    throw new Error("数据库不可用，无法更新文章");
  }
}

export async function deletePost(id: string): Promise<void> {
  try {
    await prisma.post.delete({ where: { id } });
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
  const base = slugify(title);
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

function slugify(input: string): string {
  const text = String(input || "");

  // 将中文转换为拼音（无声调），其他字符保留，随后统一做 URL 安全清洗
  let converted = text;
  try {
    // pinyin-pro: 输出为字符串，使用 v 代替 ü，移除音调
    converted = pinyin(text, {
      toneType: "none",
      type: "string",
      v: true,
    }) as string;
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
 * 将 PublicPost 转换为 Blog8 组件所需的格式
 */
export function toBlog8Post(
  post: PublicPost,
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

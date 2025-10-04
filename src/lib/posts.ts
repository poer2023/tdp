import { PostStatus, type Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { pinyin } from "pinyin-pro";

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
  author?: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
};

export type PostSummary = Pick<PublicPost, "id" | "title" | "slug" | "status">;

export type CreatePostInput = {
  title: string;
  excerpt: string;
  content: string;
  tags?: string[];
  status?: PostStatus;
  coverImagePath?: string | null;
  authorId?: string;
};

export type UpdatePostInput = {
  title?: string;
  excerpt?: string;
  content?: string;
  tags?: string[];
  status?: PostStatus;
  coverImagePath?: string | null;
  publishedAt?: Date | null;
};

type PostWithAuthor = Prisma.PostGetPayload<{ include: { author: true } }>;

export async function listPublishedPosts(): Promise<PublicPost[]> {
  const posts = await prisma.post.findMany({
    where: { status: PostStatus.PUBLISHED },
    include: { author: true },
    orderBy: { publishedAt: "desc" },
  });

  return posts.map(toPublicPost);
}

export async function listAllPosts(): Promise<PublicPost[]> {
  const posts = await prisma.post.findMany({
    include: { author: true },
    orderBy: { createdAt: "desc" },
  });

  return posts.map(toPublicPost);
}

export async function listPostSummaries(): Promise<PostSummary[]> {
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
}

export async function getPostBySlug(
  slug: string,
  locale: "EN" | "ZH" = "EN"
): Promise<PublicPost | null> {
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
}

export async function getPostById(id: string): Promise<PublicPost | null> {
  const post = await prisma.post.findUnique({
    where: { id },
    include: { author: true },
  });

  return post ? toPublicPost(post) : null;
}

export async function createPost(input: CreatePostInput): Promise<PublicPost> {
  const title = input.title.trim();
  const slug = await createUniqueSlug(title);
  const status = input.status ?? PostStatus.DRAFT;

  const now = new Date();
  const publishedAt = status === PostStatus.PUBLISHED ? now : null;

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
      ...(input.authorId ? { author: { connect: { id: input.authorId } } } : {}),
    },
    include: { author: true },
  });

  return toPublicPost(post);
}

export async function updatePost(id: string, input: UpdatePostInput): Promise<PublicPost> {
  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("未找到对应文章");
  }

  const status = input.status ?? existing.status;
  const publishedAt =
    status === PostStatus.PUBLISHED
      ? (input.publishedAt ?? existing.publishedAt ?? new Date())
      : null;

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
    },
    include: { author: true },
  });

  return toPublicPost(post);
}

export async function deletePost(id: string): Promise<void> {
  await prisma.post.delete({ where: { id } });
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

async function createUniqueSlug(title: string, locale: "EN" | "ZH" = "EN"): Promise<string> {
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
    author: post.author
      ? {
          id: post.author.id,
          name: post.author.name,
          image: post.author.image,
        }
      : null,
  };
}

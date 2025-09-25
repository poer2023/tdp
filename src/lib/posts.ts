import { PostStatus, type Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

export type PublicPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImagePath: string | null;
  tags: string[];
  status: PostStatus;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
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
    status: post.status,
  }));
}

export async function getPostBySlug(slug: string): Promise<PublicPost | null> {
  const post = await prisma.post.findUnique({
    where: { slug },
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

async function createUniqueSlug(title: string): Promise<string> {
  const base = slugify(title);
  let candidate = base || `post-${Date.now()}`;
  let suffix = 2;

  while (true) {
    const existing = await prisma.post.findUnique({ where: { slug: candidate } });
    if (!existing) {
      return candidate;
    }
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s\u4e00-\u9fa5-]/g, "")
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
    publishedAt: post.publishedAt,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: post.author
      ? {
          id: post.author.id,
          name: post.author.name,
          image: post.author.image,
        }
      : null,
  };
}

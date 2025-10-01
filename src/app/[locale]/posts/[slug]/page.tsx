import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { PostLocale, PostStatus } from "@prisma/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import prisma from "@/lib/prisma";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export default async function LocalizedPostPage({ params }: PageProps) {
  const { locale, slug } = await params;

  // Validate locale
  if (locale !== "zh") {
    notFound();
  }

  // Fetch post
  const post = await prisma.post.findUnique({
    where: {
      locale_slug: {
        locale: PostLocale.ZH,
        slug,
      },
      status: PostStatus.PUBLISHED,
    },
    include: {
      author: {
        select: {
          name: true,
          image: true,
        },
      },
    },
  });

  if (!post) {
    notFound();
  }

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      {/* Header */}
      <header className="mb-12">
        <h1 className="text-4xl font-bold leading-tight text-zinc-900 dark:text-zinc-100 md:text-5xl">
          {post.title}
        </h1>

        {/* Metadata */}
        <div className="mt-6 flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
          {post.author?.name && (
            <span>{post.author.name}</span>
          )}
          {post.publishedAt && (
            <time dateTime={post.publishedAt.toISOString()}>
              {new Date(post.publishedAt).toLocaleDateString("zh-CN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          )}
          {post.tags && (
            <span className="text-blue-600 dark:text-blue-400">
              {post.tags}
            </span>
          )}
        </div>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="mt-6 text-lg text-zinc-600 dark:text-zinc-400">
            {post.excerpt}
          </p>
        )}
      </header>

      {/* Cover Image */}
      {post.coverImagePath && (
        <div className="mb-12 relative aspect-video">
          <Image
            src={post.coverImagePath}
            alt={post.title}
            fill
            className="rounded-lg object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="prose prose-zinc dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {post.content}
        </ReactMarkdown>
      </div>

      {/* Footer */}
      <footer className="mt-16 border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <Link
          href="/zh/posts"
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          ← 返回文章列表
        </Link>
      </footer>
    </article>
  );
}

export async function generateStaticParams() {
  const posts = await prisma.post.findMany({
    where: {
      locale: PostLocale.ZH,
      status: PostStatus.PUBLISHED,
    },
    select: {
      slug: true,
    },
  });

  return posts.map((post) => ({
    locale: "zh",
    slug: post.slug,
  }));
}

import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { PostLocale, PostStatus } from "@prisma/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import prisma from "@/lib/prisma";
import { LanguageSwitcher } from "@/components/language-switcher";
import { generateBlogPostingSchema, generateAlternateLinks } from "@/lib/seo";
import { LikeButton } from "@/components/like-button";
import { CommentsSection } from "@/components/comments-section";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;

  if (locale !== "zh") {
    return {
      title: "页面未找到",
    };
  }

  const post = await prisma.post.findUnique({
    where: {
      locale_slug: {
        locale: PostLocale.ZH,
        slug,
      },
      status: PostStatus.PUBLISHED,
    },
  });

  if (!post) {
    return {
      title: "文章未找到",
    };
  }

  // Find alternate language version
  let alternateSlug: string | undefined;
  if (post.groupId) {
    const alternatePost = await prisma.post.findFirst({
      where: {
        groupId: post.groupId,
        locale: PostLocale.EN,
      },
      select: { slug: true },
    });
    alternateSlug = alternatePost?.slug;
  }

  const url = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/zh/posts/${slug}`;
  const alternateLinks = generateAlternateLinks(PostLocale.ZH, slug, alternateSlug);

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.coverImagePath ? [post.coverImagePath] : undefined,
    },
    alternates: {
      languages: alternateLinks,
    },
  };
}

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

  const url = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/zh/posts/${slug}`;
  const schema = generateBlogPostingSchema(post, url);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <article className="mx-auto max-w-3xl px-6 py-16">
      {/* Language Switcher */}
      <div className="mb-8">
        <LanguageSwitcher
          currentLocale={PostLocale.ZH}
          currentSlug={post.slug}
          groupId={post.groupId}
        />
      </div>

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

      {/* Engagement Section */}
      <div className="mt-12 border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <LikeButton slug={slug} locale="ZH" />
      </div>
    </article>

    {/* Comments Section */}
    <div className="mx-auto max-w-3xl px-6 pb-16">
      <CommentsSection slug={slug} locale="ZH" />
    </div>

    {/* Footer */}
    <footer className="mx-auto max-w-3xl border-t border-zinc-200 px-6 pt-8 dark:border-zinc-800">
      <Link
        href="/zh/posts"
        className="text-blue-600 hover:underline dark:text-blue-400"
      >
        ← 返回文章列表
      </Link>
    </footer>
    </>
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

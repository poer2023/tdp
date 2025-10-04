import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PostLocale, PostStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { generateBlogPostingSchema, generateAlternateLinks } from "@/lib/seo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LikeButton } from "@/components/like-button";

// Ensure Node.js runtime for Prisma
export const runtime = "nodejs";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;

  // Only Chinese locale is supported
  if (locale !== "zh") {
    return { title: "Not Found" };
  }

  const post = await prisma.post.findFirst({
    where: {
      locale: PostLocale.ZH,
      slug,
      status: PostStatus.PUBLISHED,
    },
  });

  if (!post) {
    return { title: "Post Not Found" };
  }

  // Find alternate English version
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

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";
  const url = `${baseUrl}/zh/posts/${slug}`;
  const alternateLinks = generateAlternateLinks(PostLocale.ZH, slug, alternateSlug);

  // Use post cover or fallback to default OG image
  const ogImage = post.coverImagePath
    ? `${baseUrl}${post.coverImagePath}`
    : `${baseUrl}/images/placeholder-cover.svg`;

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [ogImage],
      url,
      type: "article",
      locale: "zh_CN",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [ogImage],
    },
    alternates: {
      canonical: url,
      languages: alternateLinks,
    },
  };
}

export default async function LocalizedPostPage({ params }: PageProps) {
  const { locale, slug } = await params;

  // Only Chinese locale is supported under /[locale] namespace currently
  if (locale !== "zh") {
    notFound();
  }

  const post = await prisma.post.findFirst({
    where: {
      locale: PostLocale.ZH,
      slug,
      status: PostStatus.PUBLISHED,
    },
    include: {
      author: {
        select: { name: true, image: true },
      },
    },
  });

  if (!post) {
    notFound();
  }

  // Generate JSON-LD schema for SEO
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";
  const schema = generateBlogPostingSchema(post, `${baseUrl}/zh/posts/${post.slug}`);

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      {/* JSON-LD Schema for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

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
        <h1 className="text-4xl leading-tight font-bold text-zinc-900 md:text-5xl dark:text-zinc-100">
          {post.title}
        </h1>

        <div className="mt-6 flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
          {post.author?.name && <span>{post.author.name}</span>}
          {post.publishedAt && (
            <time dateTime={post.publishedAt.toISOString()}>
              {new Date(post.publishedAt).toLocaleDateString("zh-CN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          )}
          {post.tags && <span className="text-blue-600 dark:text-blue-400">{post.tags}</span>}
        </div>
      </header>

      {post.coverImagePath && (
        <div className="relative mb-12 aspect-video">
          <Image
            src={post.coverImagePath}
            alt={post.title}
            fill
            className="rounded-lg object-cover"
          />
        </div>
      )}

      <div className="prose prose-zinc dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
      </div>

      <footer className="mt-16 flex items-center justify-between border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <Link href="/zh/posts" className="text-blue-600 hover:underline dark:text-blue-400">
          ← 返回文章列表
        </Link>
        <LikeButton slug={post.slug} locale="ZH" />
      </footer>
    </article>
  );
}

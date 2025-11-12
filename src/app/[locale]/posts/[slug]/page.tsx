import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PostLocale, PostStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { generateBlogPostingSchema, generateAlternateLinks } from "@/lib/seo";
import { LikeButton } from "@/components/like-button";
import { cache } from "react";
import { Container } from "@/components/ui/container";

// Ensure Node.js runtime for Prisma
export const runtime = "nodejs";

// Cache the post query to avoid duplicate database calls
const getPostBySlug = cache(async (slug: string, locale: string) => {
  const l = locale === "zh" ? PostLocale.ZH : PostLocale.EN;

  // Find post by slug - try direct match first
  let post = await prisma.post.findFirst({
    where: {
      slug,
      status: PostStatus.PUBLISHED,
    },
    include: {
      author: {
        select: { name: true, image: true },
      },
    },
  });

  // If not found, check if this slug is an alias
  if (!post) {
    const alias = await prisma.postAlias.findUnique({
      where: {
        locale_oldSlug: {
          locale: l,
          oldSlug: slug,
        },
      },
      include: {
        post: {
          include: {
            author: {
              select: { name: true, image: true },
            },
          },
        },
      },
    });

    if (alias?.post && alias.post.status === PostStatus.PUBLISHED) {
      post = alias.post;
    }
  }

  return post;
});

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const l = locale === "zh" ? "zh" : "en";

  // Use cached query to get post data
  const post = await getPostBySlug(slug, locale);

  if (!post) {
    return { title: l === "zh" ? "文章未找到" : "Post Not Found" };
  }

  const postLocale = post.locale;

  // Find alternate language version
  const alternateLocale = postLocale === PostLocale.EN ? PostLocale.ZH : PostLocale.EN;
  let alternateSlug: string | undefined;
  if (post.groupId) {
    const alternatePost = await prisma.post.findFirst({
      where: {
        groupId: post.groupId,
        locale: alternateLocale,
      },
      select: { slug: true },
    });
    alternateSlug = alternatePost?.slug;
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";
  const url = `${baseUrl}/${l}/posts/${slug}`;
  const alternateLinks = generateAlternateLinks(postLocale, slug, alternateSlug);

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
      locale: l === "zh" ? "zh_CN" : "en_US",
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
  const l = locale === "zh" ? "zh" : "en";

  // Use cached query to get post data
  const post = await getPostBySlug(slug, locale);

  if (!post) {
    notFound();
  }

  const postLocale = post.locale;

  // Generate JSON-LD schema for SEO
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";
  const schema = generateBlogPostingSchema(post, `${baseUrl}/${l}/posts/${post.slug}`);

  return (
    <Container width="reading" padding="px-4 py-8 sm:px-6 sm:py-12 md:py-16">
      <article>
        {/* JSON-LD Schema for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />

      {/* Header */}
      <header className="mb-8 sm:mb-10 md:mb-12">
        <h1 className="text-4xl leading-tight font-bold text-zinc-900 md:text-5xl dark:text-zinc-100">
          {post.title}
        </h1>

        <div className="mt-6 flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
          {post.author?.name && <span>{post.author.name}</span>}
          {post.publishedAt && (
            <time dateTime={post.publishedAt.toISOString()}>
              {new Date(post.publishedAt).toLocaleDateString(l === "zh" ? "zh-CN" : "en-US", {
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
        <div className="relative mb-8 aspect-video sm:mb-10 md:mb-12">
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

        <footer className="mt-8 flex items-center justify-between border-t border-zinc-200 pt-6 sm:mt-12 sm:pt-8 md:mt-16 dark:border-zinc-800">
          <Link href={`/${l}/posts`} className="text-blue-600 hover:underline dark:text-blue-400">
            {l === "zh" ? "← 返回文章列表" : "← Back to posts"}
          </Link>
          <LikeButton slug={post.slug} locale={postLocale} />
        </footer>
      </article>
    </Container>
  );
}

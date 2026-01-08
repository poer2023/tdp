import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { PostLocale, PostStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { generateBlogPostingSchema, generateAlternateLinks } from "@/lib/seo";
import { LikeButton } from "@/components/shared/like-button";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { BackButton } from "@/components/back-button";
import { safeJsonLd } from "@/lib/safe-json-ld";
import { cache } from "react";
import { Container } from "@/components/ui/container";
import { ZhiHeader, ZhiFooter } from "@/components/zhi";

// Ensure Node.js runtime for Prisma
export const runtime = "nodejs";
export const dynamic = "auto";
// ISR: Revalidate every 60 seconds for article detail pages
export const revalidate = 60;

// Cache the post query to avoid duplicate database calls
const getPostBySlug = cache(async (slug: string, locale: string) => {
  const l = locale === "zh" ? PostLocale.ZH : PostLocale.EN;

  // Find post by slug - filter by locale to avoid cross-language conflicts
  let post = await prisma.post.findFirst({
    where: {
      slug,
      locale: l,
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
  // Canonical URL: English uses no prefix (matches 301 redirect strategy), Chinese uses /zh prefix
  const url = l === "en" ? `${baseUrl}/posts/${slug}` : `${baseUrl}/${l}/posts/${slug}`;
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
  // URL matches canonical: English no prefix, Chinese with /zh prefix
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";
  const jsonLdUrl = l === "en" ? `${baseUrl}/posts/${post.slug}` : `${baseUrl}/${l}/posts/${post.slug}`;
  const schema = generateBlogPostingSchema(post, jsonLdUrl);

  return (
    <>
      <ZhiHeader />
      <main>
        <Container width="reading" padding="px-4 py-8 sm:px-6 sm:py-12 md:py-16">
          <article>
            {/* JSON-LD Schema for SEO */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
            />

            {/* Header */}
            <header className="mb-8 sm:mb-10 md:mb-12">
              <h1 className="text-4xl leading-tight font-bold text-stone-900 md:text-5xl dark:text-stone-100">
                {post.title}
              </h1>

              <div className="mt-6 flex items-center gap-4 text-sm text-stone-600 dark:text-stone-400">
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

              {/* Language Switcher */}
              <div className="mt-6">
                <LanguageSwitcher
                  currentLocale={postLocale}
                  currentSlug={post.slug}
                  groupId={post.groupId}
                />
              </div>
            </header>

            {post.coverImagePath && (
              <div className="relative mb-8 aspect-video sm:mb-10 md:mb-12">
                <Image
                  src={post.coverImagePath}
                  alt={post.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 768px"
                  className="rounded-lg object-cover"
                  priority
                />
              </div>
            )}

            <div
              className="prose prose-zinc dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            <footer className="mt-8 flex items-center justify-between border-t border-stone-200 pt-6 sm:mt-12 sm:pt-8 md:mt-16 dark:border-stone-800">
              <BackButton
                label={l === "zh" ? "← 返回" : "← Back"}
                fallbackHref={`/${l}`}
              />
              <LikeButton slug={post.slug} locale={postLocale} />
            </footer>
          </article>
        </Container>
      </main>
      <ZhiFooter />
    </>
  );
}

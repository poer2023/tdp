import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { listPublishedPosts } from "@/lib/posts";
import { listMoments } from "@/lib/moments";
import { listHeroImages } from "@/lib/hero";
import { ZhiHomePage } from "@/components/zhi";
import { ZhiHeader, ZhiFooter } from "@/components/zhi";
import type { FeedItem, FeedPost, FeedMoment, FeedCurated } from "@/components/zhi";
import type { HeroImageItem } from "@/components/zhi/hero";
import { getZhiProfile } from "@/lib/zhi-profile";
import prisma from "@/lib/prisma";

// Incremental Static Regeneration for localized homepage
export const runtime = "nodejs";
export const revalidate = 300;
export const dynamicParams = false;

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LocalizedHomePage({ params }: PageProps) {
  const { locale } = await params;

  // Only allow 'en' or 'zh' as locale
  if (locale !== "en" && locale !== "zh") {
    notFound();
  }

  const session = await auth();
  const viewerId = session?.user?.id ?? null;

  // Fetch data for homepage
  const [posts, moments, heroImageUrls, curatedItems] = await Promise.all([
    listPublishedPosts(),
    listMoments({ limit: 20, visibility: "PUBLIC", viewerId }),
    listHeroImages(),
    prisma.shareItem.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  // Transform posts to FeedPost format
  const feedPosts: FeedPost[] = posts.map((post) => {
    const dateObj = post.publishedAt ? new Date(post.publishedAt) : new Date(post.createdAt);
    const dateStr = dateObj.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    // Calculate read time (rough estimate: 200 words per minute)
    const wordCount = post.content.split(/\s+/).length;
    const readTime = Math.max(1, Math.ceil(wordCount / 200));

    return {
      id: post.id,
      type: "article" as const,
      title: post.title,
      excerpt: post.excerpt,
      category: post.tags?.[0] || (locale === "zh" ? "文章" : "Article"),
      date: dateStr,
      readTime: locale === "zh" ? `${readTime} 分钟` : `${readTime} min read`,
      imageUrl: post.coverImagePath || undefined,
      tags: post.tags || [],
      likes: post.viewCount || 0,
      slug: post.slug,
      sortKey: dateObj.getTime(),
    };
  });

  // Transform moments to FeedMoment format
  const feedMoments: FeedMoment[] = moments.map((moment) => {
    const createdAt = new Date(moment.createdAt);
    const dateStr = createdAt.toLocaleDateString(
      locale === "zh" ? "zh-CN" : "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );

    return {
      id: moment.id,
      type: "moment" as const,
      content: moment.content,
      images: moment.images?.map((img) => img.previewUrl || img.url) || [],
      date: dateStr,
      tags: moment.tags || [],
      likes: moment.likeCount ?? 0,
      liked: Boolean(moment.likedByViewer),
      author: moment.author ? { name: moment.author.name, image: moment.author.image } : undefined,
      sortKey: createdAt.getTime(),
    };
  });

  // Transform curated items to FeedCurated format
  const feedCurated: FeedCurated[] = curatedItems.map((item) => {
    const createdAt = new Date(item.createdAt);
    const dateStr = createdAt.toLocaleDateString(
      locale === "zh" ? "zh-CN" : "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );

    return {
      id: item.id,
      type: "curated" as const,
      title: item.title,
      description: item.description,
      url: item.url,
      domain: item.domain,
      imageUrl: item.imageUrl || undefined,
      date: dateStr,
      tags: item.tags || [],
      likes: item.likes,
      sortKey: createdAt.getTime(),
    };
  });

  // Combine and sort by timestamp (newest first)
  const feedItems: FeedItem[] = [...feedPosts, ...feedMoments, ...feedCurated].sort(
    (a, b) => (b.sortKey ?? 0) - (a.sortKey ?? 0)
  );

  // Transform hero image URLs to HeroImageItem format
  // Default to gallery type since they come from admin-selected hero images
  const heroImages: HeroImageItem[] = heroImageUrls.map((url) => ({
    src: url,
    href: `/${locale}/gallery`,
    type: "gallery" as const,
  }));

  return (
    <>
      <ZhiHeader />
      <main>
        <ZhiHomePage
          feedItems={feedItems}
          heroImages={heroImages.length > 0 ? heroImages : undefined}
          profileData={getZhiProfile(locale === "zh" ? "zh" : "en")}
        />
      </main>
      <ZhiFooter />
    </>
  );
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}

import { notFound } from "next/navigation";
import { listPublishedPostSummaries } from "@/lib/posts";
import { listMoments } from "@/lib/moments";
import { listHeroImages } from "@/lib/hero";
import { listCuratedItems } from "@/lib/curated";
import { ZhiHomePage } from "@/components/zhi";
import { ZhiHeader, ZhiFooter } from "@/components/zhi";
import type { FeedItem, FeedPost, FeedMoment, FeedCurated } from "@/components/zhi";
import type { HeroImageItem } from "@/components/zhi/hero";
import { getZhiProfile } from "@/lib/zhi-profile";
import { getAtAGlanceStatus, formatRelativeTime } from "@/lib/user-status";
import { getMomentImageUrl } from "@/lib/moment-images";

// ISR: Revalidate every 60 seconds for fresh content with CDN caching
export const runtime = "nodejs";
export const revalidate = 60;
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

  // ISR: Fetch public data only (no auth, no viewerId)
  // Client-side will hydrate user's like states via useMomentLikes hook
  // All data fetching uses unstable_cache for reduced DB load during ISR rebuilds
  const [posts, moments, heroImageUrls, curatedItems, statusData] = await Promise.all([
    listPublishedPostSummaries({ limit: 20 }),
    listMoments({ limit: 12, visibility: "PUBLIC" }),
    listHeroImages(),
    listCuratedItems(12),
    getAtAGlanceStatus(),
  ]);

  // Transform posts to FeedPost format
  const feedPosts: FeedPost[] = posts.map((post) => {
    const dateObj = post.publishedAt ? new Date(post.publishedAt) : new Date(post.createdAt);
    const dateStr = dateObj.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    // Estimate read time using excerpt length (content未加载以减轻payload)
    const wordCount = Math.max(30, (post.excerpt || post.title).split(/\s+/).length * 2);
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
      // Pass image objects with url, mediumUrl, w, h for proper display
      images: moment.images?.map((img) => ({
        url: getMomentImageUrl(img, "small"),
        mediumUrl: getMomentImageUrl(img, "medium"),
        w: img.w,
        h: img.h,
      })) || [],
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
      description: item.description ?? "",
      url: item.url,
      domain: item.domain ?? "",
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
          statusData={{
            items: statusData.items,
            updatedAt: formatRelativeTime(statusData.updatedAt, locale),
          }}
        />
      </main>
      <ZhiFooter />
    </>
  );
}

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

// ISR: Force static generation for CDN caching
// This ensures cache-control is not "no-store" and page can be cached at edge
export const runtime = "nodejs";
export const dynamic = "force-static";
export const revalidate = 60;
export const dynamicParams = false;

// Generate static params for both locales - ensures pages are pre-rendered
export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}

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
  const [posts, moments, heroItems, curatedItems, statusData] = await Promise.all([
    listPublishedPostSummaries({ limit: 8 }),
    listMoments({ limit: 6, visibility: "PUBLIC" }),
    listHeroImages(),
    listCuratedItems(6),
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
      // Only pass first image for card display - full images loaded in detail view
      images: moment.images?.slice(0, 1).map((img) => ({
        url: getMomentImageUrl(img, "small"),
        w: img.w,
        h: img.h,
      })) || [],
      // Pass first video for card display with autoplay preview
      videos: moment.videos?.slice(0, 1).map((video) => ({
        url: video.url,
        previewUrl: video.previewUrl || video.url,
        thumbnailUrl: video.thumbnailUrl || "",
        duration: video.duration || 0,
        w: video.w,
        h: video.h,
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

  // Transform hero items to HeroImageItem format (supports images and videos)
  const heroImages: HeroImageItem[] = heroItems.map((item) => ({
    src: item.url,
    href: `/${locale}/gallery`,
    type: "gallery" as const,
    mediaType: item.mediaType,
    videoSrc: item.videoUrl || undefined,
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

import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { listPublishedPosts } from "@/lib/posts";
import { listMoments } from "@/lib/moments";
import { listHeroImages } from "@/lib/hero";
import { LuminaHomePage } from "@/components/lumina";
import { LuminaHeader, LuminaFooter } from "@/components/lumina";
import type { FeedItem, FeedPost, FeedMoment } from "@/components/lumina";
import { getLuminaProfile } from "@/lib/lumina-profile";

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
  const [posts, moments, heroImages] = await Promise.all([
    listPublishedPosts(),
    listMoments({ limit: 20, visibility: "PUBLIC", viewerId }),
    listHeroImages(),
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
      sortKey: createdAt.getTime(),
    };
  });

  // Combine and sort by timestamp (newest first)
  const feedItems: FeedItem[] = [...feedPosts, ...feedMoments].sort(
    (a, b) => (b.sortKey ?? 0) - (a.sortKey ?? 0)
  );

  // Hero images already fetched from HeroImage table via listHeroImages()
  // Returns array of URLs directly, no transformation needed

  return (
    <>
      <LuminaHeader />
      <main>
        <LuminaHomePage
          feedItems={feedItems}
          heroImages={heroImages.length > 0 ? heroImages : undefined}
          profileData={getLuminaProfile(locale === "zh" ? "zh" : "en")}
        />
      </main>
      <LuminaFooter />
    </>
  );
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}

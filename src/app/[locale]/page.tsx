import { notFound } from "next/navigation";
import { listPublishedPosts, parseTags } from "@/lib/posts";
import { listMoments } from "@/lib/moments";
import { listGalleryImages } from "@/lib/gallery";
import { LuminaHomePage } from "@/components/lumina";
import { LuminaHeader, LuminaFooter } from "@/components/lumina";
import type { FeedItem, FeedPost, FeedMoment } from "@/components/lumina";

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

  // Fetch data for homepage
  const [posts, moments, galleryImages] = await Promise.all([
    listPublishedPosts(),
    listMoments({ limit: 20, visibility: "PUBLIC" }),
    listGalleryImages(16),
  ]);

  // Transform posts to FeedPost format
  const feedPosts: FeedPost[] = posts.map((post) => {
    const dateStr = post.publishedAt
      ? new Date(post.publishedAt).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "";

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
    };
  });

  // Transform moments to FeedMoment format
  const feedMoments: FeedMoment[] = moments.map((moment) => {
    const dateStr = new Date(moment.createdAt).toLocaleDateString(
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
      images: moment.images?.map((img) => img.url) || [],
      date: dateStr,
      tags: moment.tags || [],
      likes: 0, // Moments don't have likes in current schema
    };
  });

  // Combine and sort by date (interleave posts and moments)
  const feedItems: FeedItem[] = [...feedPosts, ...feedMoments].sort((a, b) => {
    // Simple sort by date string - for more accurate sorting, convert to Date objects
    return 0.5 - Math.random(); // Shuffle for now, similar to tdppro demo
  });

  // Get hero images from gallery
  const heroImages =
    galleryImages.length > 0
      ? galleryImages.map((img) => img.smallThumbPath || img.filePath)
      : undefined;

  return (
    <>
      <LuminaHeader />
      <main>
        <LuminaHomePage
          feedItems={feedItems}
          heroImages={heroImages}
          profileData={{
            name: "BaoZhi",
            title: locale === "zh" ? "产品经理" : "Product Manager",
            bio:
              locale === "zh"
                ? "把混乱变成路线图。痴迷于用户体验、数据和完美的咖啡。"
                : "Turning chaos into roadmaps. Obsessed with UX, data, and the perfect cup of coffee.",
          }}
        />
      </main>
      <LuminaFooter />
    </>
  );
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}

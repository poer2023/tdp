import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCuratedItemById, getRelatedCuratedItems } from "@/lib/curated";
import { ZhiHeader, ZhiFooter } from "@/components/zhi";
import CuratedDetailContent from "./curated-detail-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 300;

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id, locale } = await params;

  // Use cached function (same cache key as page content)
  const item = await getCuratedItemById(id);

  if (!item) {
    return {
      title: locale === "zh" ? "未找到" : "Not Found",
    };
  }

  return {
    title: item.title,
    description: item.description,
    openGraph: {
      title: item.title,
      description: item.description ?? undefined,
      type: "article",
      images: item.imageUrl ? [item.imageUrl] : undefined,
    },
  };
}

export default async function CuratedDetailPage({ params }: PageProps) {
  const { locale, id } = await params;

  // Validate locale
  if (locale !== "en" && locale !== "zh") {
    notFound();
  }

  // Fetch the curated item (cached)
  const item = await getCuratedItemById(id);

  if (!item) {
    notFound();
  }

  // Get related items (cached)
  const relatedItems = await getRelatedCuratedItems(id, item.tags, 4);

  return (
    <>
      <ZhiHeader />
      <main className="min-h-screen bg-stone-50 dark:bg-[#0a0a0b]">
        <CuratedDetailContent
          item={{
            id: item.id,
            title: item.title,
            description: item.description ?? "",
            url: item.url,
            domain: item.domain ?? "",
            imageUrl: item.imageUrl || undefined,
            tags: item.tags,
            likes: item.likes,
            createdAt: item.createdAt.toISOString(),
          }}
          relatedItems={relatedItems.map((r) => ({
            id: r.id,
            title: r.title,
            description: r.description ?? "",
            url: r.url,
            domain: r.domain ?? "",
            imageUrl: r.imageUrl || undefined,
            tags: r.tags,
            likes: r.likes,
            createdAt: r.createdAt.toISOString(),
          }))}
          locale={locale as "en" | "zh"}
        />
      </main>
      <ZhiFooter />
    </>
  );
}


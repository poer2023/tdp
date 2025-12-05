import { notFound } from "next/navigation";
import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { LuminaHeader, LuminaFooter } from "@/components/lumina";
import CuratedDetailContent from "./curated-detail-content";

export const runtime = "nodejs";
export const revalidate = 300;

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id, locale } = await params;

  const item = await prisma.shareItem.findUnique({
    where: { id },
  });

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
      description: item.description,
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

  // Fetch the curated item
  const item = await prisma.shareItem.findUnique({
    where: { id },
  });

  if (!item) {
    notFound();
  }

  // Get related items (same tags or recent)
  const relatedItems = await prisma.shareItem.findMany({
    where: {
      id: { not: item.id },
      OR: [
        { tags: { hasSome: item.tags } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  // If not enough related items, fill with recent ones
  let finalRelatedItems = relatedItems;
  if (relatedItems.length < 4) {
    const recentItems = await prisma.shareItem.findMany({
      where: {
        id: { notIn: [item.id, ...relatedItems.map(r => r.id)] },
      },
      orderBy: { createdAt: "desc" },
      take: 4 - relatedItems.length,
    });
    finalRelatedItems = [...relatedItems, ...recentItems];
  }

  return (
    <>
      <LuminaHeader />
      <main className="min-h-screen bg-stone-50 dark:bg-[#0a0a0b]">
        <CuratedDetailContent
          item={{
            id: item.id,
            title: item.title,
            description: item.description,
            url: item.url,
            domain: item.domain,
            imageUrl: item.imageUrl || undefined,
            tags: item.tags,
            likes: item.likes,
            createdAt: item.createdAt.toISOString(),
          }}
          relatedItems={finalRelatedItems.map((r) => ({
            id: r.id,
            title: r.title,
            description: r.description,
            url: r.url,
            domain: r.domain,
            imageUrl: r.imageUrl || undefined,
            tags: r.tags,
            likes: r.likes,
            createdAt: r.createdAt.toISOString(),
          }))}
          locale={locale as "en" | "zh"}
        />
      </main>
      <LuminaFooter />
    </>
  );
}


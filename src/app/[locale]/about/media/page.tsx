import type { Metadata } from "next";
import { Suspense } from "react";
import { MediaDetailPage } from "@/components/about/media-detail-page";
import { SkeletonGrid } from "@/components/about/skeleton-card";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: locale === "zh" ? "娱乐动态 - 最近观影" : "Entertainment - Recently Watched",
    description:
      locale === "zh"
        ? "Hao 最近观看的电影和剧集记录"
        : "Hao's recent movie and TV show watching history",
  };
}

function MediaLoadingFallback() {
  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 sm:py-12 md:px-12 md:py-16">
      <div className="space-y-8">
        <SkeletonGrid count={3} />
        <SkeletonGrid count={5} />
      </div>
    </div>
  );
}

export default async function MediaPage({ params }: PageProps) {
  const { locale } = await params;
  const l = locale === "zh" ? "zh" : "en";

  return (
    <Suspense fallback={<MediaLoadingFallback />}>
      <MediaDetailPage locale={l} />
    </Suspense>
  );
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}

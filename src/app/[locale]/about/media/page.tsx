import type { Metadata } from "next";
import { MediaDetailPage } from "@/components/about/media-detail-page";

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

export default async function MediaPage({ params }: PageProps) {
  const { locale } = await params;
  const l = locale === "zh" ? "zh" : "en";

  return <MediaDetailPage locale={l} />;
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}

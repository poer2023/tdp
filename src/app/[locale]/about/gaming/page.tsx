import type { Metadata } from "next";
import { GamingDetailPage } from "@/components/about/gaming-detail-page";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: locale === "zh" ? "游戏活动" : "Gaming Activity",
    description:
      locale === "zh" ? "游戏记录、游戏时长和成就" : "Gaming history, playtime, and achievements",
  };
}

export default async function GamingPage({ params }: PageProps) {
  const { locale } = await params;
  const l = locale === "zh" ? "zh" : "en";

  return <GamingDetailPage locale={l} />;
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}

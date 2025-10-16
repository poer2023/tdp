import type { Metadata } from "next";
import { LiveDashboard } from "@/components/about/live-dashboard";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: locale === "zh" ? "实时动态" : "Live Dashboard",
    description:
      locale === "zh"
        ? "查看 Hao 的实时活动 - 娱乐、游戏、开发、基础设施等"
        : "View Hao's live activity - entertainment, gaming, development, infrastructure and more",
  };
}

export default async function LiveDashboardPage({ params }: PageProps) {
  const { locale } = await params;
  const l = locale === "zh" ? "zh" : "en";

  return <LiveDashboard locale={l} />;
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}

import type { Metadata } from "next";
import { ZhiHeader, ZhiFooter, ZhiStatsDashboard } from "@/components/zhi";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: locale === "zh" ? "生活记录" : "Life Log",
    description:
      locale === "zh"
        ? "查看 Hao 的生活数据 - 摄影、娱乐、游戏、开发等"
        : "View Hao's life data - photography, entertainment, gaming, development and more",
  };
}

export default async function LiveDashboardPage({ params }: PageProps) {
  const { locale: _locale } = await params;

  return (
    <>
      <ZhiHeader />
      <main className="min-h-screen bg-stone-50 dark:bg-stone-950">
        <ZhiStatsDashboard />
      </main>
      <ZhiFooter />
    </>
  );
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}

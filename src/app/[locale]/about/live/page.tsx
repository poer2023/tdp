import type { Metadata } from "next";
import nextDynamic from "next/dynamic";
import { ZhiHeader, ZhiFooter } from "@/components/zhi";
import { getDashboardStats } from "@/lib/dashboard-stats";

// ISR: Revalidate every 5 minutes (dashboard data doesn't need to be real-time)
export const dynamic = "force-dynamic";
export const revalidate = 300;

// Dynamic import to avoid bundling recharts (~370KB) in common chunks
const ZhiStatsDashboard = nextDynamic(
  () => import("@/components/zhi/stats-dashboard").then((mod) => mod.ZhiStatsDashboard),
  {
    loading: () => (
      <div className="w-full animate-pulse pb-16">
        {/* Header skeleton */}
        <div className="mb-8 border-b border-stone-200 bg-white px-4 pb-16 pt-12 dark:border-stone-800 dark:bg-stone-900">
          <div className="mx-auto max-w-5xl text-center">
            <div className="mx-auto mb-6 h-12 w-12 rounded-full bg-stone-100 dark:bg-stone-800" />
            <div className="mx-auto mb-4 h-10 w-48 rounded bg-stone-100 dark:bg-stone-800" />
            <div className="mx-auto h-6 w-72 rounded bg-stone-100 dark:bg-stone-800" />
          </div>
        </div>
        {/* Cards skeleton */}
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="col-span-1 h-80 rounded-2xl bg-stone-200 md:col-span-2 dark:bg-stone-800" />
          <div className="h-64 rounded-2xl bg-stone-100 dark:bg-stone-800" />
          <div className="col-span-1 h-48 rounded-2xl bg-stone-100 md:col-span-2 dark:bg-stone-800" />
          <div className="h-48 rounded-2xl bg-stone-100 dark:bg-stone-800" />
        </div>
      </div>
    ),
  }
);

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

  // Fetch stats server-side to eliminate CLS from client-side loading
  const stats = await getDashboardStats();

  return (
    <>
      <ZhiHeader />
      <main className="min-h-screen bg-stone-50 dark:bg-stone-950">
        <ZhiStatsDashboard stats={stats} />
      </main>
      <ZhiFooter />
    </>
  );
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}


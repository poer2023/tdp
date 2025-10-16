"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Film,
  Gamepad2,
  Code,
  Server,
  BookOpen,
  MessageCircle,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import type { LiveHighlightsData } from "@/types/live-data";
import { StatCard } from "./stat-card";
import { SkeletonGrid } from "./skeleton-card";

interface LiveDashboardProps {
  locale: "en" | "zh";
}

export function LiveDashboard({ locale }: LiveDashboardProps) {
  const [data, setData] = useState<LiveHighlightsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/about/highlights")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch highlights:", error);
        setLoading(false);
      });
  }, [locale]);

  const t =
    locale === "zh"
      ? {
          title: "实时动态仪表盘",
          backToAbout: "返回关于页",
          overview: "概览",
          subtitle: "查看所有实时活动数据和统计信息",
          lastUpdated: "最后更新",
          loading: "加载中...",
          noData: "暂无数据",
        }
      : {
          title: "Live Activity Dashboard",
          backToAbout: "Back to About",
          overview: "Overview",
          subtitle: "View all live activity data and statistics",
          lastUpdated: "Last updated",
          loading: "Loading...",
          noData: "No data available",
        };

  const formatTimestamp = (date: Date) => {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 1) return locale === "zh" ? "刚刚" : "just now";
    if (minutes < 60) return locale === "zh" ? `${minutes} 分钟前` : `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    return locale === "zh" ? `${hours} 小时前` : `${hours} hours ago`;
  };

  const iconMap = {
    "🎬": <Film className="h-6 w-6" />,
    "🎮": <Gamepad2 className="h-6 w-6" />,
    "💻": <Code className="h-6 w-6" />,
    "🖥️": <Server className="h-6 w-6" />,
    "📚": <BookOpen className="h-6 w-6" />,
    "💬": <MessageCircle className="h-6 w-6" />,
    "💰": <Wallet className="h-6 w-6" />,
  };

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 sm:py-12 md:px-12 md:py-16">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/${locale}/about`}
          className="inline-flex items-center gap-2 text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.backToAbout}
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-neutral-900 sm:text-4xl dark:text-neutral-100">
          📊 {t.title}
        </h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">{t.subtitle}</p>
      </div>

      {loading ? (
        <div>
          <SkeletonGrid count={4} />
        </div>
      ) : !data ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-12 text-center dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-neutral-600 dark:text-neutral-400">{t.noData}</p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Overview Cards */}
          <section>
            <h2 className="mb-6 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              {t.overview}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {data.highlights.map((highlight) => (
                <StatCard
                  key={highlight.module}
                  icon={iconMap[highlight.icon as keyof typeof iconMap] || highlight.icon}
                  title={highlight.title}
                  subtitle={highlight.subtitle}
                  value={highlight.value}
                  trend={highlight.trend}
                  href={`/${locale}${highlight.href}`}
                />
              ))}
            </div>
          </section>

          {/* Coming Soon - Activity Feed */}
          <section>
            <h2 className="mb-6 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              🔥 Recent Activity
            </h2>
            <div className="rounded-xl border border-neutral-200 bg-white p-12 text-center dark:border-neutral-800 dark:bg-neutral-900">
              <div className="mb-4 text-4xl">🚧</div>
              <p className="text-neutral-600 dark:text-neutral-400">
                {locale === "zh" ? "活动时间轴功能即将上线..." : "Activity feed coming soon..."}
              </p>
            </div>
          </section>

          {/* Last Updated */}
          <div className="text-center text-sm text-neutral-500">
            {t.lastUpdated}: {formatTimestamp(data.lastUpdated)}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Container } from "@/components/ui/container";
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadHighlights() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/about/highlights");
        if (!response.ok) {
          throw new Error(`Failed to load highlights: ${response.status}`);
        }

        const payload = (await response.json()) as Partial<LiveHighlightsData>;

        if (!isMounted) return;

        if (!payload?.highlights || !Array.isArray(payload.highlights)) {
          throw new Error("Invalid highlights payload");
        }

        setData({
          highlights: payload.highlights,
          lastUpdated: payload.lastUpdated ? new Date(payload.lastUpdated) : new Date(),
        });
      } catch (err) {
        if (!isMounted) return;
        console.error("Failed to fetch highlights:", err);
        setData(null);
        const message =
          locale === "zh"
            ? "无法加载最新动态，请稍后再试。"
            : "Unable to load live activity data right now. Please try again later.";
        setError(message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadHighlights();

    return () => {
      isMounted = false;
    };
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
          error: "无法加载最新动态，请稍后再试。",
        }
      : {
          title: "Live Activity Dashboard",
          backToAbout: "Back to About",
          overview: "Overview",
          subtitle: "View all live activity data and statistics",
          lastUpdated: "Last updated",
          loading: "Loading...",
          noData: "No data available",
          error: "Unable to load live activity data right now. Please try again later.",
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
    <Container width="dashboard" className="min-h-screen" padding="px-4 py-8 sm:px-6 sm:py-12 md:px-12 md:py-16">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/${locale}/about`}
          className="inline-flex items-center gap-2 text-sm text-stone-600 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.backToAbout}
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-stone-900 sm:text-4xl dark:text-stone-100">
          📊 {t.title}
        </h1>
        <p className="mt-2 text-stone-600 dark:text-stone-400">{t.subtitle}</p>
      </div>

      {loading ? (
        <div>
          <SkeletonGrid count={4} />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-stone-200 bg-white p-12 text-center dark:border-stone-800 dark:bg-stone-900">
          <p className="text-stone-600 dark:text-stone-400">{error || t.error}</p>
        </div>
      ) : !data ? (
        <div className="rounded-xl border border-stone-200 bg-white p-12 text-center dark:border-stone-800 dark:bg-stone-900">
          <p className="text-stone-600 dark:text-stone-400">{t.noData}</p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Overview Cards */}
          <section>
            <h2 className="mb-6 text-xl font-semibold text-stone-900 dark:text-stone-100">
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
            <h2 className="mb-6 text-xl font-semibold text-stone-900 dark:text-stone-100">
              🔥 Recent Activity
            </h2>
            <div className="rounded-xl border border-stone-200 bg-white p-12 text-center dark:border-stone-800 dark:bg-stone-900">
              <div className="mb-4 text-4xl">🚧</div>
              <p className="text-stone-600 dark:text-stone-400">
                {locale === "zh" ? "活动时间轴功能即将上线..." : "Activity feed coming soon..."}
              </p>
            </div>
          </section>

          {/* Last Updated */}
          <div className="text-center text-sm text-stone-500">
            {t.lastUpdated}: {formatTimestamp(data.lastUpdated)}
          </div>
        </div>
      )}
    </Container>
  );
}

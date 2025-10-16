"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Film, Gamepad2, Code, Server } from "lucide-react";
import type { LiveHighlightsData } from "@/types/live-data";

interface LiveHighlightsSectionProps {
  locale: "en" | "zh";
}

export function LiveHighlightsSection({ locale }: LiveHighlightsSectionProps) {
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
        console.error("Failed to fetch live highlights:", error);
        setLoading(false);
      });
  }, []);

  const t =
    locale === "zh"
      ? {
          title: "实时动态",
          subtitle: "最近的娱乐、游戏和开发活动",
          viewDashboard: "查看完整仪表盘",
          loading: "加载中...",
        }
      : {
          title: "Live Updates",
          subtitle: "Recent entertainment, gaming, and development activity",
          viewDashboard: "View Full Dashboard",
          loading: "Loading...",
        };

  const iconMap = {
    "🎬": <Film className="h-5 w-5" />,
    "🎮": <Gamepad2 className="h-5 w-5" />,
    "💻": <Code className="h-5 w-5" />,
    "🖥️": <Server className="h-5 w-5" />,
  };

  const localePath = (path: string) => `/${locale}${path}`;

  if (loading) {
    return (
      <section className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-baseline md:justify-between">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{t.title}</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{t.subtitle}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-zinc-200 bg-white/70 p-6 dark:border-zinc-800 dark:bg-zinc-950/70"
            >
              <div className="mb-4 h-10 w-10 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="mt-3 h-8 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="mt-2 h-4 w-40 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!data || data.highlights.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-baseline md:justify-between">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{t.title}</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{t.subtitle}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.highlights.map((highlight) => (
          <Link
            key={highlight.module}
            href={localePath(highlight.href)}
            className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white/70 p-6 shadow-[0_8px_24px_-12px_rgba(39,39,42,0.25)] backdrop-blur transition-all hover:shadow-[0_12px_32px_-8px_rgba(39,39,42,0.35)] dark:border-zinc-800 dark:bg-zinc-950/70"
          >
            {/* Icon */}
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 transition-colors group-hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:group-hover:bg-zinc-800">
              {iconMap[highlight.icon as keyof typeof iconMap] || (
                <span className="text-xl">{highlight.icon}</span>
              )}
            </div>

            {/* Content */}
            <div className="space-y-1">
              <p className="text-sm font-medium tracking-[0.2em] text-zinc-500 uppercase dark:text-zinc-400">
                {highlight.title}
              </p>
              <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                {highlight.value}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{highlight.subtitle}</p>
            </div>

            {/* Hover arrow */}
            <div className="absolute top-4 right-4 opacity-0 transition-opacity group-hover:opacity-100">
              <ArrowRight className="h-5 w-5 text-zinc-400" />
            </div>
          </Link>
        ))}
      </div>

      {/* View Full Dashboard Button */}
      <div className="pt-4 text-center">
        <Link
          href={localePath("/about/live")}
          className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/70 px-6 py-3 text-sm font-semibold text-zinc-900 backdrop-blur transition-all hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-50 dark:hover:bg-zinc-900"
        >
          {t.viewDashboard}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

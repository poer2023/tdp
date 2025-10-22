"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Film, Gamepad2, Code, Server } from "lucide-react";
import type { LiveHighlightsData } from "@/types/live-data";

interface LiveHighlightsSectionProps {
  locale: "en" | "zh";
  initialHighlights?: LiveHighlightsData;
}

type SyncStatus = {
  platform: string;
  lastSyncAt: string | null;
  status: string;
};

export function LiveHighlightsSection({ locale, initialHighlights }: LiveHighlightsSectionProps) {
  // Render highlights instantly via SSR-provided data
  const [data, setData] = useState<LiveHighlightsData | null>(initialHighlights ?? null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus[]>([]);
  const [syncLoading, setSyncLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // Revalidate highlights in background without blocking UI
    const refreshHighlights = async () => {
      try {
        const res = await fetch("/api/about/highlights", { cache: "no-store" });
        if (!res.ok) return;
        const fresh = await res.json();
        if (!cancelled) setData(fresh);
      } catch (error) {
        console.error("Failed to refresh highlights:", error);
      }
    };

    // Load sync status separately; do not block highlights
    const loadSync = async () => {
      try {
        const res = await fetch("/api/about/sync-status", { cache: "no-store" });
        const payload = await res.json();
        if (!cancelled) setSyncStatus(payload.platforms || []);
      } catch (error) {
        console.error("Failed to load sync status:", error);
      } finally {
        if (!cancelled) setSyncLoading(false);
      }
    };

    refreshHighlights();
    loadSync();

    return () => {
      cancelled = true;
    };
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

  if (!data) {
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

      {/* Sync Status Indicator */}
      {/* Sync status (loads progressively) */}
      {syncLoading ? (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="h-4 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
      ) : syncStatus.length > 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="flex items-center justify-between">
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {locale === "zh" ? "数据同步状态" : "Data Sync Status"}
            </div>
            <div className="flex gap-3">
              {syncStatus.map((status) => {
                const isFresh =
                  status.lastSyncAt &&
                  new Date().getTime() - new Date(status.lastSyncAt).getTime() <
                    24 * 60 * 60 * 1000;

                return (
                  <div
                    key={status.platform}
                    className="flex items-center gap-1.5 text-xs"
                    title={
                      status.lastSyncAt
                        ? `Last synced: ${new Date(status.lastSyncAt).toLocaleString()}`
                        : "Never synced"
                    }
                  >
                    <div
                      className={`h-2 w-2 rounded-full ${
                        isFresh
                          ? "bg-green-500 dark:bg-green-400"
                          : "bg-yellow-500 dark:bg-yellow-400"
                      }`}
                    />
                    <span className="text-zinc-600 capitalize dark:text-zinc-400">
                      {status.platform}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

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

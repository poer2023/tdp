"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Film, Tv } from "lucide-react";
import Link from "next/link";
import type { MediaData } from "@/types/live-data";
import { MoviePosterCard } from "./movie-poster-card";
import { ProgressBar } from "./progress-bar";
import { StatCard } from "./stat-card";
import { SkeletonGrid } from "./skeleton-card";

interface MediaDetailPageProps {
  locale: "en" | "zh";
}

export function MediaDetailPage({ locale }: MediaDetailPageProps) {
  const [data, setData] = useState<MediaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "movie" | "series">("all");

  useEffect(() => {
    fetch("/api/about/live/media")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch media data:", error);
        setLoading(false);
      });
  }, []);

  const t =
    locale === "zh"
      ? {
          title: "娱乐动态",
          backToDashboard: "返回仪表盘",
          statsOverview: "统计概览",
          thisWeek: "本周",
          thisMonth: "本月",
          thisYear: "今年",
          movies: "电影",
          series: "剧集",
          totalHours: "总时长",
          totalItems: "总数",
          recentlyWatched: "最近观看",
          currentlyWatching: "追剧中",
          all: "全部",
          moviesOnly: "仅电影",
          seriesOnly: "仅剧集",
          loading: "加载中...",
          noData: "暂无数据",
          episodesLeft: "集剩余",
          continue: "继续观看",
          hours: "小时",
          items: "项",
        }
      : {
          title: "Entertainment Hub",
          backToDashboard: "Back to Dashboard",
          statsOverview: "Stats Overview",
          thisWeek: "This Week",
          thisMonth: "This Month",
          thisYear: "This Year",
          movies: "movies",
          series: "series",
          totalHours: "Total Hours",
          totalItems: "Total Items",
          recentlyWatched: "Recently Watched",
          currentlyWatching: "Currently Watching",
          all: "All",
          moviesOnly: "Movies",
          seriesOnly: "TV Shows",
          loading: "Loading...",
          noData: "No data available",
          episodesLeft: "episodes left",
          continue: "Continue →",
          hours: "hrs",
          items: "items",
        };

  const filteredItems = data?.recentlyWatched.filter((item) => {
    if (filter === "all") return true;
    return item.type === filter;
  });

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 sm:py-12 md:px-12 md:py-16">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/${locale}/about/live`}
          className="inline-flex items-center gap-2 text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.backToDashboard}
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-neutral-900 sm:text-4xl dark:text-neutral-100">
          🎬 {t.title}
        </h1>
      </div>

      {loading ? (
        <div className="space-y-8">
          <SkeletonGrid count={3} />
          <SkeletonGrid count={5} />
        </div>
      ) : !data ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-12 text-center dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-neutral-600 dark:text-neutral-400">{t.noData}</p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Stats Overview */}
          <section>
            <h2 className="mb-6 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              {t.statsOverview}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                icon={<Film className="h-6 w-6" />}
                title={t.thisWeek}
                subtitle={`${data.stats.thisWeek.movies} ${t.movies}, ${data.stats.thisWeek.series} ${t.series}`}
                value={data.stats.thisWeek.movies + data.stats.thisWeek.series}
              />
              <StatCard
                icon={<Tv className="h-6 w-6" />}
                title={t.thisMonth}
                subtitle={`${data.stats.thisMonth.movies} ${t.movies}, ${data.stats.thisMonth.series} ${t.series}`}
                value={data.stats.thisMonth.movies + data.stats.thisMonth.series}
              />
              <StatCard
                icon="📊"
                title={t.thisYear}
                subtitle={`${data.stats.thisYear.totalHours} ${t.hours}, ${data.stats.thisYear.totalItems} ${t.items}`}
                value={data.stats.thisYear.totalItems}
              />
            </div>
          </section>

          {/* Currently Watching Series */}
          {data.currentlyWatching.length > 0 && (
            <section>
              <h2 className="mb-6 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                📺 {t.currentlyWatching}
              </h2>
              <div className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
                {data.currentlyWatching.map((item) => (
                  <div key={item.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                          {item.title}
                        </h3>
                        <p className="text-sm text-neutral-500">
                          S{item.season?.toString().padStart(2, "0")}E
                          {item.episode?.toString().padStart(2, "0")}
                        </p>
                      </div>
                      <span className="text-sm text-neutral-500">{t.continue}</span>
                    </div>
                    <ProgressBar progress={item.progress || 0} showPercentage color="purple" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recently Watched */}
          <section>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                🎞️ {t.recentlyWatched}
              </h2>
              {/* Filter buttons */}
              <div className="flex gap-2">
                {(["all", "movie", "series"] as const).map((filterType) => (
                  <button
                    key={filterType}
                    onClick={() => setFilter(filterType)}
                    className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
                      filter === filterType
                        ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
                    }`}
                  >
                    {filterType === "all" && t.all}
                    {filterType === "movie" && t.moviesOnly}
                    {filterType === "series" && t.seriesOnly}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filteredItems?.map((item) => (
                <MoviePosterCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

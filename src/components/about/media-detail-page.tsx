"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Film, Tv, Loader2 } from "lucide-react";
import Link from "next/link";
import type { MediaData, MediaApiParams } from "@/types/live-data";
import { MoviePosterCard } from "./movie-poster-card";
import { ProgressBar } from "./progress-bar";
import { StatCard } from "./stat-card";
import { SkeletonGrid } from "./skeleton-card";
import { MediaFilters } from "./media-filters";

interface MediaDetailPageProps {
  locale: "en" | "zh";
}

export function MediaDetailPage({ locale }: MediaDetailPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Filter states
  const [platform, setPlatform] = useState<MediaApiParams["platform"]>(
    (searchParams.get("platform") as MediaApiParams["platform"]) || "all"
  );
  const [dateRange, setDateRange] = useState<MediaApiParams["dateRange"]>(
    (searchParams.get("dateRange") as MediaApiParams["dateRange"]) || "all"
  );
  const [completion, setCompletion] = useState<MediaApiParams["completion"]>(
    (searchParams.get("completion") as MediaApiParams["completion"]) || "all"
  );
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");

  // Data states
  const [data, setData] = useState<MediaData | null>(null);
  const [allItems, setAllItems] = useState<MediaData["items"]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Update URL params when filters change
  const updateURLParams = useCallback(
    (params: { platform?: string; dateRange?: string; completion?: string; search?: string }) => {
      const newParams = new URLSearchParams(searchParams.toString());

      Object.entries(params).forEach(([key, value]) => {
        if (value && value !== "all" && value !== "") {
          newParams.set(key, value);
        } else {
          newParams.delete(key);
        }
      });

      router.replace(`?${newParams.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  // Fetch data function
  const fetchData = useCallback(
    async (page: number, append = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        const params = new URLSearchParams({
          platform: platform || "all",
          page: page.toString(),
          limit: "20",
          dateRange: dateRange || "all",
          completion: completion || "all",
          ...(debouncedSearch && { search: debouncedSearch }),
        });

        const response = await fetch(`/api/about/live/media?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch media data");

        const newData: MediaData = await response.json();

        if (append) {
          setAllItems((prev) => [...prev, ...newData.items]);
        } else {
          setAllItems(newData.items);
        }

        setData(newData);
        setHasMore(newData.pagination.hasMore);
        setCurrentPage(newData.pagination.currentPage);
      } catch (error) {
        console.error("Failed to fetch media data:", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [platform, dateRange, completion, debouncedSearch]
  );

  // Initial load and filter changes
  useEffect(() => {
    setAllItems([]);
    setCurrentPage(1);
    fetchData(1, false);

    // Update URL params
    updateURLParams({
      platform,
      dateRange,
      completion,
      search: debouncedSearch,
    });
  }, [platform, dateRange, completion, debouncedSearch, fetchData, updateURLParams]);

  // Infinite scroll observer
  useEffect(() => {
    if (loadingMore || !hasMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const intersectingEntry = entries.find((entry) => entry.isIntersecting);
        if (intersectingEntry && hasMore && !loadingMore) {
          fetchData(currentPage + 1, true);
        }
      },
      { threshold: 0.1 }
    );

    const currentLoadMoreRef = loadMoreRef.current;
    if (currentLoadMoreRef && observerRef.current) {
      observerRef.current.observe(currentLoadMoreRef);
    }

    return () => {
      if (observerRef.current && currentLoadMoreRef) {
        observerRef.current.unobserve(currentLoadMoreRef);
      }
    };
  }, [hasMore, loadingMore, currentPage, fetchData]);

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
          bilibili: "B站视频",
          douban: "豆瓣电影",
          totalHours: "总时长",
          totalItems: "总数",
          recentlyWatched: "最近观看",
          currentlyWatching: "追剧中",
          all: "全部",
          bilibiliTab: "📺 B站视频",
          doubanTab: "🎞️ 豆瓣电影",
          allTab: "🎬 全部",
          loading: "加载中...",
          loadingMore: "加载更多中...",
          noData: "暂无数据",
          noResults: "没有符合条件的记录",
          allLoaded: "已加载全部内容",
          episodesLeft: "集剩余",
          continue: "继续观看",
          hours: "小时",
          items: "项",
          platformStats: "平台统计",
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
          bilibili: "Bilibili",
          douban: "Douban",
          totalHours: "Total Hours",
          totalItems: "Total Items",
          recentlyWatched: "Recently Watched",
          currentlyWatching: "Currently Watching",
          all: "All",
          bilibiliTab: "📺 Bilibili",
          doubanTab: "🎞️ Douban",
          allTab: "🎬 All",
          loading: "Loading...",
          loadingMore: "Loading more...",
          noData: "No data available",
          noResults: "No results found",
          allLoaded: "All content loaded",
          episodesLeft: "episodes left",
          continue: "Continue →",
          hours: "hrs",
          items: "items",
          platformStats: "Platform Stats",
        };

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

      {loading && !data ? (
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
                value={data.stats.thisWeek.bilibili + data.stats.thisWeek.douban}
                trend={undefined}
              />
              <StatCard
                icon={<Tv className="h-6 w-6" />}
                title={t.thisMonth}
                subtitle={`${data.stats.thisMonth.movies} ${t.movies}, ${data.stats.thisMonth.series} ${t.series}`}
                value={data.stats.thisMonth.bilibili + data.stats.thisMonth.douban}
                trend={undefined}
              />
              <StatCard
                icon="📊"
                title={t.thisYear}
                subtitle={`${data.stats.thisYear.totalHours} ${t.hours}, ${data.stats.thisYear.totalItems} ${t.items}`}
                value={data.stats.thisYear.totalItems}
                trend={undefined}
              />
            </div>

            {/* Platform Stats */}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                <div className="mb-2 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  📺 {t.bilibili}
                </div>
                <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  {data.platformStats.bilibili.total}
                </div>
                <div className="mt-1 text-xs text-neutral-500">
                  {data.platformStats.bilibili.movies} {t.movies},{" "}
                  {data.platformStats.bilibili.series} {t.series}
                </div>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                <div className="mb-2 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  🎞️ {t.douban}
                </div>
                <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  {data.platformStats.douban.total}
                </div>
                <div className="mt-1 text-xs text-neutral-500">
                  {data.platformStats.douban.movies} {t.movies}, {data.platformStats.douban.series}{" "}
                  {t.series}
                </div>
              </div>
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
                          {item.platform === "bilibili" ? "📺 B站" : "🎞️ 豆瓣"}
                          {item.season && item.episode && (
                            <>
                              {" "}
                              · S{item.season.toString().padStart(2, "0")}E
                              {item.episode.toString().padStart(2, "0")}
                            </>
                          )}
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
            {/* Platform Tabs */}
            <div className="mb-6">
              <div className="flex gap-2">
                {(
                  [
                    { value: "all", label: t.allTab },
                    { value: "bilibili", label: t.bilibiliTab },
                    { value: "douban", label: t.doubanTab },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setPlatform(tab.value)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      platform === tab.value
                        ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filters */}
            <MediaFilters
              locale={locale}
              platform={platform}
              dateRange={dateRange}
              completion={completion}
              searchQuery={searchQuery}
              onDateRangeChange={setDateRange}
              onCompletionChange={setCompletion}
              onSearchChange={setSearchQuery}
            />

            {/* Title with item count */}
            <h2 className="mb-6 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              🎞️ {t.recentlyWatched}
              <span className="ml-2 text-sm font-normal text-neutral-500">
                ({data.pagination.totalItems} {t.items})
              </span>
            </h2>

            {/* Items Grid */}
            {allItems.length === 0 ? (
              <div className="rounded-xl border border-neutral-200 bg-white p-12 text-center dark:border-neutral-800 dark:bg-neutral-900">
                <p className="text-neutral-600 dark:text-neutral-400">{t.noResults}</p>
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {allItems.map((item) => (
                    <MoviePosterCard key={item.id} item={item} />
                  ))}
                </div>

                {/* Loading More Indicator */}
                <div ref={loadMoreRef} className="mt-8 flex justify-center">
                  {loadingMore ? (
                    <div className="flex items-center gap-2 text-neutral-500">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>{t.loadingMore}</span>
                    </div>
                  ) : hasMore ? (
                    <div className="h-4" /> // Placeholder for observer
                  ) : (
                    <p className="text-sm text-neutral-500">{t.allLoaded}</p>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

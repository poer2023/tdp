"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { t, type AdminLocale } from "@/lib/admin-translations";

type TopPost = {
  id: string;
  title: string;
  slug: string;
  viewCount: number;
  publishedAt: string | null;
};

type PostStatsData = {
  topPosts: TopPost[];
  stats: {
    totalPosts: number;
    totalViews: number;
    averageViews: number;
  };
};

type PostStatsTopProps = {
  locale?: AdminLocale;
};

export function PostStatsTop({ locale = "en" }: PostStatsTopProps) {
  const [data, setData] = useState<PostStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/admin/stats/posts");
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (err) {
        console.error("Failed to fetch post stats:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[320px] flex-col rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-950">
        <h3 className="mb-4 text-sm font-semibold tracking-wider text-stone-500 uppercase dark:text-stone-400">
          {t(locale, "topPosts")}
        </h3>
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-stone-100 dark:bg-stone-900" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[320px] flex-col rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-950">
        <h3 className="mb-4 text-sm font-semibold tracking-wider text-stone-500 uppercase dark:text-stone-400">
          {t(locale, "topPosts")}
        </h3>
        <p className="text-sm text-stone-500 dark:text-stone-500">{t(locale, "failedToLoadStats")}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[320px] flex-col rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-950">
      <h3 className="mb-4 text-sm font-semibold tracking-wider text-stone-500 uppercase dark:text-stone-400">
        {t(locale, "topPosts")}
      </h3>

      {data.topPosts.length === 0 ? (
        <p className="text-sm text-stone-500 dark:text-stone-500">{t(locale, "noPostsYet")}</p>
      ) : (
        <ul className="space-y-3">
          {data.topPosts.slice(0, 5).map((post, index) => (
            <li key={post.id} className="group">
              <Link
                href={`/admin/posts/${post.id}`}
                className="block rounded-xl p-3 transition-colors hover:bg-stone-50 dark:hover:bg-stone-900/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-1 items-start gap-3">
                    {/* 排名数字 */}
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-semibold text-stone-600 dark:bg-stone-800 dark:text-stone-400">
                      {index + 1}
                    </div>

                    {/* 文章信息 */}
                    <div className="flex-1 space-y-1">
                      <p className="line-clamp-1 text-sm font-medium text-stone-900 dark:text-stone-100">
                        {post.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-500">
                        <span>
                          {post.viewCount.toLocaleString()} {t(locale, "views")}
                        </span>
                        {post.publishedAt && (
                          <>
                            <span>·</span>
                            <span>
                              {new Date(post.publishedAt).toLocaleDateString(
                                locale === "zh" ? "zh-CN" : "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 箭头 */}
                  <span className="text-xs font-medium text-stone-600 transition-colors group-hover:text-stone-900 dark:text-stone-500 dark:group-hover:text-stone-300">
                    {t(locale, "view")} →
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* 总体统计 */}
      <div className="mt-4 border-t border-stone-200 pt-4 dark:border-stone-800">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-stone-500 dark:text-stone-500">
              {t(locale, "totalPostsShort")}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-stone-900 tabular-nums dark:text-stone-100">
              {data.stats.totalPosts}
            </p>
          </div>
          <div>
            <p className="text-xs text-stone-500 dark:text-stone-500">
              {t(locale, "totalViewsShort")}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-stone-900 tabular-nums dark:text-stone-100">
              {data.stats.totalViews.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-stone-500 dark:text-stone-500">{t(locale, "avgViewsShort")}</p>
            <p className="mt-0.5 text-sm font-semibold text-stone-900 tabular-nums dark:text-stone-100">
              {data.stats.averageViews}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { t, type AdminLocale } from "@/lib/admin-translations";
import { Card } from "@/components/ui-heroui";

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
      <Card variant="secondary" className="flex min-h-[320px] flex-col">
        <Card.Content>
          <h3 className="mb-4 text-sm font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
            {t(locale, "topPosts")}
          </h3>
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 rounded-lg bg-zinc-100 dark:bg-zinc-900" />
            ))}
          </div>
        </Card.Content>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card variant="secondary" className="flex min-h-[320px] flex-col">
        <Card.Content>
          <h3 className="mb-4 text-sm font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
            {t(locale, "topPosts")}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-500">{t(locale, "failedToLoadStats")}</p>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card variant="secondary" className="flex min-h-[320px] flex-col">
      <Card.Content>
        <h3 className="mb-4 text-sm font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
          {t(locale, "topPosts")}
        </h3>

        {data.topPosts.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-500">{t(locale, "noPostsYet")}</p>
        ) : (
          <ul className="space-y-3">
            {data.topPosts.slice(0, 5).map((post, index) => (
              <li key={post.id} className="group">
                <Link
                  href={`/admin/posts/${post.id}`}
                  className="block rounded-lg p-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-1 items-start gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        {index + 1}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="line-clamp-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {post.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-500">
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
                    <span className="text-xs font-medium text-zinc-600 transition-colors group-hover:text-zinc-900 dark:text-zinc-500 dark:group-hover:text-zinc-300">
                      {t(locale, "view")} →
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-500">
                {t(locale, "totalPostsShort")}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-zinc-900 tabular-nums dark:text-zinc-100">
                {data.stats.totalPosts}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-500">
                {t(locale, "totalViewsShort")}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-zinc-900 tabular-nums dark:text-zinc-100">
                {data.stats.totalViews.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-500">
                {t(locale, "avgViewsShort")}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-zinc-900 tabular-nums dark:text-zinc-100">
                {data.stats.averageViews}
              </p>
            </div>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}

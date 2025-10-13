"use client";

import { useState } from "react";

/**
 * TopPagesList Component - Enhanced page list with icons and titles
 */
export function TopPagesList({
  pages,
  postTitleMap,
  momentTitleMap,
  locale,
}: {
  pages: Array<{ path: string; _count: { path: number } }>;
  postTitleMap: Map<string, string>;
  momentTitleMap: Map<string, string>;
  locale: "en" | "zh";
}) {
  const [showAll, setShowAll] = useState(false);
  const displayPages = showAll ? pages : pages.slice(0, 5);
  const totalViews = pages.reduce((sum, p) => sum + p._count.path, 0);

  // Helper function to get page type, icon, and title
  function getPageInfo(path: string) {
    if (path.startsWith("/posts/")) {
      const slug = path.replace("/posts/", "").split("/")[0];
      const title = postTitleMap.get(slug);
      return {
        type: locale === "zh" ? "文章" : "Posts",
        icon: "📄",
        title: title || path,
        color: "blue",
      };
    } else if (path.startsWith("/gallery")) {
      return {
        type: locale === "zh" ? "相册" : "Gallery",
        icon: "🖼️",
        title: path,
        color: "purple",
      };
    } else if (path.startsWith("/m/")) {
      const slug = path.replace("/m/", "").split("/")[0];
      const title = momentTitleMap.get(slug);
      return {
        type: locale === "zh" ? "动态" : "Moments",
        icon: "💬",
        title: title || path,
        color: "green",
      };
    } else {
      return {
        type: locale === "zh" ? "其他" : "Other",
        icon: "📌",
        title: path,
        color: "gray",
      };
    }
  }

  return (
    <>
      {displayPages.map((page, index) => {
        const info = getPageInfo(page.path);
        const percentage = totalViews > 0 ? (page._count.path / totalViews) * 100 : 0;

        return (
          <div
            key={page.path}
            className="group relative rounded-lg border border-zinc-100 p-4 transition-all hover:border-zinc-200 hover:shadow-sm dark:border-zinc-800 dark:hover:border-zinc-700"
          >
            <div className="flex items-start gap-3">
              {/* Ranking number */}
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                {index + 1}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1 space-y-2">
                {/* Title and type badge */}
                <div className="flex items-center gap-2">
                  <span className="text-lg">{info.icon}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      info.color === "blue"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                        : info.color === "purple"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                          : info.color === "green"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                            : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    {info.type}
                  </span>
                </div>

                {/* Title or path */}
                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {info.title}
                </div>

                {/* Path (if different from title) */}
                {info.title !== page.path && (
                  <div className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                    {page.path}
                  </div>
                )}

                {/* Progress bar showing percentage */}
                <div className="flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className={`h-full transition-all ${
                        info.color === "blue"
                          ? "bg-blue-500"
                          : info.color === "purple"
                            ? "bg-purple-500"
                            : info.color === "green"
                              ? "bg-green-500"
                              : "bg-zinc-500"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex flex-shrink-0 items-baseline gap-1 text-right">
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {page._count.path}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Show more/less button */}
      {pages.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-2 w-full rounded-lg border border-zinc-200 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          {showAll
            ? locale === "zh"
              ? "收起"
              : "Show Less"
            : `${locale === "zh" ? "查看全部" : "View All"} (${pages.length})`}
        </button>
      )}
    </>
  );
}

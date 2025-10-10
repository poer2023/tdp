import Link from "next/link";
import type { MomentSearchResult } from "@/lib/search";
import { HighlightText } from "./highlight-text";

type Props = {
  moment: MomentSearchResult;
  query: string;
  locale: string;
  onSelect: () => void;
};

export function SearchResultMoment({ moment, query, locale, onSelect }: Props) {
  // Truncate content for preview
  const preview =
    moment.content.length > 150 ? moment.content.slice(0, 150) + "..." : moment.content;

  return (
    <Link
      href={`/${locale}/m/${moment.slug || moment.id}`}
      onClick={onSelect}
      className="group block rounded-lg px-4 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 pt-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-lg dark:bg-purple-900/30">
            💬
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-zinc-900 dark:text-zinc-100">
            <HighlightText text={preview} query={query} />
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-500">
            {moment.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span>🏷️</span>
                {moment.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">
                    #{tag}
                  </span>
                ))}
                {moment.tags.length > 3 && (
                  <span className="text-zinc-400">+{moment.tags.length - 3}</span>
                )}
              </div>
            )}
            <span className="flex items-center gap-1">
              <span>⏰</span>
              {new Date(moment.createdAt).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
        <div className="flex-shrink-0 pt-1">
          <svg
            className="h-5 w-5 text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

import Link from "next/link";
import type { SearchResult } from "@/lib/search";
import { HighlightText } from "./highlight-text";
import { localePath } from "@/lib/locale-path";

type Props = {
  post: SearchResult;
  query: string;
  locale: string;
  onSelect: () => void;
};

export function SearchResultPost({ post, query, locale, onSelect }: Props) {
  return (
    <Link
      href={localePath(locale as "en" | "zh", `/posts/${post.slug}`)}
      onClick={onSelect}
      className="group block rounded-lg px-4 py-3 transition-colors hover:bg-stone-50 dark:hover:bg-stone-800/50"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 pt-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-lg dark:bg-blue-900/30">
            📝
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-stone-900 group-hover:text-blue-600 dark:text-stone-100 dark:group-hover:text-blue-400">
            <HighlightText text={post.title} query={query} />
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-stone-600 dark:text-stone-400">
            <HighlightText text={post.excerpt} query={query} />
          </p>
          <div className="mt-2 flex items-center gap-3 text-xs text-stone-500 dark:text-stone-500">
            {post.authorName && (
              <span className="flex items-center gap-1">
                <span>👤</span>
                {post.authorName}
              </span>
            )}
            {post.publishedAt && (
              <span className="flex items-center gap-1">
                <span>📅</span>
                {new Date(post.publishedAt).toLocaleDateString(
                  locale === "zh" ? "zh-CN" : "en-US",
                  { year: "numeric", month: "short", day: "numeric" }
                )}
              </span>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 pt-1">
          <svg
            className="h-5 w-5 text-stone-400 opacity-0 transition-opacity group-hover:opacity-100"
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

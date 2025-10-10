"use client";

import { useEffect, useState, useCallback } from "react";
import { Command } from "cmdk";
import { usePathname } from "next/navigation";
import { getLocaleFromPathname } from "@/lib/i18n";
import type { SearchResult, GallerySearchResult, MomentSearchResult } from "@/lib/search";
import { SearchResultPost } from "./search-result-post";
import { SearchResultImage } from "./search-result-image";
import { SearchResultMoment } from "./search-result-moment";

type SearchTab = "all" | "posts" | "images" | "moments";

type SearchResults = {
  posts: SearchResult[];
  images: GallerySearchResult[];
  moments: MomentSearchResult[];
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SearchCommand({ open, onOpenChange }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({ posts: [], images: [], moments: [] });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<SearchTab>("all");
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname) ?? "en";

  // Debounced search with layered loading
  useEffect(() => {
    if (!open || !query.trim()) {
      setResults({ posts: [], images: [], moments: [] });
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    // Stage 1: Quick search for posts (instant feedback)
    const quickTimer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}&mode=quick`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Quick search failed");
        const data = await res.json();
        setResults((prev) => ({ ...prev, posts: data.posts || [] }));
      } catch (e) {
        if (!(e instanceof DOMException && e.name === "AbortError")) {
          console.error("Quick search error:", e);
        }
      }
    }, 150);

    // Stage 2: Full search for all content types
    const fullTimer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}&mode=full`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Full search failed");
        const data = await res.json();
        setResults({
          posts: data.posts || [],
          images: data.images || [],
          moments: data.moments || [],
        });
      } catch (e) {
        if (!(e instanceof DOMException && e.name === "AbortError")) {
          console.error("Full search error:", e);
          setResults({ posts: [], images: [], moments: [] });
        }
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(quickTimer);
      clearTimeout(fullTimer);
    };
  }, [query, open]);

  // Reset state when closing
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults({ posts: [], images: [], moments: [] });
      setActiveTab("all");
    }
  }, [open]);

  const handleSelect = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // Keyboard shortcuts: Cmd/Ctrl+K to toggle
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  // ESC key to close
  useEffect(() => {
    if (!open) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onOpenChange]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
    return undefined;
  }, [open]);

  if (!open) return null;

  // Count results
  const totalCount = results.posts.length + results.images.length + results.moments.length;
  const postCount = results.posts.length;
  const imageCount = results.images.length;
  const momentCount = results.moments.length;

  // Determine what to show based on active tab
  const showPosts = activeTab === "all" || activeTab === "posts";
  const showImages = activeTab === "all" || activeTab === "images";
  const showMoments = activeTab === "all" || activeTab === "moments";

  // Filter results by tab
  const filteredPosts = showPosts ? results.posts : [];
  const filteredImages = showImages ? results.images : [];
  const filteredMoments = showMoments ? results.moments : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[10vh] backdrop-blur-sm"
      onClick={() => onOpenChange(false)}
    >
      <Command
        className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-[#0b0b0d]"
        shouldFilter={false}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center border-b border-zinc-200 px-4 dark:border-zinc-800">
          <svg
            className="h-5 w-5 flex-shrink-0 text-zinc-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <Command.Input
            value={query}
            onValueChange={setQuery}
            placeholder={
              locale === "zh" ? "搜索文章、图片、动态..." : "Search posts, images, moments..."
            }
            className="flex h-14 w-full rounded-md bg-transparent px-4 py-4 text-base text-zinc-900 placeholder:text-zinc-400 focus:ring-0 focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
          {loading && (
            <div className="flex-shrink-0" role="status" aria-label="Loading">
              <svg className="h-4 w-4 animate-spin text-zinc-400" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Tabs */}
        {query.trim() && totalCount > 0 && (
          <div className="flex gap-1 border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
            <button
              onClick={() => setActiveTab("all")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === "all"
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              {locale === "zh" ? "全部" : "All"} ({totalCount})
            </button>
            {postCount > 0 && (
              <button
                onClick={() => setActiveTab("posts")}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === "posts"
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                📝 {locale === "zh" ? "文章" : "Posts"} ({postCount})
              </button>
            )}
            {imageCount > 0 && (
              <button
                onClick={() => setActiveTab("images")}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === "images"
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                🖼️ {locale === "zh" ? "图片" : "Images"} ({imageCount})
              </button>
            )}
            {momentCount > 0 && (
              <button
                onClick={() => setActiveTab("moments")}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === "moments"
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                💬 {locale === "zh" ? "动态" : "Moments"} ({momentCount})
              </button>
            )}
          </div>
        )}

        {/* Results */}
        <Command.List className="max-h-[60vh] overflow-y-auto p-2">
          {loading && !query.trim() && (
            <div className="py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
              {locale === "zh" ? "搜索中..." : "Searching..."}
            </div>
          )}

          {!loading && query.trim() && totalCount === 0 && (
            <Command.Empty className="py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                🔍
              </div>
              <p className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                {locale === "zh" ? "未找到结果" : "No results found"}
              </p>
              <p className="mt-1 text-sm">
                {locale === "zh"
                  ? `未找到与 "${query}" 相关的内容`
                  : `No content found for "${query}"`}
              </p>
            </Command.Empty>
          )}

          {/* Posts section */}
          {filteredPosts.length > 0 && (
            <div className="mb-4">
              <div className="mb-2 px-2 text-xs font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                📝 {locale === "zh" ? "文章" : "Posts"} ({filteredPosts.length})
              </div>
              <div className="space-y-1">
                {filteredPosts.map((post) => (
                  <SearchResultPost
                    key={post.id}
                    post={post}
                    query={query}
                    locale={locale}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Images section */}
          {filteredImages.length > 0 && (
            <div className="mb-4">
              <div className="mb-2 px-2 text-xs font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                🖼️ {locale === "zh" ? "图片" : "Images"} ({filteredImages.length})
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {filteredImages.map((image) => (
                  <SearchResultImage
                    key={image.id}
                    image={image}
                    query={query}
                    locale={locale}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Moments section */}
          {filteredMoments.length > 0 && (
            <div className="mb-4">
              <div className="mb-2 px-2 text-xs font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                💬 {locale === "zh" ? "动态" : "Moments"} ({filteredMoments.length})
              </div>
              <div className="space-y-1">
                {filteredMoments.map((moment) => (
                  <SearchResultMoment
                    key={moment.id}
                    moment={moment}
                    query={query}
                    locale={locale}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            </div>
          )}
        </Command.List>

        {/* Footer hints */}
        <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <kbd className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] dark:bg-zinc-800">
                ↑↓
              </kbd>
              {locale === "zh" ? "导航" : "Navigate"}
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] dark:bg-zinc-800">
                ↵
              </kbd>
              {locale === "zh" ? "选择" : "Select"}
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] dark:bg-zinc-800">
                Esc
              </kbd>
              {locale === "zh" ? "关闭" : "Close"}
            </span>
          </div>
          <span className="hidden text-[10px] sm:block">
            <kbd className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono dark:bg-zinc-800">⌘K</kbd>{" "}
            {locale === "zh" ? "打开搜索" : "Open search"}
          </span>
        </div>
      </Command>
    </div>
  );
}

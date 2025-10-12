"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { getLocaleFromPathname } from "@/lib/i18n";
import { LanguageBadge } from "@/components/ui/language-badge";
import { SearchResultSkeleton } from "./search/search-skeleton";
import { SearchEmptyState } from "./search/search-empty-state";
import type { SearchResult, GallerySearchResult, MomentSearchResult } from "@/lib/search";
import {
  getSearchHistory,
  addToSearchHistory,
  removeFromSearchHistory,
  type SearchHistoryItem,
} from "@/lib/search-history";

type SearchResults = {
  posts: SearchResult[];
  images: GallerySearchResult[];
  moments: MomentSearchResult[];
};

export function Search({ size = "md" }: { size?: "sm" | "md" }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResults>({ posts: [], images: [], moments: [] });
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const locale = useMemo(() => getLocaleFromPathname(pathname) ?? "en", [pathname]);
  const serverLocale = (locale === "zh" ? "ZH" : "EN") as "EN" | "ZH";

  // Avoid hydration mismatches by deferring overlay render to client mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load search history on mount and when opening
  useEffect(() => {
    if (open) {
      setSearchHistory(getSearchHistory());
    }
  }, [open]);

  // Smoothly focus input when opening
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [open]);

  // Compute viewport-anchored position to prevent overflow
  const [anchor, setAnchor] = useState<{
    right: number;
    top: number;
    width: number;
    maxHeight: number;
  } | null>(null);

  const computePosition = () => {
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 8; // viewport safety margin
    const right = Math.max(margin, vw - rect.right);
    const available = vw - right - margin; // distance from right to left margin
    const width = Math.max(220, Math.min(available, 480));
    const top = Math.max(margin, rect.top + rect.height / 2);
    const inputHeight = 40; // approx
    const maxHeight = Math.max(160, Math.min(320, vh - top - inputHeight - margin));
    setAnchor({ right, top, width, maxHeight });
  };

  useEffect(() => {
    if (!open) return;
    computePosition();
    const onResize = () => computePosition();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, { passive: true });
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize);
    };
  }, [open]);

  // Close when clicking outside (but NOT when clicking inside popped area)
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!open) return;
      const target = e.target as Node;
      const insideContainer = containerRef.current?.contains(target);
      const insideRoot = rootRef.current?.contains(target);
      if (!insideContainer && !insideRoot) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
      // Quick open with '/'
      if (!open && e.key === "/") {
        e.preventDefault();
        setOpen(true);
      }
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Debounced search with full mode for all content types
  useEffect(() => {
    if (!open) return;
    if (!q.trim()) {
      setResults({ posts: [], images: [], moments: [] });
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(q.trim())}&locale=${serverLocale}&mode=full`,
          { signal: ctrl.signal }
        );
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setResults({
          posts: data.posts || [],
          images: data.images || [],
          moments: data.moments || [],
        });
      } catch (e) {
        if (!(e instanceof DOMException && e.name === "AbortError")) {
          setResults({ posts: [], images: [], moments: [] });
        }
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [q, open, serverLocale]);

  const goToFullPage = () => {
    const query = q.trim();
    if (query) {
      addToSearchHistory(query);
    }
    const target = `/${locale}/search?q=${encodeURIComponent(query)}`;
    setOpen(false);
    router.push(target);
  };

  const handleHistoryItemClick = (query: string) => {
    setQ(query);
    // Focus input after setting query
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleRemoveHistory = (query: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    removeFromSearchHistory(query);
    setSearchHistory(getSearchHistory());
  };

  const overlay = isMobile ? (
    // Mobile drawer layout
    <div
      ref={containerRef}
      data-testid="search-overlay"
      className={`fixed inset-0 z-[70] transition-opacity duration-200 ${
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm dark:bg-black/40"
        onClick={() => setOpen(false)}
      />
      {/* Drawer content */}
      <div
        className={`absolute inset-x-0 top-0 flex flex-col bg-white shadow-2xl transition-transform duration-300 ease-out dark:bg-zinc-900 ${
          open ? "translate-y-0" : "-translate-y-full"
        }`}
        style={{ maxHeight: "85vh" }}
      >
        {/* Search input with close button */}
        <div className="flex items-center gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-5 w-5 text-zinc-500"
          >
            <circle cx="11" cy="11" r="7"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && q.trim()) {
                e.preventDefault();
                goToFullPage();
              }
              if (e.key === "Escape") {
                setOpen(false);
              }
            }}
            placeholder={
              locale === "zh" ? "搜索文章、图片、动态..." : "Search posts, images, moments..."
            }
            aria-label={locale === "zh" ? "搜索输入框" : "Search input"}
            role="searchbox"
            className="flex-1 bg-transparent text-base text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus-visible:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label={locale === "zh" ? "清空" : "Clear"}
              className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-4 w-4"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={locale === "zh" ? "关闭搜索" : "Close search"}
            className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        {/* Results area */}
        <div className="flex-1 overflow-auto">
          {!q.trim() && searchHistory.length > 0 ? (
            <div className="py-2">
              <div className="mb-1.5 px-4 pt-1 text-[10px] font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                🕒 {locale === "zh" ? "最近搜索" : "Recent Searches"}
              </div>
              <ul>
                {searchHistory.map((item) => (
                  <li key={item.query}>
                    <button
                      type="button"
                      onClick={() => handleHistoryItemClick(item.query)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left text-base text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-zinc-400">⏱</span>
                        <span>{item.query}</span>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleRemoveHistory(item.query, e)}
                        className="rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600 dark:hover:bg-zinc-700"
                        aria-label={locale === "zh" ? "删除" : "Remove"}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="h-4 w-4"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : loading ? (
            <div className="space-y-1 p-2">
              <SearchResultSkeleton />
              <SearchResultSkeleton />
              <SearchResultSkeleton />
            </div>
          ) : results.posts.length === 0 &&
            results.images.length === 0 &&
            results.moments.length === 0 ? (
            <SearchEmptyState query={q} locale={locale} />
          ) : (
            <div>
              {/* Posts section */}
              {results.posts.length > 0 && (
                <div className="mb-2">
                  <div className="mb-1.5 px-4 pt-2 text-[10px] font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                    📝 {locale === "zh" ? "文章" : "Posts"} ({results.posts.length})
                  </div>
                  <ul>
                    {results.posts.map((post) => (
                      <li key={post.id}>
                        <a
                          href={`/${locale}/posts/${post.slug}`}
                          className="block px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                          <div className="font-medium text-zinc-900 dark:text-zinc-100">
                            {post.title}
                          </div>
                          <div className="line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
                            {post.excerpt}
                          </div>
                          <div className="mt-1.5 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-500">
                            <LanguageBadge locale={post.locale} />
                            {post.publishedAt && (
                              <>
                                <span className="text-zinc-300 dark:text-zinc-700">·</span>
                                <span className="flex items-center gap-1">
                                  <span>📅</span>
                                  {new Date(post.publishedAt).toLocaleDateString(
                                    locale === "zh" ? "zh-CN" : "en-US",
                                    { year: "numeric", month: "short", day: "numeric" }
                                  )}
                                </span>
                              </>
                            )}
                            {post.authorName && (
                              <>
                                <span className="text-zinc-300 dark:text-zinc-700">·</span>
                                <span className="flex items-center gap-1">
                                  <span>👤</span>
                                  {post.authorName}
                                </span>
                              </>
                            )}
                          </div>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Images section */}
              {results.images.length > 0 && (
                <div className="mb-2">
                  <div className="mb-1.5 px-4 pt-2 text-[10px] font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                    🖼️ {locale === "zh" ? "图片" : "Images"} ({results.images.length})
                  </div>
                  <div className="grid grid-cols-3 gap-2 px-4">
                    {results.images.map((image) => (
                      <a
                        key={image.id}
                        href={`/gallery#${image.id}`}
                        className="group relative aspect-square overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800"
                      >
                        {image.smallThumbPath && (
                          <Image
                            src={image.smallThumbPath}
                            alt={image.title || "Gallery image"}
                            fill
                            sizes="33vw"
                            className="object-cover transition-transform duration-200 group-hover:scale-105"
                          />
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Moments section */}
              {results.moments.length > 0 && (
                <div className="mb-2">
                  <div className="mb-1.5 px-4 pt-2 text-[10px] font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                    💬 {locale === "zh" ? "动态" : "Moments"} ({results.moments.length})
                  </div>
                  <ul>
                    {results.moments.map((moment) => (
                      <li key={moment.id}>
                        <a
                          href={`/moments${moment.slug ? `/${moment.slug}` : `#${moment.id}`}`}
                          className="block px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                          <div className="line-clamp-2 text-sm text-zinc-900 dark:text-zinc-100">
                            {moment.content}
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                            {moment.tags.length > 0 && (
                              <span className="flex items-center gap-1">
                                🏷️ {moment.tags.slice(0, 2).join(", ")}
                              </span>
                            )}
                            <span className="text-zinc-300 dark:text-zinc-700">·</span>
                            <span>
                              {new Date(moment.createdAt).toLocaleDateString(
                                locale === "zh" ? "zh-CN" : "en-US",
                                { month: "short", day: "numeric" }
                              )}
                            </span>
                          </div>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        {/* Footer button */}
        <div className="border-t border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={goToFullPage}
            className="block w-full px-4 py-3 text-center text-sm font-medium text-blue-600 hover:bg-zinc-100 dark:text-blue-400 dark:hover:bg-zinc-800"
          >
            {locale === "zh" ? "查看全部结果" : "See all results"}
          </button>
        </div>
      </div>
    </div>
  ) : (
    // Desktop floating layout
    <div
      ref={containerRef}
      data-testid="search-overlay"
      className={`pointer-events-none fixed z-[70] ${open ? "pointer-events-auto" : ""}`}
      style={{
        right: anchor?.right ?? 12,
        top: anchor?.top ?? 12,
        transform: "translateY(-50%)",
        minWidth: 0,
      }}
    >
      <div
        className={`flex items-center gap-2 overflow-hidden rounded-xl border border-zinc-200 bg-white px-3 py-2 shadow-sm transition-all duration-200 ease-out dark:border-zinc-800 dark:bg-zinc-900 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        style={{ width: open ? anchor?.width || 0 : 0, maxWidth: "95vw" }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-4 w-4 text-zinc-500"
        >
          <circle cx="11" cy="11" r="7"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && q.trim()) {
              e.preventDefault();
              goToFullPage();
            }
            if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={
            locale === "zh" ? "搜索文章、图片、动态..." : "Search posts, images, moments..."
          }
          aria-label={locale === "zh" ? "搜索输入框" : "Search input"}
          aria-describedby="search-hint"
          role="searchbox"
          className="search-focus-reset w-full bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus-visible:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            aria-label={locale === "zh" ? "清空" : "Clear"}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/20 dark:hover:bg-zinc-800 dark:focus-visible:ring-blue-400/15"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {open ? (
        <div
          data-testid="search-dropdown"
          className="mt-2 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
          style={{ width: anchor?.width || 320, maxWidth: "95vw" }}
        >
          {/* Search History - shown when input is empty */}
          {!q.trim() && searchHistory.length > 0 ? (
            <div className="py-2">
              <div className="mb-1.5 px-3 pt-1 text-[10px] font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                🕒 {locale === "zh" ? "最近搜索" : "Recent Searches"}
              </div>
              <ul>
                {searchHistory.map((item) => (
                  <li key={item.query}>
                    <button
                      type="button"
                      onClick={() => handleHistoryItemClick(item.query)}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-zinc-400">⏱</span>
                        <span>{item.query}</span>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleRemoveHistory(item.query, e)}
                        className="rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600 dark:hover:bg-zinc-700"
                        aria-label={locale === "zh" ? "删除" : "Remove"}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="h-3.5 w-3.5"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : loading ? (
            <div className="space-y-1">
              <SearchResultSkeleton />
              <SearchResultSkeleton />
              <SearchResultSkeleton />
            </div>
          ) : results.posts.length === 0 &&
            results.images.length === 0 &&
            results.moments.length === 0 ? (
            <SearchEmptyState query={q} locale={locale} />
          ) : (
            <div className="overflow-auto" style={{ maxHeight: anchor?.maxHeight || 320 }}>
              {/* Posts section */}
              {results.posts.length > 0 && (
                <div className="mb-2">
                  <div className="mb-1.5 px-3 pt-2 text-[10px] font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                    📝 {locale === "zh" ? "文章" : "Posts"} ({results.posts.length})
                  </div>
                  <ul>
                    {results.posts.map((post) => (
                      <li key={post.id}>
                        <a
                          href={`/${locale}/posts/${post.slug}`}
                          className="block px-3 py-2.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                          <div className="font-medium text-zinc-900 dark:text-zinc-100">
                            {post.title}
                          </div>
                          <div className="line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
                            {post.excerpt}
                          </div>
                          <div className="mt-1.5 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-500">
                            <LanguageBadge locale={post.locale} />
                            {post.publishedAt && (
                              <>
                                <span className="text-zinc-300 dark:text-zinc-700">·</span>
                                <span className="flex items-center gap-1">
                                  <span>📅</span>
                                  {new Date(post.publishedAt).toLocaleDateString(
                                    locale === "zh" ? "zh-CN" : "en-US",
                                    { year: "numeric", month: "short", day: "numeric" }
                                  )}
                                </span>
                              </>
                            )}
                            {post.authorName && (
                              <>
                                <span className="text-zinc-300 dark:text-zinc-700">·</span>
                                <span className="flex items-center gap-1">
                                  <span>👤</span>
                                  {post.authorName}
                                </span>
                              </>
                            )}
                          </div>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Images section */}
              {results.images.length > 0 && (
                <div className="mb-2">
                  <div className="mb-1.5 px-3 pt-2 text-[10px] font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                    🖼️ {locale === "zh" ? "图片" : "Images"} ({results.images.length})
                  </div>
                  <div className="grid grid-cols-3 gap-2 px-3">
                    {results.images.map((image) => (
                      <a
                        key={image.id}
                        href={`/gallery#${image.id}`}
                        className="group relative aspect-square overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800"
                      >
                        {image.smallThumbPath && (
                          <Image
                            src={image.smallThumbPath}
                            alt={image.title || "Gallery image"}
                            fill
                            sizes="33vw"
                            className="object-cover transition-transform duration-200 group-hover:scale-105"
                          />
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Moments section */}
              {results.moments.length > 0 && (
                <div className="mb-2">
                  <div className="mb-1.5 px-3 pt-2 text-[10px] font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                    💬 {locale === "zh" ? "动态" : "Moments"} ({results.moments.length})
                  </div>
                  <ul>
                    {results.moments.map((moment) => (
                      <li key={moment.id}>
                        <a
                          href={`/moments${moment.slug ? `/${moment.slug}` : `#${moment.id}`}`}
                          className="block px-3 py-2.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                          <div className="line-clamp-2 text-sm text-zinc-900 dark:text-zinc-100">
                            {moment.content}
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                            {moment.tags.length > 0 && (
                              <span className="flex items-center gap-1">
                                🏷️ {moment.tags.slice(0, 2).join(", ")}
                              </span>
                            )}
                            <span className="text-zinc-300 dark:text-zinc-700">·</span>
                            <span>
                              {new Date(moment.createdAt).toLocaleDateString(
                                locale === "zh" ? "zh-CN" : "en-US",
                                { month: "short", day: "numeric" }
                              )}
                            </span>
                          </div>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={goToFullPage}
            className="block w-full border-t border-zinc-200 px-3 py-2 text-left text-xs text-zinc-500 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            {locale === "zh" ? "查看全部结果" : "See all results"}
          </button>
        </div>
      ) : null}
    </div>
  );

  return (
    <>
      <div
        ref={rootRef}
        className="relative"
        role="search"
        aria-label={locale === "zh" ? "网站搜索" : "Site search"}
      >
        <button
          type="button"
          aria-label={locale === "zh" ? "打开搜索对话框" : "Open search dialog"}
          aria-expanded={open}
          aria-controls="search-dropdown"
          onClick={() => setOpen((v) => !v)}
          className={`group flex items-center gap-2 rounded-full border border-zinc-200 text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-900 focus:outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-300 dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-400/20 ${
            size === "sm" ? "h-7 w-7 lg:w-auto lg:px-3" : "h-9 w-9 lg:w-auto lg:px-4"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"}
          >
            <circle cx="11" cy="11" r="7"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>

          {/* 宽屏显示文字和快捷键 */}
          <span className="hidden text-sm font-medium lg:inline">
            {locale === "zh" ? "搜索" : "Search"}
          </span>
          <kbd className="hidden rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 lg:inline dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
            ⌘K
          </kbd>
        </button>

        {/* Expanding input overlay (absolute, does not shift layout) */}
      </div>
      {mounted && createPortal(overlay, document.body)}
    </>
  );
}

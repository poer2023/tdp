"use client";

import { useEffect, useState, useCallback } from "react";
import { Command } from "cmdk";
import { useRouter, usePathname } from "next/navigation";
import { getLocaleFromPathname } from "@/lib/i18n";
import { localePath } from "@/lib/locale-path";

type SearchResult = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string | null;
  locale: "EN" | "ZH";
  authorName: string | null;
};

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname) ?? "en";

  // Debounced search (no locale filter - search across all languages)
  useEffect(() => {
    if (!open || !query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setResults(data.results || []);
      } catch (e) {
        if (!(e instanceof DOMException && e.name === "AbortError")) {
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, open]);

  // Reset state when closing
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  const handleSelect = useCallback(
    (slug: string) => {
      onOpenChange(false);
      router.push(localePath(locale, `/posts/${slug}`));
    },
    [locale, router, onOpenChange]
  );

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={() => onOpenChange(false)}
    >
      <Command
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-[#0b0b0d]"
        shouldFilter={false}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center border-b border-stone-200 px-3 dark:border-stone-800">
          <svg
            className="h-5 w-5 text-stone-400"
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
              locale === "zh" ? "搜索文章... (按 Esc 关闭)" : "Search posts... (press Esc to close)"
            }
            className="flex h-12 w-full rounded-md bg-transparent px-3 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:text-stone-100 dark:placeholder:text-stone-500"
          />
        </div>

        <Command.List className="max-h-[400px] overflow-y-auto p-2">
          {loading && (
            <div className="py-6 text-center text-sm text-stone-500 dark:text-stone-400">
              {locale === "zh" ? "搜索中..." : "Searching..."}
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <Command.Empty className="py-6 text-center text-sm text-stone-500 dark:text-stone-400">
              {locale === "zh" ? "未找到结果" : "No results found"}
            </Command.Empty>
          )}

          {!loading && results.length > 0 && (
            <Command.Group
              heading={locale === "zh" ? "文章" : "Posts"}
              className="overflow-hidden p-1 text-stone-900 dark:text-stone-100"
            >
              {results.map((result) => (
                <Command.Item
                  key={result.id}
                  value={result.id}
                  onSelect={() => handleSelect(result.slug)}
                  className="relative flex cursor-pointer items-start gap-3 rounded-lg px-3 py-3 text-sm outline-none select-none aria-selected:bg-stone-100 dark:aria-selected:bg-stone-800"
                >
                  <div className="flex-1">
                    <div className="font-medium text-stone-900 dark:text-stone-100">
                      {result.title}
                    </div>
                    {result.excerpt && (
                      <div className="mt-1 line-clamp-2 text-xs text-stone-500 dark:text-stone-400">
                        {result.excerpt}
                      </div>
                    )}
                  </div>
                  <svg
                    className="h-4 w-4 flex-shrink-0 text-stone-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </Command.Item>
              ))}
            </Command.Group>
          )}
        </Command.List>

        {/* Footer hint */}
        <div className="flex items-center justify-between border-t border-stone-200 px-3 py-2 text-xs text-stone-500 dark:border-stone-800 dark:text-stone-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-stone-100 px-1.5 py-0.5 font-mono dark:bg-stone-800">↑↓</kbd>
              {locale === "zh" ? "导航" : "Navigate"}
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-stone-100 px-1.5 py-0.5 font-mono dark:bg-stone-800">↵</kbd>
              {locale === "zh" ? "选择" : "Select"}
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-stone-100 px-1.5 py-0.5 font-mono dark:bg-stone-800">
                Esc
              </kbd>
              {locale === "zh" ? "关闭" : "Close"}
            </span>
          </div>
        </div>
      </Command>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { getLocaleFromPathname } from "@/lib/i18n";

type Result = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string | null;
  locale: "EN" | "ZH";
  authorName: string | null;
};

export function Search() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
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

  // Debounced search
  useEffect(() => {
    if (!open) return;
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(q.trim())}&locale=${serverLocale}`,
          { signal: ctrl.signal }
        );
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
      ctrl.abort();
      clearTimeout(t);
    };
  }, [q, open, serverLocale]);

  const goToFullPage = () => {
    const target = `/${locale}/search?q=${encodeURIComponent(q.trim())}`;
    setOpen(false);
    router.push(target);
  };

  const overlay = (
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
          placeholder={locale === "zh" ? "搜索文章..." : "Search posts..."}
          className="w-full bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 focus:ring-0 focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            aria-label="Clear"
            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
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
      {open && (q.trim().length > 0 || loading) ? (
        <div
          data-testid="search-dropdown"
          className="mt-2 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
          style={{ width: anchor?.width || 320, maxWidth: "95vw" }}
        >
          {loading ? (
            <div className="p-3 text-sm text-zinc-500 dark:text-zinc-400">
              {locale === "zh" ? "搜索中..." : "Searching..."}
            </div>
          ) : results.length === 0 ? (
            <div className="p-3 text-sm text-zinc-500 dark:text-zinc-400">
              {locale === "zh" ? "无结果" : "No results"}
            </div>
          ) : (
            <ul className="overflow-auto" style={{ maxHeight: anchor?.maxHeight || 320 }}>
              {results.map((r) => (
                <li key={r.id}>
                  <a
                    href={`/${locale}/posts/${r.slug}`}
                    className="block px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">{r.title}</div>
                    <div className="line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {r.excerpt}
                    </div>
                  </a>
                </li>
              ))}
            </ul>
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
      <div ref={rootRef} className="relative" aria-label="Site search">
        <button
          type="button"
          aria-label="Search"
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-900 focus:ring-0 focus:outline-none dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-300"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4"
          >
            <circle cx="11" cy="11" r="7"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>

        {/* Expanding input overlay (absolute, does not shift layout) */}
      </div>
      {mounted && createPortal(overlay, document.body)}
    </>
  );
}

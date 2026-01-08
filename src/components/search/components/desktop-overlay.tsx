"use client";

import { SearchHistoryList } from "./search-history";
import { SearchResultsContainer } from "./search-results";
import { SearchResultSkeleton } from "../search-skeleton";
import { SearchEmptyState } from "../search-empty-state";
import type { DesktopOverlayProps } from "../types";

// Shared search icon SVG
const SearchIcon = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className={className}
    >
        <circle cx="11" cy="11" r="7"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);

// Shared close icon SVG
const CloseIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

export function DesktopOverlay({
    open,
    q,
    setQ,
    loading,
    results,
    searchHistory,
    locale,
    anchor,
    inputRef,
    containerRef,
    onClose,
    onSubmit,
    onHistoryItemClick,
    onRemoveHistory,
}: DesktopOverlayProps) {
    const hasResults =
        results.posts.length > 0 || results.images.length > 0 || results.moments.length > 0;

    return (
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
            {/* Input container */}
            <div
                className={`flex items-center gap-2 overflow-hidden rounded-xl border border-stone-200 bg-white px-3 py-2 shadow-sm transition-all duration-200 ease-out dark:border-stone-800 dark:bg-stone-900 ${open ? "opacity-100" : "opacity-0"
                    }`}
                style={{ width: open ? anchor?.width || 0 : 0, maxWidth: "95vw" }}
            >
                <SearchIcon className="h-4 w-4 text-stone-500" />
                <input
                    ref={inputRef}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && q.trim()) {
                            e.preventDefault();
                            onSubmit();
                        }
                        if (e.key === "Escape") {
                            onClose();
                        }
                    }}
                    placeholder={locale === "zh" ? "搜索文章、图片、动态..." : "Search posts, images, moments..."}
                    aria-label={locale === "zh" ? "搜索输入框" : "Search input"}
                    aria-describedby="search-hint"
                    role="searchbox"
                    className="search-focus-reset w-full bg-transparent text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none dark:text-stone-100 dark:placeholder:text-stone-500"
                />
                {q && (
                    <button
                        type="button"
                        onClick={() => setQ("")}
                        aria-label={locale === "zh" ? "清空" : "Clear"}
                        className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/20 dark:hover:bg-stone-800 dark:focus-visible:ring-blue-400/15"
                    >
                        <CloseIcon className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Results dropdown */}
            {open ? (
                <div
                    data-testid="search-dropdown"
                    className="mt-2 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg dark:border-stone-800 dark:bg-stone-900"
                    style={{ width: anchor?.width || 320, maxWidth: "95vw" }}
                >
                    {!q.trim() && searchHistory.length > 0 ? (
                        <SearchHistoryList
                            history={searchHistory}
                            onItemClick={onHistoryItemClick}
                            onRemove={onRemoveHistory}
                            locale={locale}
                            variant="desktop"
                        />
                    ) : loading ? (
                        <div className="space-y-1">
                            <SearchResultSkeleton />
                            <SearchResultSkeleton />
                            <SearchResultSkeleton />
                        </div>
                    ) : !hasResults ? (
                        <SearchEmptyState query={q} locale={locale} />
                    ) : (
                        <div className="overflow-auto" style={{ maxHeight: anchor?.maxHeight || 320 }}>
                            <SearchResultsContainer results={results} locale={locale} variant="desktop" />
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={onSubmit}
                        className="block w-full border-t border-stone-200 px-3 py-2 text-left text-xs text-stone-500 hover:bg-stone-100 dark:border-stone-800 dark:text-stone-400 dark:hover:bg-stone-800"
                    >
                        {locale === "zh" ? "查看全部结果" : "See all results"}
                    </button>
                </div>
            ) : null}
        </div>
    );
}

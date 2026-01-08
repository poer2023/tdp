"use client";

import { SearchInput } from "./search-input";
import { SearchHistoryList } from "./search-history";
import { SearchResultsContainer } from "./search-results";
import { SearchResultSkeleton } from "../search-skeleton";
import { SearchEmptyState } from "../search-empty-state";
import type { MobileDrawerProps } from "../types";

export function MobileDrawer({
    open,
    q,
    setQ,
    loading,
    results,
    searchHistory,
    locale,
    inputRef,
    containerRef,
    onClose,
    onSubmit,
    onHistoryItemClick,
    onRemoveHistory,
}: MobileDrawerProps) {
    const hasResults =
        results.posts.length > 0 || results.images.length > 0 || results.moments.length > 0;

    return (
        <div
            ref={containerRef}
            data-testid="search-overlay"
            className={`fixed inset-0 z-[70] transition-opacity duration-200 ${open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
                }`}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/20 backdrop-blur-sm dark:bg-black/40"
                onClick={onClose}
            />
            {/* Drawer content */}
            <div
                className={`absolute inset-x-0 top-0 flex flex-col bg-white shadow-2xl transition-transform duration-300 ease-out dark:bg-stone-900 ${open ? "translate-y-0" : "-translate-y-full"
                    }`}
                style={{ maxHeight: "85vh" }}
            >
                {/* Search input */}
                <SearchInput
                    value={q}
                    onChange={setQ}
                    onSubmit={onSubmit}
                    onClose={onClose}
                    onClear={() => setQ("")}
                    locale={locale}
                    inputRef={inputRef}
                    variant="mobile"
                />

                {/* Results area */}
                <div className="flex-1 overflow-auto">
                    {!q.trim() && searchHistory.length > 0 ? (
                        <SearchHistoryList
                            history={searchHistory}
                            onItemClick={onHistoryItemClick}
                            onRemove={onRemoveHistory}
                            locale={locale}
                            variant="mobile"
                        />
                    ) : loading ? (
                        <div className="space-y-1 p-2">
                            <SearchResultSkeleton />
                            <SearchResultSkeleton />
                            <SearchResultSkeleton />
                        </div>
                    ) : !hasResults ? (
                        <SearchEmptyState query={q} locale={locale} />
                    ) : (
                        <SearchResultsContainer results={results} locale={locale} variant="mobile" />
                    )}
                </div>

                {/* Footer button */}
                <div className="border-t border-stone-200 dark:border-stone-800">
                    <button
                        type="button"
                        onClick={onSubmit}
                        className="block w-full px-4 py-3 text-center text-sm font-medium text-blue-600 hover:bg-stone-100 dark:text-blue-400 dark:hover:bg-stone-800"
                    >
                        {locale === "zh" ? "查看全部结果" : "See all results"}
                    </button>
                </div>
            </div>
        </div>
    );
}

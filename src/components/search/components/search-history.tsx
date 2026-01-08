"use client";

import type { SearchHistoryListProps } from "../types";

// Close icon for remove button
const CloseIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

export function SearchHistoryList({
    history,
    onItemClick,
    onRemove,
    locale,
    variant = "desktop",
}: SearchHistoryListProps) {
    const isMobile = variant === "mobile";

    if (history.length === 0) return null;

    return (
        <div className="py-2">
            <div
                className={`mb-1.5 pt-1 text-[10px] font-semibold tracking-wider text-stone-500 uppercase dark:text-stone-400 ${isMobile ? "px-4" : "px-3"
                    }`}
            >
                🕒 {locale === "zh" ? "最近搜索" : "Recent Searches"}
            </div>
            <ul>
                {history.map((item) => (
                    <li key={item.query}>
                        <button
                            type="button"
                            onClick={() => onItemClick(item.query)}
                            className={`flex w-full items-center justify-between text-left text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800 ${isMobile ? "px-4 py-3 text-base" : "px-3 py-2 text-sm"
                                }`}
                        >
                            <span className="flex items-center gap-2">
                                <span className="text-stone-400">⏱</span>
                                <span>{item.query}</span>
                            </span>
                            <button
                                type="button"
                                onClick={(e) => onRemove(item.query, e)}
                                className={`rounded text-stone-400 hover:bg-stone-200 hover:text-stone-600 dark:hover:bg-stone-700 ${isMobile ? "p-1" : "p-1"
                                    }`}
                                aria-label={locale === "zh" ? "删除" : "Remove"}
                            >
                                <CloseIcon className={isMobile ? "h-4 w-4" : "h-3.5 w-3.5"} />
                            </button>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

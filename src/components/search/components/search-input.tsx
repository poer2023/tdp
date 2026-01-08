"use client";

import type { SearchInputProps } from "../types";

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

export function SearchInput({
    value,
    onChange,
    onSubmit,
    onClose,
    onClear,
    locale,
    inputRef,
    variant = "desktop",
}: SearchInputProps) {
    const isMobile = variant === "mobile";

    return (
        <div
            className={`flex items-center gap-2 ${isMobile
                    ? "border-b border-stone-200 px-4 py-3 dark:border-stone-800"
                    : "overflow-hidden rounded-xl border border-stone-200 bg-white px-3 py-2 shadow-sm dark:border-stone-800 dark:bg-stone-900"
                }`}
        >
            <SearchIcon className={`${isMobile ? "h-5 w-5" : "h-4 w-4"} text-stone-500`} />
            <input
                ref={inputRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && value.trim()) {
                        e.preventDefault();
                        onSubmit();
                    }
                    if (e.key === "Escape") {
                        onClose();
                    }
                }}
                placeholder={locale === "zh" ? "搜索文章、图片、动态..." : "Search posts, images, moments..."}
                aria-label={locale === "zh" ? "搜索输入框" : "Search input"}
                role="searchbox"
                className={`flex-1 bg-transparent text-stone-900 placeholder:text-stone-400 focus:outline-none dark:text-stone-100 dark:placeholder:text-stone-500 ${isMobile ? "text-base" : "search-focus-reset w-full text-sm"
                    }`}
            />
            {value && (
                <button
                    type="button"
                    onClick={onClear}
                    aria-label={locale === "zh" ? "清空" : "Clear"}
                    className={`rounded-full text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 ${isMobile
                            ? "p-2"
                            : "rounded p-1 hover:text-stone-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/20 dark:focus-visible:ring-blue-400/15"
                        }`}
                >
                    <CloseIcon className="h-4 w-4" />
                </button>
            )}
            {isMobile && (
                <button
                    type="button"
                    onClick={onClose}
                    aria-label={locale === "zh" ? "关闭搜索" : "Close search"}
                    className="rounded-full p-2 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                    <CloseIcon className="h-5 w-5" />
                </button>
            )}
        </div>
    );
}

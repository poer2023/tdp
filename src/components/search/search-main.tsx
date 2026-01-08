"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { getLocaleFromPathname } from "@/lib/i18n";
import { useSearch, useSearchPosition } from "./hooks";
import { MobileDrawer, DesktopOverlay } from "./components";

export function Search({ size = "md" }: { size?: "sm" | "md" }) {
    const [open, setOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const rootRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    const locale = useMemo(() => getLocaleFromPathname(pathname) ?? "en", [pathname]);

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

    // Smoothly focus input when opening
    useEffect(() => {
        if (open) {
            const t = setTimeout(() => inputRef.current?.focus(), 120);
            return () => clearTimeout(t);
        }
        return undefined;
    }, [open]);

    // Close when clicking outside
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

    // Custom hooks
    const onClose = () => setOpen(false);
    const {
        q,
        setQ,
        results,
        loading,
        searchHistory,
        handleHistoryItemClick,
        handleRemoveHistory,
        goToFullPage,
    } = useSearch(open, locale, inputRef, onClose);
    const { anchor } = useSearchPosition(open, rootRef);

    const overlay = isMobile ? (
        <MobileDrawer
            open={open}
            q={q}
            setQ={setQ}
            loading={loading}
            results={results}
            searchHistory={searchHistory}
            locale={locale}
            inputRef={inputRef}
            containerRef={containerRef}
            onClose={onClose}
            onSubmit={goToFullPage}
            onHistoryItemClick={handleHistoryItemClick}
            onRemoveHistory={handleRemoveHistory}
        />
    ) : (
        <DesktopOverlay
            open={open}
            q={q}
            setQ={setQ}
            loading={loading}
            results={results}
            searchHistory={searchHistory}
            locale={locale}
            anchor={anchor}
            inputRef={inputRef}
            containerRef={containerRef}
            onClose={onClose}
            onSubmit={goToFullPage}
            onHistoryItemClick={handleHistoryItemClick}
            onRemoveHistory={handleRemoveHistory}
        />
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
                    className={`group flex items-center gap-2 rounded-full border border-stone-200 text-stone-600 transition-colors hover:border-stone-300 hover:text-stone-900 focus:outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20 dark:border-stone-800 dark:text-stone-400 dark:hover:border-stone-300 dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-400/20 ${size === "sm" ? "h-7 w-7 lg:w-auto lg:px-3" : "h-9 w-9 lg:w-auto lg:px-4"
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

                    {/* Wide screen text and keyboard shortcut */}
                    <span className="hidden text-sm font-medium lg:inline">
                        {locale === "zh" ? "搜索" : "Search"}
                    </span>
                    <kbd className="hidden rounded border border-stone-300 bg-stone-100 px-1.5 py-0.5 font-mono text-[10px] text-stone-500 lg:inline dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400">
                        ⌘K
                    </kbd>
                </button>
            </div>
            {mounted && createPortal(overlay, document.body)}
        </>
    );
}

// Named export for convenience
export { Search as SearchMain };

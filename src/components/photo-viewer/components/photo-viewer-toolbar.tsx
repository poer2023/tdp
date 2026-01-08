"use client";

import Link from "next/link";
import { localePath } from "@/lib/locale-path";
import { ThemeToggle } from "@/components/theme-toggle";
import type { PhotoViewerToolbarProps } from "../types";

export function PhotoViewerToolbar({
    locale,
    backButtonRef,
}: PhotoViewerToolbarProps) {
    return (
        <div className="fixed top-4 right-4 z-[62] flex items-center gap-2">
            <ThemeToggle />
            <Link
                ref={backButtonRef}
                href={localePath(locale, "/gallery")}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white/80 text-stone-700 shadow-sm backdrop-blur hover:bg-white dark:border-stone-800 dark:bg-stone-900/80 dark:text-stone-300"
                aria-label={locale === "zh" ? "返回相册页面" : "Back to Gallery"}
                title={locale === "zh" ? "返回相册" : "Back"}
            >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                    />
                </svg>
            </Link>
        </div>
    );
}

"use client";

import Link from "next/link";
import { localePath } from "@/lib/locale-path";
import type { PhotoViewerNavigationProps } from "../types";

export function PhotoViewerNavigation({
    locale,
    prevId,
    nextId,
    onPrevClick,
    onNextClick,
}: PhotoViewerNavigationProps) {
    return (
        <>
            {/* Left arrow */}
            <div className="pointer-events-none fixed top-1/2 left-4 z-[62] -translate-y-1/2 lg:left-6">
                {prevId && (
                    <Link
                        href={localePath(locale, `/gallery/${prevId}`)}
                        className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white/80 text-stone-700 shadow-sm backdrop-blur hover:bg-white dark:border-stone-800 dark:bg-stone-900/80 dark:text-stone-300"
                        title={locale === "zh" ? "上一张" : "Previous"}
                        aria-label={locale === "zh" ? "上一张" : "Previous"}
                        onClick={onPrevClick}
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 19l-7-7 7-7"
                            />
                        </svg>
                    </Link>
                )}
            </div>
            {/* Right arrow */}
            <div className="pointer-events-none fixed top-1/2 right-4 z-[62] -translate-y-1/2 lg:right-[calc(380px+1.5rem)] xl:right-[calc(420px+1.5rem)]">
                {nextId && (
                    <Link
                        href={localePath(locale, `/gallery/${nextId}`)}
                        className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white/80 text-stone-700 shadow-sm backdrop-blur hover:bg-white dark:border-stone-800 dark:bg-stone-900/80 dark:text-stone-300"
                        title={locale === "zh" ? "下一张" : "Next"}
                        aria-label={locale === "zh" ? "下一张" : "Next"}
                        onClick={onNextClick}
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                )}
            </div>
        </>
    );
}

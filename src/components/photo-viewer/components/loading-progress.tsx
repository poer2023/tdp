"use client";

import type { LoadingProgressProps } from "../types";
import { formatBytes, formatProgress } from "../utils";

export function LoadingProgress({
    locale,
    loadedBytes,
    totalBytes,
}: LoadingProgressProps) {
    return (
        <div className="pointer-events-none absolute right-6 bottom-6 z-[63] flex items-center gap-3 rounded-xl bg-black/75 px-4 py-2 text-xs text-white shadow-lg backdrop-blur">
            <svg
                className="h-4 w-4 animate-spin text-white/80"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
            >
                <circle
                    className="opacity-20"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                />
                <path
                    className="opacity-90"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"
                />
            </svg>
            <div>
                <div className="font-medium">
                    {locale === "zh"
                        ? `正在加载图片${formatProgress(loadedBytes, totalBytes)}`
                        : `Loading image${formatProgress(loadedBytes, totalBytes)}`}
                </div>
                <div className="text-[11px] text-white/70">
                    {formatBytes(loadedBytes)}
                    {typeof totalBytes === "number"
                        ? ` / ${formatBytes(totalBytes)}`
                        : ""}
                </div>
            </div>
        </div>
    );
}

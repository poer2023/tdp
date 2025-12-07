"use client";

import React from "react";

interface MomentSkeletonProps {
    hasImage?: boolean;
}

export function MomentCardSkeleton({ hasImage = false }: MomentSkeletonProps) {
    return (
        <div className="mb-8 break-inside-avoid">
            <div
                className={`relative w-full overflow-hidden rounded-3xl border shadow-lg ${hasImage
                        ? "bg-[#141416] border-[#27272a]"
                        : "bg-white dark:bg-[#141416]/80 border-stone-200 dark:border-[#27272a]"
                    }`}
            >
                {/* Image placeholder */}
                {hasImage && (
                    <div className="aspect-[4/3] w-full animate-pulse bg-gradient-to-br from-stone-800 to-stone-900" />
                )}

                {/* Content */}
                <div className={`p-6 ${hasImage ? "pt-4" : ""}`}>
                    {/* Header */}
                    <div className="mb-4 flex items-center gap-3">
                        <div className="h-10 w-10 animate-pulse rounded-full bg-stone-200 dark:bg-stone-700" />
                        <div className="space-y-2">
                            <div className="h-3 w-20 animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
                            <div className="h-2 w-16 animate-pulse rounded bg-stone-100 dark:bg-stone-800" />
                        </div>
                    </div>

                    {/* Text lines */}
                    <div className="space-y-2">
                        <div className="h-4 w-full animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
                        <div className="h-4 w-3/4 animate-pulse rounded bg-stone-200 dark:bg-stone-700" />
                        <div className="h-4 w-1/2 animate-pulse rounded bg-stone-100 dark:bg-stone-800" />
                    </div>

                    {/* Footer */}
                    <div className="mt-6 flex items-center justify-between">
                        <div className="flex gap-2">
                            <div className="h-8 w-8 animate-pulse rounded-full bg-stone-200 dark:bg-stone-700" />
                            <div className="h-8 w-8 animate-pulse rounded-full bg-stone-200 dark:bg-stone-700" />
                        </div>
                        <div className="h-3 w-16 animate-pulse rounded bg-stone-100 dark:bg-stone-800" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export function MomentListSkeleton({ count = 3 }: { count?: number }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <MomentCardSkeleton key={i} hasImage={i % 2 === 0} />
            ))}
        </>
    );
}

export default MomentCardSkeleton;

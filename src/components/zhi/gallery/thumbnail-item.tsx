"use client";

import React, { useCallback } from "react";
import type { ZhiGalleryItem } from "./types";

interface ThumbnailItemProps {
    item: ZhiGalleryItem;
    index: number;
    isActive: boolean;
    onClick: (index: number) => void;
}

/**
 * Memoized thumbnail item component
 * Uses CSS transitions for better performance
 */
export const ThumbnailItem = React.memo(function ThumbnailItem({
    item,
    index,
    isActive,
    onClick,
}: ThumbnailItemProps) {
    const handleClick = useCallback(() => onClick(index), [onClick, index]);

    return (
        <button
            onClick={handleClick}
            className={`
        relative h-full w-full overflow-hidden rounded-lg
        transition-all duration-200 ease-out
        ${isActive
                    ? "opacity-100 ring-2 ring-white ring-offset-1 ring-offset-transparent"
                    : "opacity-50 grayscale hover:opacity-80 hover:grayscale-0"
                }
      `}
        >
            {/* eslint-disable-next-line @next/next/no-img-element -- micro thumbnails, native img is fine for 32-60px images */}
            <img
                src={item.microThumbPath || item.smallThumbPath || item.thumbnail || item.url}
                alt={item.title}
                width={isActive ? 60 : 32}
                height={48}
                className="h-full w-full object-cover"
                draggable={false}
                loading="lazy"
                decoding="async"
            />
        </button>
    );
});

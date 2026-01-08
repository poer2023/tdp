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
        relative h-full shrink-0 overflow-hidden rounded-lg
        transition-all duration-200 ease-out
        ${isActive
                    ? "w-[60px] opacity-100 scale-105"
                    : "w-8 opacity-50 grayscale hover:opacity-80 hover:grayscale-0"
                }
      `}
            style={{ willChange: isActive ? 'auto' : 'opacity, filter' }}
        >
            {/* eslint-disable-next-line @next/next/no-img-element -- micro thumbnails, native img is fine for 32-60px images */}
            <img
                src={item.microThumbPath || item.smallThumbPath || item.thumbnail || item.url}
                alt={item.title}
                className="h-full w-full object-cover"
                draggable={false}
                loading="lazy"
            />
        </button>
    );
});

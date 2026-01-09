"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Play } from "lucide-react";
import dynamic from "next/dynamic";
import { SmoothImage } from "@/components/ui/smooth-image";
import type { ZhiGalleryItem } from "./types";
import { GRID_IMAGE_SIZES } from "./types";

// Dynamic import to avoid SSR issues with ResizeObserver
const Masonry = dynamic(
    () => import("masonic").then((mod) => mod.Masonry),
    { ssr: false }
);

export type GalleryGridProps = {
    items: ZhiGalleryItem[];
    onItemClick: (item: ZhiGalleryItem) => void;
};

// Masonry item component
const MasonryCard = React.memo(function MasonryCard({
    data,
    index,
    width,
    columnCount,
    onItemClick,
}: {
    data: ZhiGalleryItem;
    index: number;
    width: number;
    columnCount: number;
    onItemClick: (item: ZhiGalleryItem) => void;
}) {
    // First 2 rows get priority loading
    const isAboveFold = index < columnCount * 2;
    const imageSrc =
        data.type === "video"
            ? data.thumbnail || data.url
            : data.smallThumbPath || data.mediumPath || data.thumbnail || data.url;
    const aspectRatio = data.width && data.height ? data.width / data.height : 4 / 3;
    const height = width / aspectRatio;

    const handleClick = useCallback(() => {
        onItemClick(data);
    }, [data, onItemClick]);

    return (
        <div
            className="group relative cursor-pointer overflow-hidden rounded-lg bg-stone-200 dark:bg-stone-800"
            style={{ height }}
            onClick={handleClick}
        >
            <SmoothImage
                src={imageSrc}
                blurDataURL={data.blurDataURL}
                alt={data.title}
                fill
                sizes={GRID_IMAGE_SIZES}
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                priority={isAboveFold}
            />
            {/* Video Indicator */}
            {data.type === "video" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/10">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white backdrop-blur-md">
                        <Play size={20} fill="currentColor" />
                    </div>
                </div>
            )}
            {/* Hover Overlay */}
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 via-transparent to-transparent p-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <h3 className="font-serif text-lg font-medium text-white">{data.title}</h3>
                <span className="text-xs text-stone-300">{data.date}</span>
            </div>
        </div>
    );
});

export function GalleryGrid({ items, onItemClick }: GalleryGridProps) {
    // Get column count and gutter based on screen size
    const [columnCount, setColumnCount] = useState(2);
    const [columnGutter, setColumnGutter] = useState(12);
    const [columnWidth, setColumnWidth] = useState(200);

    useEffect(() => {
        const updateLayout = () => {
            const width = window.innerWidth;
            if (width >= 1024) {
                setColumnCount(4);
                setColumnGutter(24);
                // Approximate column width for lg screens
                setColumnWidth(Math.floor((Math.min(width, 1280) - 24 * 3 - 48) / 4));
            } else if (width >= 640) {
                setColumnCount(3);
                setColumnGutter(16);
                setColumnWidth(Math.floor((width - 16 * 2 - 32) / 3));
            } else {
                setColumnCount(2);
                setColumnGutter(12);
                setColumnWidth(Math.floor((width - 12 - 32) / 2));
            }
        };
        updateLayout();
        window.addEventListener('resize', updateLayout);
        return () => window.removeEventListener('resize', updateLayout);
    }, []);

    // Render function for Masonry items
    const renderItem = useCallback(
        ({ data, index, width }: { data: unknown; index: number; width: number }) => (
            <MasonryCard
                data={data as ZhiGalleryItem}
                index={index}
                width={width}
                columnCount={columnCount}
                onItemClick={onItemClick}
            />
        ),
        [columnCount, onItemClick]
    );

    return (
        <div className="w-full">
            <Masonry
                items={items}
                columnCount={columnCount}
                columnGutter={columnGutter}
                rowGutter={columnGutter}
                overscanBy={2}
                render={renderItem}
                itemKey={(data) => (data as ZhiGalleryItem).id}
                itemHeightEstimate={300}
            />
        </div>
    );
}

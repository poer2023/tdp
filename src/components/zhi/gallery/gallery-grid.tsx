"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Play } from "lucide-react";
import { SmoothImage } from "@/components/ui/smooth-image";
import type { ZhiGalleryItem } from "./types";
import { GRID_IMAGE_SIZES } from "./types";

export type GalleryGridProps = {
    items: ZhiGalleryItem[];
    onItemClick: (item: ZhiGalleryItem) => void;
};

export function GalleryGrid({ items, onItemClick }: GalleryGridProps) {
    // Get column count based on screen size
    const [columnCount, setColumnCount] = useState(1);

    useEffect(() => {
        const updateColumnCount = () => {
            if (window.innerWidth >= 1024) {
                setColumnCount(4);
            } else if (window.innerWidth >= 640) {
                setColumnCount(3);
            } else {
                setColumnCount(2);
            }
        };
        updateColumnCount();
        window.addEventListener('resize', updateColumnCount);
        return () => window.removeEventListener('resize', updateColumnCount);
    }, []);

    // Distribute items into columns for row-first ordering
    const distributeToColumns = useCallback((itemsToDistribute: ZhiGalleryItem[], colCount: number) => {
        const cols: ZhiGalleryItem[][] = Array.from({ length: colCount }, () => []);
        itemsToDistribute.forEach((item, idx) => {
            const targetCol = cols[idx % colCount];
            if (targetCol) {
                targetCol.push(item);
            }
        });
        return cols;
    }, []);

    const columns = useMemo(() => distributeToColumns(items, columnCount), [items, columnCount, distributeToColumns]);

    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
            {columns.map((column, colIndex) => (
                <div key={colIndex} className="flex flex-col gap-3 sm:gap-4 lg:gap-6">
                    {column.map((item, index) => {
                        const isAboveFold = colIndex * column.length + index < 6;
                        const imageSrc =
                            item.type === "video"
                                ? item.thumbnail || item.url
                                : item.smallThumbPath || item.mediumPath || item.thumbnail || item.url;
                        const aspectRatio = item.width && item.height ? item.width / item.height : 4 / 3;

                        return (
                            <div
                                key={item.id}
                                className="group relative cursor-pointer overflow-hidden rounded-lg bg-stone-200 dark:bg-stone-800"
                                onClick={() => onItemClick(item)}
                            >
                                <div
                                    className="relative w-full"
                                    style={{ paddingBottom: `${100 / aspectRatio}%` }}
                                >
                                    <SmoothImage
                                        src={imageSrc}
                                        blurDataURL={item.blurDataURL}
                                        alt={item.title}
                                        fill
                                        sizes={GRID_IMAGE_SIZES}
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                        priority={isAboveFold}
                                    />
                                    {/* Video Indicator */}
                                    {item.type === "video" && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/10">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white backdrop-blur-md">
                                                <Play size={20} fill="currentColor" />
                                            </div>
                                        </div>
                                    )}
                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 via-transparent to-transparent p-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                        <h3 className="font-serif text-lg font-medium text-white">{item.title}</h3>
                                        <span className="text-xs text-stone-300">{item.date}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}

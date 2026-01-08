"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ZhiGalleryItem, OriginalLoadState } from "../types";

export type UseGalleryNavigationOptions = {
    items: ZhiGalleryItem[];
};

export type UseGalleryNavigationReturn = {
    selectedItem: ZhiGalleryItem | null;
    currentIndex: number;
    slideDirection: "left" | "right" | null;
    zoomLevel: number;
    setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
    handleOpen: (item: ZhiGalleryItem) => void;
    handleClose: () => void;
    handleNext: (e?: React.MouseEvent) => void;
    handlePrev: (e?: React.MouseEvent) => void;
    handleThumbnailClick: (targetIndex: number) => void;
    drawerOpen: boolean;
    setDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export function useGalleryNavigation({
    items,
}: UseGalleryNavigationOptions): UseGalleryNavigationReturn {
    const [selectedItem, setSelectedItem] = useState<ZhiGalleryItem | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const navigateTo = useCallback((targetIndex: number, direction: "left" | "right") => {
        const targetItem = items[targetIndex];
        if (!targetItem) return;
        setSlideDirection(direction);
        setSelectedItem(targetItem);
        setCurrentIndex(targetIndex);
        setZoomLevel(1);
        requestAnimationFrame(() => {
            setTimeout(() => setSlideDirection(null), 250);
        });
    }, [items]);

    const handleOpen = useCallback((item: ZhiGalleryItem) => {
        const idx = items.findIndex((i) => i.id === item.id);
        setSelectedItem(item);
        setCurrentIndex(idx >= 0 ? idx : 0);
        setZoomLevel(1);
        setDrawerOpen(false);
        setSlideDirection(null);
        if (typeof document !== "undefined") {
            document.body.style.overflow = "hidden";
        }
    }, [items]);

    const handleClose = useCallback(() => {
        setSelectedItem(null);
        setDrawerOpen(false);
        if (typeof document !== "undefined") {
            document.body.style.overflow = "unset";
        }
    }, []);

    const handleNext = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!selectedItem) return;
        const nextIdx = (currentIndex + 1) % items.length;
        navigateTo(nextIdx, "left");
    }, [selectedItem, currentIndex, items.length, navigateTo]);

    const handlePrev = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!selectedItem) return;
        const prevIdx = (currentIndex - 1 + items.length) % items.length;
        navigateTo(prevIdx, "right");
    }, [selectedItem, currentIndex, items.length, navigateTo]);

    const handleThumbnailClick = useCallback((targetIndex: number) => {
        if (targetIndex === currentIndex) return;
        const direction = targetIndex > currentIndex ? "left" : "right";
        navigateTo(targetIndex, direction);
    }, [currentIndex, navigateTo]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!selectedItem) return;
            if (e.key === "Escape") handleClose();
            if (e.key === "ArrowRight") handleNext();
            if (e.key === "ArrowLeft") handlePrev();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedItem, handleClose, handleNext, handlePrev]);

    return {
        selectedItem,
        currentIndex,
        slideDirection,
        zoomLevel,
        setZoomLevel,
        handleOpen,
        handleClose,
        handleNext,
        handlePrev,
        handleThumbnailClick,
        drawerOpen,
        setDrawerOpen,
    };
}

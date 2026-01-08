"use client";

import { useRef, useCallback } from "react";

export type UseGalleryTouchReturn = {
    handleTouchStart: (e: React.TouchEvent) => void;
    handleTouchMove: (e: React.TouchEvent) => void;
    handleTouchEnd: () => void;
};

export type UseGalleryTouchOptions = {
    zoomLevel: number;
    onSwipeLeft: () => void;
    onSwipeRight: () => void;
};

export function useGalleryTouch({
    zoomLevel,
    onSwipeLeft,
    onSwipeRight,
}: UseGalleryTouchOptions): UseGalleryTouchReturn {
    const touchStartX = useRef<number | null>(null);
    const touchEndX = useRef<number | null>(null);
    const minSwipeDistance = 50;

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        const touch = e.touches[0];
        if (touch) {
            touchStartX.current = touch.clientX;
            touchEndX.current = null;
        }
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        const touch = e.touches[0];
        if (touch) {
            touchEndX.current = touch.clientX;
        }
    }, []);

    const handleTouchEnd = useCallback(() => {
        if (!touchStartX.current || !touchEndX.current) return;

        const distance = touchStartX.current - touchEndX.current;
        const isSwipe = Math.abs(distance) > minSwipeDistance;

        if (isSwipe && zoomLevel === 1) {
            if (distance > 0) {
                onSwipeLeft();
            } else {
                onSwipeRight();
            }
        }

        touchStartX.current = null;
        touchEndX.current = null;
    }, [zoomLevel, onSwipeLeft, onSwipeRight]);

    return {
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,
    };
}

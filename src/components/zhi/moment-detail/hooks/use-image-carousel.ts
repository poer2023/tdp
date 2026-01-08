"use client";

import { useRef, useCallback, useState } from "react";

export type UseImageCarouselOptions = {
    imageCount: number;
};

export type UseImageCarouselReturn = {
    currentImageIndex: number;
    setCurrentImageIndex: (index: number | ((prev: number) => number)) => void;
    handleTouchStart: (e: React.TouchEvent) => void;
    handleTouchMove: (e: React.TouchEvent) => void;
    handleTouchEnd: () => void;
    goToNext: () => void;
    goToPrev: () => void;
};

export function useImageCarousel({ imageCount }: UseImageCarouselOptions): UseImageCarouselReturn {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const touchStartX = useRef<number | null>(null);
    const touchEndX = useRef<number | null>(null);
    const minSwipeDistance = 50;

    const goToNext = useCallback(() => {
        if (imageCount > 1) {
            setCurrentImageIndex((prev) => (prev + 1) % imageCount);
        }
    }, [imageCount]);

    const goToPrev = useCallback(() => {
        if (imageCount > 1) {
            setCurrentImageIndex((prev) => (prev - 1 + imageCount) % imageCount);
        }
    }, [imageCount]);

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

        if (isSwipe && imageCount > 1) {
            if (distance > 0) {
                goToNext();
            } else {
                goToPrev();
            }
        }

        touchStartX.current = null;
        touchEndX.current = null;
    }, [imageCount, goToNext, goToPrev]);

    return {
        currentImageIndex,
        setCurrentImageIndex,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,
        goToNext,
        goToPrev,
    };
}

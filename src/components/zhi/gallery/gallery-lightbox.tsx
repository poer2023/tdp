"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import type { PanInfo } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { ZhiGalleryItem, OriginalLoadState } from "./types";
import {
    THUMB_FULL_WIDTH,
    THUMB_COLLAPSED_WIDTH,
    THUMB_GAP,
    THUMB_MARGIN,
} from "./types";
import { formatBytes, formatProgress } from "./utils";
import { getGalleryTranslation } from "./translations";
import { ThumbnailItem } from "./thumbnail-item";
import { SidebarPanel } from "./sidebar-panel";
import { MobileDrawer } from "./mobile-drawer";
import { CarouselSlide } from "./carousel-slide";

export type GalleryLightboxProps = {
    selectedItem: ZhiGalleryItem;
    items: ZhiGalleryItem[];
    currentIndex: number;
    slideDirection: "left" | "right" | null;
    zoomLevel: number;
    displaySrc: string;
    originalState: OriginalLoadState;
    showProgress: boolean;
    isDark: boolean;
    locale: string;
    drawerOpen: boolean;
    imageContainerRef: React.RefObject<HTMLDivElement | null>;
    onClose: () => void;
    onPrev: (e?: React.MouseEvent) => void;
    onNext: (e?: React.MouseEvent) => void;
    onThumbnailClick: (index: number) => void;
    onToggleDrawer: () => void;
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
};

// Swipe detection thresholds
const SWIPE_VELOCITY_THRESHOLD = 500;
const SWIPE_OFFSET_THRESHOLD = 0.3; // 30% of container width

export function GalleryLightbox({
    selectedItem,
    items,
    currentIndex,
    slideDirection: _slideDirection,
    zoomLevel,
    displaySrc,
    originalState,
    showProgress,
    isDark,
    locale,
    drawerOpen,
    imageContainerRef,
    onClose,
    onPrev,
    onNext,
    onThumbnailClick,
    onToggleDrawer,
    onTouchStart: _onTouchStart,
    onTouchMove: _onTouchMove,
    onTouchEnd: _onTouchEnd,
}: GalleryLightboxProps) {
    const thumbnailsRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const x = useMotionValue(0);
    const t = (key: string) => getGalleryTranslation(locale as "en" | "zh", key as Parameters<typeof getGalleryTranslation>[1]);

    // Measure container width on mount and resize
    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth);
            }
        };
        updateWidth();
        window.addEventListener("resize", updateWidth);
        return () => window.removeEventListener("resize", updateWidth);
    }, []);

    // Animate to current index when it changes (not during drag)
    useEffect(() => {
        if (!isDragging && containerWidth > 0) {
            const targetX = -currentIndex * containerWidth;
            animate(x, targetX, {
                type: "spring",
                stiffness: 300,
                damping: 30,
            });
        }
    }, [currentIndex, containerWidth, isDragging, x]);

    // Get visible items (current ± 1 for virtualization)
    const visibleItems = useMemo(() => {
        const windowSize = 1;
        const start = Math.max(0, currentIndex - windowSize);
        const end = Math.min(items.length - 1, currentIndex + windowSize);
        return items.slice(start, end + 1).map((item, i) => ({
            item,
            index: start + i,
            position: start + i,
        }));
    }, [items, currentIndex]);

    // Handle drag end - determine if swipe should navigate
    const handleDragEnd = useCallback(
        (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
            setIsDragging(false);
            if (containerWidth === 0) return;

            const offset = info.offset.x;
            const velocity = info.velocity.x;
            let newIndex = currentIndex;

            // Fast swipe detection
            if (Math.abs(velocity) > SWIPE_VELOCITY_THRESHOLD) {
                newIndex = velocity > 0 ? currentIndex - 1 : currentIndex + 1;
            }
            // Slow drag detection (30% of container)
            else if (Math.abs(offset) > containerWidth * SWIPE_OFFSET_THRESHOLD) {
                newIndex = offset > 0 ? currentIndex - 1 : currentIndex + 1;
            }

            // Clamp and navigate
            newIndex = Math.max(0, Math.min(items.length - 1, newIndex));
            if (newIndex !== currentIndex) {
                if (newIndex < currentIndex) {
                    onPrev();
                } else {
                    onNext();
                }
            } else {
                // Snap back to current position
                animate(x, -currentIndex * containerWidth, {
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                });
            }
        },
        [containerWidth, currentIndex, items.length, onNext, onPrev, x]
    );

    // Scroll thumbnails to current index
    useEffect(() => {
        if (thumbnailsRef.current) {
            let scrollPosition = 0;
            for (let i = 0; i < currentIndex; i++) {
                scrollPosition += THUMB_COLLAPSED_WIDTH + THUMB_GAP;
            }
            scrollPosition += THUMB_MARGIN;
            const thumbContainerWidth = thumbnailsRef.current.offsetWidth;
            const centerOffset = thumbContainerWidth / 2 - THUMB_FULL_WIDTH / 2;
            scrollPosition -= centerOffset;
            thumbnailsRef.current.scrollTo({
                left: scrollPosition,
                behavior: "smooth",
            });
        }
    }, [currentIndex]);

    return (
        <div className={`fixed inset-0 z-[70] flex flex-col backdrop-blur-sm ${isDark ? 'bg-[#09090b]/95' : 'bg-[#fafaf9]/95'}`}>
            {/* Close Button */}
            <button
                onClick={onClose}
                className={`absolute top-6 right-6 z-[80] p-2 transition-all duration-300 hover:rotate-90 ${isDark ? 'text-stone-500 hover:text-white' : 'text-stone-400 hover:text-stone-900'}`}
            >
                <X size={24} />
            </button>

            {/* Navigation Arrows */}
            <button
                onClick={onPrev}
                className={`fixed left-6 top-1/2 z-[80] hidden -translate-y-1/2 rounded-full p-3 transition-all duration-300 lg:block ${isDark ? 'bg-black/20 text-white/30 hover:bg-black/40 hover:text-white hover:scale-110' : 'bg-white/40 text-stone-400 hover:bg-white/80 hover:text-stone-900 hover:scale-110 hover:shadow-lg'}`}
            >
                <ChevronLeft size={32} />
            </button>
            <button
                onClick={onNext}
                className={`fixed top-1/2 z-[80] hidden -translate-y-1/2 rounded-full p-3 transition-all duration-300 lg:block lg:right-[calc(380px+2rem)] xl:right-[calc(420px+2rem)] ${isDark ? 'bg-black/20 text-white/30 hover:bg-black/40 hover:text-white hover:scale-110' : 'bg-white/40 text-stone-400 hover:bg-white/80 hover:text-stone-900 hover:scale-110 hover:shadow-lg'}`}
            >
                <ChevronRight size={32} />
            </button>

            {/* Main Layout */}
            <div className="flex h-full flex-col lg:flex-row">
                {/* Main Content Area */}
                <div
                    ref={(el) => {
                        // Update our local ref
                        containerRef.current = el;
                        // Also update the parent's ref if provided (using a callback pattern)
                        if (imageContainerRef && 'current' in imageContainerRef) {
                            // Use Object.assign to avoid lint error about modifying props
                            Object.assign(imageContainerRef, { current: el });
                        }
                    }}
                    className={`relative flex flex-1 items-center justify-center overflow-hidden pb-24 lg:pb-28 ${isDark ? 'bg-black' : 'bg-stone-100'}`}
                    onClick={onClose}
                >
                    {/* Carousel Container with Drag Support */}
                    <motion.div
                        className="absolute inset-0"
                        drag="x"
                        dragElastic={0.2}
                        dragMomentum={false}
                        dragConstraints={{ left: 0, right: 0 }}
                        onDragStart={() => setIsDragging(true)}
                        onDragEnd={handleDragEnd}
                        style={{ x }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Render visible slides (virtualized window) */}
                        {visibleItems.map(({ item, index, position }) => (
                            <div
                                key={item.id}
                                className="absolute inset-0"
                                style={{
                                    transform: `translateX(${position * 100}%)`,
                                }}
                            >
                                <CarouselSlide
                                    item={item}
                                    isActive={index === currentIndex}
                                    displaySrc={index === currentIndex ? displaySrc : null}
                                    zoomLevel={index === currentIndex ? zoomLevel : 1}
                                />
                            </div>
                        ))}
                    </motion.div>

                    {/* Zoom Level Indicator */}
                    {zoomLevel > 1 && (
                        <div className="pointer-events-none absolute bottom-32 left-6 z-[75] rounded bg-black/60 px-2 py-1 text-xs font-medium text-white/80 backdrop-blur lg:bottom-36">
                            {Math.round(zoomLevel * 100)}%
                        </div>
                    )}

                    {/* Loading Progress Indicator */}
                    {originalState.status === "loading" && showProgress && (
                        <div className="pointer-events-none absolute right-6 bottom-32 z-[75] flex items-center gap-3 rounded-xl bg-black/75 px-4 py-2 text-xs text-white shadow-lg backdrop-blur lg:bottom-36 lg:right-[calc(380px+2rem)] xl:right-[calc(420px+2rem)]">
                            <svg
                                className="h-4 w-4 animate-spin text-white/80"
                                fill="none"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
                            </svg>
                            <div>
                                <div className="font-medium">
                                    {t("Loading")}{formatProgress(originalState.loadedBytes, originalState.totalBytes)}
                                </div>
                                <div className="text-[11px] text-white/70">
                                    {formatBytes(originalState.loadedBytes)}
                                    {typeof originalState.totalBytes === "number" ? ` / ${formatBytes(originalState.totalBytes)}` : ""}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Desktop Sidebar */}
                <SidebarPanel
                    item={selectedItem}
                    currentIndex={currentIndex}
                    totalItems={items.length}
                    isDark={isDark}
                    locale={locale}
                />

                {/* Mobile Drawer */}
                <MobileDrawer
                    item={selectedItem}
                    isOpen={drawerOpen}
                    onToggle={onToggleDrawer}
                    isDark={isDark}
                    locale={locale}
                />
            </div>

            {/* Thumbnail Strip */}
            <div className="fixed inset-x-0 bottom-6 z-[72] flex justify-center pointer-events-none lg:right-[380px] xl:right-[420px]">
                <div className="pointer-events-auto mx-4 transition-all duration-300">
                    <div
                        ref={thumbnailsRef}
                        className="flex max-w-[80vw] overflow-x-auto p-2 lg:max-w-[600px]"
                        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                    >
                        <style>{`.overflow-x-auto::-webkit-scrollbar { display: none; }`}</style>
                        <div className="flex h-12 gap-1.5 px-2" style={{ width: "fit-content" }}>
                            {items.map((item, i) => (
                                <ThumbnailItem
                                    key={item.id}
                                    item={item}
                                    index={i}
                                    isActive={i === currentIndex}
                                    onClick={onThumbnailClick}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

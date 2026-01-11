"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Info, ArrowLeft } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { ZhiGalleryItem, OriginalLoadState } from "./types";
import {
    THUMB_FULL_WIDTH,
    THUMB_COLLAPSED_WIDTH,
    THUMB_GAP,
} from "./types";
import { formatBytes, formatProgress } from "./utils";
import { buildImageUrl, buildImageSrcSet } from "@/lib/image-resize";
import { getGalleryTranslation } from "./translations";
import { ThumbnailItem } from "./thumbnail-item";
import { SidebarPanel } from "./sidebar-panel";
import { MobileDrawer } from "./mobile-drawer";
import { CustomVideoPlayer } from "./custom-video-player";
import BlockLoader from "@/components/ui/block-loader";

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

export function GalleryLightbox({
    selectedItem,
    items,
    currentIndex,
    slideDirection,
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
    onTouchStart,
    onTouchMove,
    onTouchEnd,
}: GalleryLightboxProps) {
    const thumbnailsRef = useRef<HTMLDivElement>(null);
    const t = (key: string) => getGalleryTranslation(locale as "en" | "zh", key as Parameters<typeof getGalleryTranslation>[1]);

    // State for sidebar collapsed/expanded
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Track if current image has loaded (for showing loader placeholder)
    const [imageLoaded, setImageLoaded] = useState(false);
    const prevDisplaySrcRef = useRef<string>("");

    // Reset imageLoaded when switching images (displaySrc changes)
    useEffect(() => {
        if (displaySrc && displaySrc !== prevDisplaySrcRef.current) {
            setImageLoaded(false);
            prevDisplaySrcRef.current = displaySrc;
        }
    }, [displaySrc]);

    // Also reset when currentIndex changes (immediate feedback)
    useEffect(() => {
        setImageLoaded(false);
    }, [currentIndex]);

    // Thumbnail virtualizer for horizontal scrolling
    // eslint-disable-next-line react-hooks/incompatible-library -- useVirtualizer is safe here, we access its functions only within effects
    const rowVirtualizer = useVirtualizer({
        count: items.length,
        getScrollElement: () => thumbnailsRef.current,
        estimateSize: (index) => index === currentIndex ? THUMB_FULL_WIDTH : THUMB_COLLAPSED_WIDTH,
        horizontal: true,
        overscan: 5,
        gap: THUMB_GAP,
    });

    // Force re-measure when currentIndex changes (active item has different width)
    useEffect(() => {
        rowVirtualizer.measure();
    }, [currentIndex, rowVirtualizer]);

    // Scroll thumbnails to current index
    useEffect(() => {
        if (thumbnailsRef.current && items.length > 0) {
            rowVirtualizer.scrollToIndex(currentIndex, { align: "center", behavior: "smooth" });
        }
    }, [currentIndex, items.length, rowVirtualizer]);

    return (
        <div className={`fixed inset-0 z-[70] flex flex-col backdrop-blur-sm ${isDark ? 'bg-[#09090b]/95' : 'bg-[#fafaf9]/95'}`}>
            {/* Back Button - Top Left */}
            <button
                onClick={onClose}
                className={`absolute top-6 left-6 z-[80] flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-all duration-300 ${isDark ? 'text-stone-400 hover:text-white hover:bg-white/10' : 'text-stone-500 hover:text-stone-900 hover:bg-black/5'}`}
            >
                <ArrowLeft size={18} />
                <span className="hidden sm:inline">{locale === "zh" ? "返回" : "Back"}</span>
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
                className={`fixed top-1/2 z-[80] hidden -translate-y-1/2 rounded-full p-3 transition-all duration-300 lg:block ${sidebarCollapsed ? 'right-6' : 'lg:right-[calc(380px+2rem)] xl:right-[calc(420px+2rem)]'} ${isDark ? 'bg-black/20 text-white/30 hover:bg-black/40 hover:text-white hover:scale-110' : 'bg-white/40 text-stone-400 hover:bg-white/80 hover:text-stone-900 hover:scale-110 hover:shadow-lg'}`}
            >
                <ChevronRight size={32} />
            </button>

            {/* Main Layout */}
            <div className="flex h-full flex-col lg:flex-row">
                {/* Main Content Area - 固定上下 padding，内容自适应 */}
                <div
                    ref={imageContainerRef}
                    className={`relative flex flex-1 items-center justify-center overflow-hidden py-20 pb-28 lg:py-20 lg:pb-32 ${isDark ? 'bg-black' : 'bg-stone-100'}`}
                    onClick={onClose}
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                >
                    {/* 使用 CSS 变量驱动动画，避免 key 变化导致组件重挂载 */}
                    <div
                        className="transition-all duration-300 ease-out"
                        style={{
                            opacity: slideDirection ? 0.7 : 1,
                            transform: slideDirection === "left"
                                ? "translateX(0)"
                                : slideDirection === "right"
                                    ? "translateX(0)"
                                    : "translateX(0)",
                        }}
                    >
                        <div
                            className="relative transition-transform duration-300 ease-out"
                            style={{ transform: `scale(${zoomLevel})` }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {selectedItem.type === "video" ? (
                                <CustomVideoPlayer
                                    src={selectedItem.url}
                                    poster={selectedItem.thumbnail}
                                    className="w-auto max-w-[95vw] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] lg:max-w-[55vw]"
                                    style={{ maxHeight: 'calc(100vh - 280px)' }}
                                />
                            ) : (
                                <>
                                    {/* BlockLoader placeholder - shown while image is loading */}
                                    {!imageLoaded && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <BlockLoader
                                                blockColor={isDark ? "#3b82f6" : "#2563eb"}
                                                size={32}
                                                gap={4}
                                                speed={0.8}
                                            />
                                        </div>
                                    )}
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={displaySrc?.startsWith("blob:") ? displaySrc : buildImageUrl(displaySrc || selectedItem.mediumPath || selectedItem.url, 1200)}
                                        srcSet={displaySrc?.startsWith("blob:") ? undefined : buildImageSrcSet(selectedItem.mediumPath || selectedItem.url, [640, 960, 1200, 1600])}
                                        sizes="(min-width: 1024px) 55vw, 95vw"
                                        alt={selectedItem.title}
                                        className={`w-auto max-w-[95vw] select-none object-contain shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] lg:max-w-[55vw] pointer-events-none transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                                        style={{ maxHeight: 'calc(100vh - 240px)' }}
                                        draggable={false}
                                        onLoad={() => setImageLoaded(true)}
                                    />
                                </>
                            )}
                        </div>
                    </div>

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

                {/* Desktop Sidebar - Collapsible */}
                <div className={`hidden lg:flex h-full transition-all duration-300 ${sidebarCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto'}`}>
                    <SidebarPanel
                        item={selectedItem}
                        currentIndex={currentIndex}
                        totalItems={items.length}
                        isDark={isDark}
                        locale={locale}
                        onCollapse={() => setSidebarCollapsed(true)}
                    />
                </div>

                {/* Mobile Drawer */}
                <MobileDrawer
                    item={selectedItem}
                    isOpen={drawerOpen}
                    onToggle={onToggleDrawer}
                    isDark={isDark}
                    locale={locale}
                />
            </div>

            {/* Collapsed Sidebar Toggle - Small circle at bottom right (desktop only) */}
            {sidebarCollapsed && (
                <button
                    onClick={() => setSidebarCollapsed(false)}
                    className={`fixed bottom-24 right-6 z-[80] hidden lg:flex items-center justify-center h-12 w-12 rounded-full shadow-lg transition-all duration-300 hover:scale-110 ${isDark ? 'bg-stone-800 text-white hover:bg-stone-700' : 'bg-white text-stone-700 hover:bg-stone-50'}`}
                    title={locale === "zh" ? "展开详情" : "Show details"}
                >
                    <Info size={20} />
                </button>
            )}

            {/* Thumbnail Strip - Virtualized */}
            <div className={`fixed inset-x-0 bottom-6 z-[72] flex justify-center pointer-events-none transition-all duration-300 ${sidebarCollapsed ? 'lg:right-0' : 'lg:right-[380px] xl:right-[420px]'}`}>
                <div className="pointer-events-auto mx-4 transition-all duration-300">
                    <div
                        ref={thumbnailsRef}
                        className="max-w-[80vw] overflow-x-auto p-2 lg:max-w-[600px]"
                        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                    >
                        <style>{`.overflow-x-auto::-webkit-scrollbar { display: none; }`}</style>
                        <div
                            className="relative h-12"
                            style={{ width: `${rowVirtualizer.getTotalSize()}px` }}
                        >
                            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                                const item = items[virtualItem.index];
                                if (!item) return null;
                                return (
                                    <div
                                        key={item.id}
                                        className="absolute top-0 h-full"
                                        style={{
                                            left: `${virtualItem.start}px`,
                                            width: `${virtualItem.size}px`,
                                        }}
                                    >
                                        <ThumbnailItem
                                            item={item}
                                            index={virtualItem.index}
                                            isActive={virtualItem.index === currentIndex}
                                            onClick={onThumbnailClick}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

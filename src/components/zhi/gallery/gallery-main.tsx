"use client";
/* eslint-disable react-hooks/exhaustive-deps */

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  X,
  Play,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getLocaleFromPathname } from "@/lib/i18n";
import { useTheme } from "next-themes";

import { SmoothImage } from "@/components/ui/smooth-image";

// Import from extracted modules
import type { ZhiGalleryItem, ZhiGalleryProps, OriginalLoadState } from "./types";
import {
  THUMB_FULL_WIDTH,
  THUMB_COLLAPSED_WIDTH,
  THUMB_GAP,
  THUMB_MARGIN,
  GRID_IMAGE_SIZES,
} from "./types";
import {
  formatBytes,
  formatProgress,
} from "./utils";
import { getGalleryTranslation } from "./translations";
import { ThumbnailItem } from "./thumbnail-item";
import { SidebarPanel } from "./sidebar-panel";
import { MobileDrawer } from "./mobile-drawer";

// Re-export types for backward compatibility
export type { ZhiGalleryItem, ZhiGalleryProps }

export function ZhiGallery({ items }: ZhiGalleryProps) {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname) ?? "en";
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [selectedItem, setSelectedItem] = useState<ZhiGalleryItem | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Original image loading state
  const [displaySrc, setDisplaySrc] = useState<string>("");
  const [originalState, setOriginalState] = useState<OriginalLoadState>({
    status: "idle",
    loadedBytes: 0,
    totalBytes: null,
  });
  const [showProgress, setShowProgress] = useState(true);
  const progressHideTimerRef = useRef<number | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  // Mobile drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Slide animation state
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(null);

  // Thumbnails ref for scrolling
  const thumbnailsRef = useRef<HTMLDivElement>(null);

  // Image container ref for wheel zoom
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Touch swipe state for mobile navigation
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
        // Swiped left -> next image
        const nextIdx = (currentIndex + 1) % items.length;
        const targetItem = items[nextIdx];
        if (targetItem) {
          setSlideDirection("left");
          setSelectedItem(targetItem);
          setCurrentIndex(nextIdx);
          setZoomLevel(1);
          requestAnimationFrame(() => {
            setTimeout(() => setSlideDirection(null), 250);
          });
        }
      } else {
        // Swiped right -> previous image
        const prevIdx = (currentIndex - 1 + items.length) % items.length;
        const targetItem = items[prevIdx];
        if (targetItem) {
          setSlideDirection("right");
          setSelectedItem(targetItem);
          setCurrentIndex(prevIdx);
          setZoomLevel(1);
          requestAnimationFrame(() => {
            setTimeout(() => setSlideDirection(null), 250);
          });
        }
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
  }, [currentIndex, items, zoomLevel]);


  // Use extracted translation function
  const t = (key: string) => getGalleryTranslation(locale, key as Parameters<typeof getGalleryTranslation>[1]);

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
    // Cleanup XHR
    xhrRef.current?.abort();
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (typeof document !== "undefined") {
      document.body.style.overflow = "unset";
    }
  }, []);

  const navigateTo = useCallback((targetIndex: number, direction: "left" | "right") => {
    const targetItem = items[targetIndex];
    if (!targetItem) return;
    setSlideDirection(direction);
    setSelectedItem(targetItem);
    setCurrentIndex(targetIndex);
    setZoomLevel(1);
    // Reset slide direction after animation
    requestAnimationFrame(() => {
      setTimeout(() => setSlideDirection(null), 250);
    });
  }, [items]);

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

  // Scroll thumbnails to current index
  useEffect(() => {
    if (thumbnailsRef.current && selectedItem) {
      let scrollPosition = 0;
      for (let i = 0; i < currentIndex; i++) {
        scrollPosition += THUMB_COLLAPSED_WIDTH + THUMB_GAP;
      }
      scrollPosition += THUMB_MARGIN;
      const containerWidth = thumbnailsRef.current.offsetWidth;
      const centerOffset = containerWidth / 2 - THUMB_FULL_WIDTH / 2;
      scrollPosition -= centerOffset;
      thumbnailsRef.current.scrollTo({
        left: scrollPosition,
        behavior: "smooth",
      });
    }
  }, [currentIndex, selectedItem]);

  // Preload adjacent images
  useEffect(() => {
    if (!selectedItem || items.length === 0) return;

    const preloadImage = (src: string | undefined) => {
      if (!src) return;
      const img = new Image();
      img.src = src;
    };

    const prevIdx = (currentIndex - 1 + items.length) % items.length;
    const nextIdx = (currentIndex + 1) % items.length;
    const prevItem = items[prevIdx];
    const nextItem = items[nextIdx];

    if (prevItem) {
      preloadImage(prevItem.mediumPath || prevItem.thumbnail || prevItem.url);
    }
    if (nextItem) {
      preloadImage(nextItem.mediumPath || nextItem.thumbnail || nextItem.url);
    }

  }, [currentIndex, selectedItem, items.length]);

  // Handle keyboard navigation
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

  // Load original image with progress
  useEffect(() => {
    if (!selectedItem) return;

    // Abort previous request
    xhrRef.current?.abort();
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    // Start with medium or thumbnail
    const initialSrc = selectedItem.mediumPath || selectedItem.thumbnail || selectedItem.url;
    setDisplaySrc(initialSrc);

    // If we have medium path, load original in background
    if (selectedItem.mediumPath && selectedItem.mediumPath !== selectedItem.url) {
      if (typeof window === "undefined" || typeof window.XMLHttpRequest === "undefined") {
        setOriginalState({ status: "idle", loadedBytes: 0, totalBytes: null });
        return;
      }

      const xhr = new window.XMLHttpRequest();
      xhrRef.current = xhr;
      setOriginalState({ status: "loading", loadedBytes: 0, totalBytes: null });
      setShowProgress(true);

      xhr.open("GET", selectedItem.url, true);
      xhr.responseType = "blob";

      xhr.onprogress = (event) => {
        setOriginalState((prev) => ({
          status: "loading",
          loadedBytes: event.loaded,
          totalBytes: event.lengthComputable ? event.total : prev.totalBytes,
        }));
      };

      xhr.onerror = () => {
        setOriginalState({ status: "error", loadedBytes: 0, totalBytes: null });
        setDisplaySrc(selectedItem.url);
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300 && xhr.response instanceof Blob) {
          const blob = xhr.response;
          const url = URL.createObjectURL(blob);
          objectUrlRef.current = url;
          setDisplaySrc(url);
          setOriginalState({ status: "success", loadedBytes: blob.size, totalBytes: blob.size });
        } else {
          setOriginalState({ status: "error", loadedBytes: 0, totalBytes: null });
          setDisplaySrc(selectedItem.url);
        }
      };

      xhr.send();

      return () => {
        xhr.abort();
      };
    } else {
      setOriginalState({ status: "success", loadedBytes: 0, totalBytes: null });
      return undefined;
    }
  }, [selectedItem?.id, selectedItem?.url, selectedItem?.mediumPath, selectedItem?.thumbnail]);

  // Auto-hide progress indicator
  useEffect(() => {
    if (progressHideTimerRef.current) {
      window.clearTimeout(progressHideTimerRef.current);
      progressHideTimerRef.current = null;
    }
    if (originalState.status === "loading") {
      setShowProgress(true);
    }
    if (originalState.status === "success" && originalState.loadedBytes > 0) {
      progressHideTimerRef.current = window.setTimeout(() => {
        setShowProgress(false);
      }, 2000);
    }
    return () => {
      if (progressHideTimerRef.current) {
        window.clearTimeout(progressHideTimerRef.current);
      }
    };
  }, [originalState]);

  // Wheel zoom (center-based)
  useEffect(() => {
    const el = imageContainerRef.current;
    if (!el || !selectedItem) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY;
      const factor = delta > 0 ? 1.1 : 0.9;
      setZoomLevel((prev) => Math.max(1, Math.min(4, prev * factor)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [selectedItem]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      xhrRef.current?.abort();
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);
  // Distribute items into columns for row-first ordering
  // This ensures new items appear at top-left instead of filling columns top-to-bottom
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

  // Get column count based on screen size (matches Tailwind breakpoints)
  const [columnCount, setColumnCount] = useState(1);

  useEffect(() => {
    const updateColumnCount = () => {
      if (window.innerWidth >= 1024) {
        setColumnCount(4); // lg: 4 columns for more content
      } else if (window.innerWidth >= 640) {
        setColumnCount(3); // sm: 3 columns
      } else {
        setColumnCount(2); // mobile: 2 columns for more content density
      }
    };
    updateColumnCount();
    window.addEventListener('resize', updateColumnCount);
    return () => window.removeEventListener('resize', updateColumnCount);
  }, []);

  const columns = useMemo(() => distributeToColumns(items, columnCount), [items, columnCount, distributeToColumns]);

  return (
    <div className="w-full">
      {/* Masonry Grid - Row-first ordering, mobile-first 2-column layout */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
        {columns.map((column, colIndex) => (
          <div key={colIndex} className="flex flex-col gap-3 sm:gap-4 lg:gap-6">
            {column.map((item, index) => {
              const isAboveFold = colIndex * column.length + index < 6;
              const imageSrc =
                item.type === "video"
                  ? item.thumbnail || item.url
                  : item.smallThumbPath || item.mediumPath || item.thumbnail || item.url;

              // Calculate aspect ratio for proper sizing
              const aspectRatio = item.width && item.height ? item.width / item.height : 4 / 3;

              return (
                <div
                  key={item.id}
                  className="group relative cursor-pointer overflow-hidden rounded-lg bg-stone-200 dark:bg-stone-800"
                  onClick={() => handleOpen(item)}
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

      {/* Lightbox Modal */}
      {selectedItem && (
        <div className={`fixed inset-0 z-[70] flex flex-col backdrop-blur-sm ${isDark ? 'bg-[#09090b]/95' : 'bg-[#fafaf9]/95'}`}>
          {/* Close Button */}
          <button
            onClick={handleClose}
            className={`absolute top-6 right-6 z-[80] p-2 transition-all duration-300 hover:rotate-90 ${isDark ? 'text-stone-500 hover:text-white' : 'text-stone-400 hover:text-stone-900'}`}
          >
            <X size={24} />
          </button>

          {/* Navigation Arrows - Fixed position at modal level */}
          <button
            onClick={handlePrev}
            className={`fixed left-6 top-1/2 z-[80] hidden -translate-y-1/2 rounded-full p-3 transition-all duration-300 lg:block ${isDark ? 'bg-black/20 text-white/30 hover:bg-black/40 hover:text-white hover:scale-110' : 'bg-white/40 text-stone-400 hover:bg-white/80 hover:text-stone-900 hover:scale-110 hover:shadow-lg'}`}
          >
            <ChevronLeft size={32} />
          </button>
          <button
            onClick={handleNext}
            className={`fixed top-1/2 z-[80] hidden -translate-y-1/2 rounded-full p-3 transition-all duration-300 lg:block lg:right-[calc(380px+2rem)] xl:right-[calc(420px+2rem)] ${isDark ? 'bg-black/20 text-white/30 hover:bg-black/40 hover:text-white hover:scale-110' : 'bg-white/40 text-stone-400 hover:bg-white/80 hover:text-stone-900 hover:scale-110 hover:shadow-lg'}`}
          >
            <ChevronRight size={32} />
          </button>

          {/* Main Layout */}
          <div className="flex h-full flex-col lg:flex-row">
            {/* Main Content Area (Image/Video) */}
            <div
              ref={imageContainerRef}
              className={`relative flex flex-1 items-center justify-center overflow-hidden pb-24 lg:pb-28 ${isDark ? 'bg-black' : 'bg-stone-100'}`}
              onClick={handleClose}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Image with slide animation */}
              <motion.div
                key={selectedItem.id}
                initial={{ opacity: 0, x: slideDirection === "left" ? 100 : slideDirection === "right" ? -100 : 0 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {/* Zoom container - separate from motion to avoid transform conflict */}
                <div
                  className="relative transition-transform duration-300 ease-out"
                  style={{ transform: `scale(${zoomLevel})` }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {selectedItem.type === "video" ? (
                    <video
                      src={selectedItem.url}
                      controls
                      autoPlay
                      loop
                      className="w-[95vw] max-h-[75vh] h-auto shadow-2xl lg:w-auto lg:max-h-[70vh] lg:max-w-[55vw]"
                    />
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element -- supports blob URLs from XHR loading */
                    <img
                      src={displaySrc || selectedItem.mediumPath || selectedItem.thumbnail || selectedItem.url}
                      alt={selectedItem.title}
                      className="w-[95vw] max-h-[75vh] h-auto select-none object-contain shadow-2xl lg:w-auto lg:max-h-[70vh] lg:max-w-[55vw] pointer-events-none"
                      draggable={false}
                    />
                  )}
                </div>
              </motion.div>

              {/* Zoom Level Indicator - only show when zoomed */}
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
                    <circle
                      className="opacity-20"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                    <path
                      className="opacity-90"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"
                    />
                  </svg>
                  <div>
                    <div className="font-medium">
                      {t("Loading")}{formatProgress(originalState.loadedBytes, originalState.totalBytes)}
                    </div>
                    <div className="text-[11px] text-white/70">
                      {formatBytes(originalState.loadedBytes)}
                      {typeof originalState.totalBytes === "number"
                        ? ` / ${formatBytes(originalState.totalBytes)}`
                        : ""}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Sidebar Details Panel */}
            <SidebarPanel
              item={selectedItem}
              currentIndex={currentIndex}
              totalItems={items.length}
              isDark={isDark}
              locale={locale}
            />

            {/* Mobile Bottom Drawer */}
            <MobileDrawer
              item={selectedItem}
              isOpen={drawerOpen}
              onToggle={() => setDrawerOpen(!drawerOpen)}
              isDark={isDark}
              locale={locale}
            />
          </div>

          {/* Floating Thumbnail Strip */}
          <div className="fixed inset-x-0 bottom-6 z-[72] flex justify-center pointer-events-none lg:right-[380px] xl:right-[420px]">
            <div className="pointer-events-auto mx-4 transition-all duration-300">
              <div
                ref={thumbnailsRef}
                className="flex max-w-[80vw] overflow-x-auto p-2 lg:max-w-[600px]"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                <style>{`
                    .overflow-x-auto::-webkit-scrollbar {
                      display: none;
                    }
                  `}</style>
                <div className="flex h-12 gap-1.5 px-2" style={{ width: "fit-content" }}>
                  {items.map((item, i) => (
                    <ThumbnailItem
                      key={item.id}
                      item={item}
                      index={i}
                      isActive={i === currentIndex}
                      onClick={handleThumbnailClick}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div >
      )
      }
    </div >
  );
}

export default ZhiGallery;

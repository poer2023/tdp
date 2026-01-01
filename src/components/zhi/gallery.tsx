"use client";
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  X,
  Play,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  HardDrive,
} from "lucide-react";
import { getLocaleFromPathname } from "@/lib/i18n";
import { useTheme } from "next-themes";

// Dynamically import the entire map component to avoid SSR issues
const LocationMap = dynamic(
  () => import("@/components/ui/map").then((mod) => {
    const { Map, MapMarker, MarkerContent, MapControls } = mod;

    return function LocationMapInner({
      lat,
      lng,
      _isDark,
      height = "160px",
      showZoomControl = true
    }: {
      lat: number;
      lng: number;
      _isDark?: boolean;
      height?: string;
      showZoomControl?: boolean;
    }) {
      return (
        <div style={{ height, width: "100%" }}>
          <Map
            center={[lng, lat]}
            zoom={13}
            scrollZoom={true}
            doubleClickZoom={true}
            className="h-full w-full"
          >
            <MapMarker longitude={lng} latitude={lat}>
              <MarkerContent>
                <div className="relative h-6 w-6 rounded-full border-2 border-white bg-blue-500 shadow-lg" />
              </MarkerContent>
            </MapMarker>
            {showZoomControl && <MapControls position="top-right" showZoom />}
          </Map>
        </div>
      );
    };
  }),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-stone-100 dark:bg-stone-800">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" />
      </div>
    )
  }
);



// Thumbnail dimensions
const THUMB_FULL_WIDTH = 120;
const THUMB_COLLAPSED_WIDTH = 35;
const THUMB_GAP = 2;
const THUMB_MARGIN = 2;

// Memoized thumbnail item component - uses CSS transitions for better performance
const ThumbnailItem = React.memo(function ThumbnailItem({
  item,
  index,
  isActive,
  onClick,
}: {
  item: ZhiGalleryItem;
  index: number;
  isActive: boolean;
  onClick: (index: number) => void;
}) {
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

// Original image loading state
type OriginalLoadState = {
  status: "idle" | "loading" | "success" | "error";
  loadedBytes: number;
  totalBytes: number | null;
};

export interface ZhiGalleryItem {
  id: string;
  type: "image" | "video";
  url: string;
  thumbnail?: string;
  title: string;
  description?: string;
  date: string;
  location?: string;
  exif?: {
    camera?: string;
    lens?: string;
    aperture?: string;
    iso?: string;
    shutter?: string;
  };
  width?: number;
  height?: number;
  // Extended fields for enhanced lightbox
  mediumPath?: string;
  smallThumbPath?: string;
  microThumbPath?: string;
  fileSize?: number;
  mimeType?: string;
  capturedAt?: string;
  createdAt?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
  locationName?: string;
  isLivePhoto?: boolean;
  livePhotoVideoPath?: string;
  storageType?: string;
}

interface ZhiGalleryProps {
  items: ZhiGalleryItem[];
}

// Helper functions
function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return "Unknown";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateString: string | null | undefined, locale: string = "zh"): string {
  if (!dateString) return locale === "zh" ? "未知" : "Unknown";
  const date = new Date(dateString);
  return date.toLocaleString(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatBytes(bytes: number): string {
  if (!bytes) return "0.00 MB";
  const mb = bytes / (1024 * 1024);
  if (mb >= 100) return `${mb.toFixed(0)} MB`;
  if (mb >= 10) return `${mb.toFixed(1)} MB`;
  return `${mb.toFixed(2)} MB`;
}

function formatProgress(loaded: number, total: number | null): string {
  if (!total || total <= 0) return "";
  const pct = Math.min(100, Math.round((loaded / total) * 100));
  return ` ${pct}%`;
}

function formatRelativeTime(dateString: string | null | undefined, locale: string = "zh"): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return locale === "zh" ? "今天" : "Today";
  if (diffDays === 1) return locale === "zh" ? "昨天" : "Yesterday";
  if (diffDays < 7) return locale === "zh" ? `${diffDays} 天前` : `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return locale === "zh" ? `${weeks} 周前` : `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return locale === "zh" ? `${months} 个月前` : `${months} month${months > 1 ? "s" : ""} ago`;
  }
  const years = Math.floor(diffDays / 365);
  return locale === "zh" ? `${years} 年前` : `${years} year${years > 1 ? "s" : ""} ago`;
}

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

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      en: {
        Gallery: "Gallery",
        Type: "Type",
        Video: "Video",
        Location: "Location",
        Camera: "Camera",
        Lens: "Lens",
        Aperture: "Aperture",
        ISO: "ISO",
        Shutter: "Shutter",
        FileInfo: "File Info",
        TimeInfo: "Time",
        Filename: "Filename",
        Size: "Size",
        Resolution: "Resolution",
        Format: "Format",
        Captured: "Captured",
        Uploaded: "Uploaded",
        Loading: "Loading image",
        LivePhoto: "Live Photo",
        LivePhotoHint: "This photo contains live video content.",
      },
      zh: {
        Gallery: "相册",
        Type: "类型",
        Video: "视频",
        Location: "位置",
        Camera: "相机",
        Lens: "镜头",
        Aperture: "光圈",
        ISO: "感光度",
        Shutter: "快门",
        FileInfo: "文件信息",
        TimeInfo: "时间信息",
        Filename: "文件名",
        Size: "文件大小",
        Resolution: "分辨率",
        Format: "格式",
        Captured: "拍摄时间",
        Uploaded: "上传时间",
        Loading: "正在加载图片",
        LivePhoto: "实况照片",
        LivePhotoHint: "此照片包含动态视频内容。",
      },
    };
    return translations[locale]?.[key] || key;
  };

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
        setColumnCount(3); // lg:columns-3
      } else if (window.innerWidth >= 640) {
        setColumnCount(2); // sm:columns-2
      } else {
        setColumnCount(1); // columns-1
      }
    };
    updateColumnCount();
    window.addEventListener('resize', updateColumnCount);
    return () => window.removeEventListener('resize', updateColumnCount);
  }, []);

  const columns = useMemo(() => distributeToColumns(items, columnCount), [items, columnCount, distributeToColumns]);

  return (
    <div className="w-full">
      {/* Masonry Grid - Row-first ordering */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {columns.map((column, colIndex) => (
          <div key={colIndex} className="flex flex-col gap-6">
            {column.map((item, index) => (
              <div
                key={item.id}
                className="group relative cursor-pointer overflow-hidden rounded-lg bg-stone-200 dark:bg-stone-800"
                onClick={() => handleOpen(item)}
              >
                <div className="relative">
                  <img
                    src={
                      item.type === "video"
                        ? item.thumbnail || item.url
                        : item.smallThumbPath || item.mediumPath || item.thumbnail || item.url
                    }
                    alt={item.title}
                    width={item.width || undefined}
                    height={item.height || undefined}
                    className="h-auto w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading={colIndex * column.length + index < 6 ? "eager" : "lazy"}
                    decoding={colIndex * column.length + index < 6 ? "sync" : "async"}
                    fetchPriority={colIndex * column.length + index < 3 ? "high" : "auto"}
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
            ))}
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
            <aside className={`relative hidden w-full flex-col overflow-y-auto border-l lg:flex lg:max-w-[400px] lg:flex-none lg:basis-[360px] xl:basis-[400px] ${isDark ? 'border-[#27272a] bg-[#09090b]' : 'border-stone-200 bg-[#fafaf9]'}`}>
              {/* Noise Texture */}
              <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.15]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacit='1'/%3E%3C/svg%3E")` }} />

              <div className="relative z-10 flex-1 overflow-y-auto p-6">
                {/* Title and Description */}
                <div className="mb-8">
                  <h2 className={`mb-3 font-serif text-2xl font-medium leading-tight ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>{selectedItem.title}</h2>
                  {selectedItem.description && (
                    <div className={`relative pl-4 text-sm leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                      <span className={`absolute left-0 top-0 h-full w-[2px] rounded-full ${isDark ? 'bg-stone-800' : 'bg-stone-300'}`} />
                      {selectedItem.description}
                    </div>
                  )}
                </div>

                {/* Location Map */}
                {selectedItem.latitude && selectedItem.longitude && (
                  <section className="mb-8">
                    <h3 className={`mb-3 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                      {t("Location")}
                    </h3>

                    <div className="Zhi-map mb-3 h-[160px] w-full overflow-hidden rounded-xl grayscale-[0.2] transition-all duration-500 hover:grayscale-0">
                      <LocationMap
                        lat={selectedItem.latitude}
                        lng={selectedItem.longitude}
                        _isDark={isDark}
                        height="160px"
                        showZoomControl={true}
                      />
                    </div>

                    <div className="space-y-1">
                      {selectedItem.city && selectedItem.country && (
                        <p className={`text-sm font-medium ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
                          {selectedItem.city}, {selectedItem.country}
                        </p>
                      )}
                      {(selectedItem.locationName || (!selectedItem.city && !selectedItem.country)) && (
                        <p className={`text-xs ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
                          {selectedItem.locationName || "Unknown Location"}
                        </p>
                      )}
                      <p className={`font-mono text-[10px] ${isDark ? 'text-stone-600' : 'text-stone-400'}`}>
                        {selectedItem.latitude.toFixed(6)}, {selectedItem.longitude.toFixed(6)}
                      </p>
                    </div>
                  </section>
                )}

                {/* File Info */}
                <section className="mb-8">
                  <h3 className={`mb-3 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                    {t("FileInfo")}
                  </h3>
                  <div className="pl-1">
                    <dl className="grid grid-cols-[90px_1fr] gap-x-3 gap-y-3 text-sm">
                      {selectedItem.width && selectedItem.height && (
                        <>
                          <dt className={isDark ? 'text-stone-500' : 'text-stone-500'}>{t("Resolution")}</dt>
                          <dd className={`font-mono text-xs font-medium ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>{selectedItem.width} × {selectedItem.height}</dd>
                        </>
                      )}
                      {selectedItem.fileSize && (
                        <>
                          <dt className={isDark ? 'text-stone-500' : 'text-stone-500'}>{t("Size")}</dt>
                          <dd className={`font-mono text-xs font-medium ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>{formatFileSize(selectedItem.fileSize)}</dd>
                        </>
                      )}
                      {selectedItem.mimeType && (
                        <>
                          <dt className={isDark ? 'text-stone-500' : 'text-stone-500'}>{t("Format")}</dt>
                          <dd className={`font-mono text-xs font-medium uppercase ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                            {selectedItem.mimeType.split("/")[1]}
                          </dd>
                        </>
                      )}
                    </dl>
                  </div>
                </section>

                {/* Time Info */}
                <section className="mb-8">
                  <h3 className={`mb-3 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                    {t("TimeInfo")}
                  </h3>
                  <div className="pl-1">
                    <dl className="space-y-4 text-sm">
                      {selectedItem.capturedAt && (
                        <div className="relative border-l-2 border-stone-200 pl-3 dark:border-stone-800">
                          <dt className={`text-xs ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>{t("Captured")}</dt>
                          <dd className={`mt-0.5 ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                            <span className="block font-medium">{formatDate(selectedItem.capturedAt, locale)}</span>
                            <span className={`text-xs ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                              {formatRelativeTime(selectedItem.capturedAt, locale)}
                            </span>
                          </dd>
                        </div>
                      )}
                      {selectedItem.createdAt && (
                        <div className="relative border-l-2 border-stone-200 pl-3 dark:border-stone-800">
                          <dt className={`text-xs ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>{t("Uploaded")}</dt>
                          <dd className={`mt-0.5 ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                            <span className="block font-medium">{formatDate(selectedItem.createdAt, locale)}</span>
                            <span className={`text-xs ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                              {formatRelativeTime(selectedItem.createdAt, locale)}
                            </span>
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </section>

                {/* EXIF Data */}
                {selectedItem.exif && (
                  <section className="mb-8">
                    <h3 className={`mb-3 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                      EXIF
                    </h3>
                    <div className="grid grid-cols-2 gap-px bg-stone-100 p-px dark:bg-[#27272a]">
                      {selectedItem.exif.camera && (
                        <div className={`col-span-2 p-3 ${isDark ? 'bg-[#09090b]' : 'bg-[#fafaf9]'}`}>
                          <span className={`block text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>{t("Camera")}</span>
                          <span className={`${isDark ? 'text-stone-200' : 'text-stone-800'}`}>{selectedItem.exif.camera}</span>
                        </div>
                      )}
                      {selectedItem.exif.lens && (
                        <div className={`col-span-2 p-3 ${isDark ? 'bg-[#09090b]' : 'bg-[#fafaf9]'}`}>
                          <span className={`block text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>{t("Lens")}</span>
                          <span className={`${isDark ? 'text-stone-200' : 'text-stone-800'}`}>{selectedItem.exif.lens}</span>
                        </div>
                      )}
                      {selectedItem.exif.aperture && (
                        <div className={`p-3 ${isDark ? 'bg-[#09090b]' : 'bg-[#fafaf9]'}`}>
                          <span className={`block text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>{t("Aperture")}</span>
                          <span className={`font-mono ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>{selectedItem.exif.aperture}</span>
                        </div>
                      )}
                      {selectedItem.exif.iso && (
                        <div className={`p-3 ${isDark ? 'bg-[#09090b]' : 'bg-[#fafaf9]'}`}>
                          <span className={`block text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>{t("ISO")}</span>
                          <span className={`font-mono ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>{selectedItem.exif.iso}</span>
                        </div>
                      )}
                      {selectedItem.exif.shutter && (
                        <div className={`p-3 ${isDark ? 'bg-[#09090b]' : 'bg-[#fafaf9]'}`}>
                          <span className={`block text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>{t("Shutter")}</span>
                          <span className={`font-mono ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>{selectedItem.exif.shutter}</span>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* Live Photo */}
                {selectedItem.isLivePhoto && selectedItem.livePhotoVideoPath && (
                  <section className="mb-8">
                    <h3 className={`mb-3 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                      {t("LivePhoto")}
                    </h3>
                    <div className="pl-1">
                      <p className={`mb-4 text-xs ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>{t("LivePhotoHint")}</p>
                      <a
                        href={selectedItem.livePhotoVideoPath}
                        download="live-photo-video.mov"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-purple-700 hover:shadow-md active:scale-95"
                      >
                        <HardDrive size={16} />
                        {locale === "zh" ? "下载视频" : "Download Video"}
                      </a>
                    </div>
                  </section>
                )}
              </div>

              {/* Footer */}
              <div className={`relative z-10 mt-auto px-6 py-4 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                <div className="flex items-center justify-between">
                  <span>{selectedItem.date}</span>
                  <span className="font-mono">{currentIndex + 1} / {items.length}</span>
                </div>
              </div>
            </aside>

            {/* Mobile Bottom Drawer */}
            <div
              className={`fixed inset-x-0 bottom-0 z-[75] transform transition-transform duration-300 ease-out lg:hidden ${drawerOpen ? "translate-y-0" : "translate-y-[calc(100%-120px)]"}`}
            >
              {/* Drawer Handle */}
              <button
                onClick={() => setDrawerOpen(!drawerOpen)}
                className={`mx-auto flex w-full items-center justify-center border-t py-2 ${isDark ? 'border-stone-800 bg-stone-900' : 'border-stone-200 bg-white'}`}
              >
                <ChevronUp
                  size={20}
                  className={`transition-transform duration-300 ${drawerOpen ? "rotate-180" : ""} ${isDark ? 'text-stone-500' : 'text-stone-400'}`}
                />
              </button>

              {/* Drawer Content */}
              <div className={`max-h-[70vh] overflow-y-auto px-4 pb-4 ${isDark ? 'bg-stone-900' : 'bg-white'}`}>
                {/* Title Preview (always visible) */}
                <div className="mb-4">
                  <h2 className={`font-serif text-xl ${isDark ? 'text-white' : 'text-stone-900'}`}>{selectedItem.title}</h2>
                  <p className={`text-xs ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>{selectedItem.date}</p>
                </div>

                {drawerOpen && (
                  <>
                    {selectedItem.description && (
                      <p className="mb-4 text-sm leading-relaxed text-stone-400">
                        {selectedItem.description}
                      </p>
                    )}

                    {/* Location Map (Mobile) */}
                    {selectedItem.latitude && selectedItem.longitude && (
                      <section className="mb-4">
                        <div className="overflow-hidden rounded-xl border border-stone-700/50">
                          <div className="Zhi-map h-[120px] w-full">
                            <LocationMap
                              lat={selectedItem.latitude}
                              lng={selectedItem.longitude}
                              _isDark={true}
                              height="120px"
                              showZoomControl={false}
                            />
                          </div>
                        </div>
                        {(selectedItem.city || selectedItem.locationName) && (
                          <p className="mt-2 text-sm text-stone-400">
                            {selectedItem.city && selectedItem.country
                              ? `${selectedItem.city}, ${selectedItem.country}`
                              : selectedItem.locationName}
                          </p>
                        )}
                      </section>
                    )}

                    {/* Quick Info Grid (Mobile) */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {selectedItem.width && selectedItem.height && (
                        <div className="rounded bg-stone-800/50 p-2">
                          <span className="block text-[10px] uppercase text-stone-500">{t("Resolution")}</span>
                          <span className="text-stone-300">{selectedItem.width} × {selectedItem.height}</span>
                        </div>
                      )}
                      {selectedItem.fileSize && (
                        <div className="rounded bg-stone-800/50 p-2">
                          <span className="block text-[10px] uppercase text-stone-500">{t("Size")}</span>
                          <span className="text-stone-300">{formatFileSize(selectedItem.fileSize)}</span>
                        </div>
                      )}
                      {selectedItem.capturedAt && (
                        <div className="col-span-2 rounded bg-stone-800/50 p-2">
                          <span className="block text-[10px] uppercase text-stone-500">{t("Captured")}</span>
                          <span className="text-stone-300">{formatDate(selectedItem.capturedAt, locale)}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
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

"use client";
/* eslint-disable react-hooks/exhaustive-deps */

import React, { useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { getLocaleFromPathname } from "@/lib/i18n";
import { useTheme } from "next-themes";

// Import from extracted modules
import type { ZhiGalleryItem, ZhiGalleryProps } from "./types";
import { useGalleryNavigation, useGalleryImageLoading, useGalleryTouch } from "./hooks";
import { GalleryGrid } from "./gallery-grid";
import { GalleryLightbox } from "./gallery-lightbox";

// Re-export types for backward compatibility
export type { ZhiGalleryItem, ZhiGalleryProps }

export function ZhiGallery({ items }: ZhiGalleryProps) {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname) ?? "en";
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Image container ref for wheel zoom
  const imageContainerRef = useRef<HTMLDivElement | null>(null);

  // Use extracted hooks
  const navigation = useGalleryNavigation({ items });
  const imageLoading = useGalleryImageLoading({ selectedItem: navigation.selectedItem });

  // Touch swipe handlers
  const touch = useGalleryTouch({
    zoomLevel: navigation.zoomLevel,
    onSwipeLeft: () => navigation.handleNext(),
    onSwipeRight: () => navigation.handlePrev(),
  });

  // Extended close handler with cleanup
  const handleClose = useCallback(() => {
    imageLoading.cleanup();
    navigation.handleClose();
  }, [imageLoading, navigation]);

  // Preload adjacent images
  useEffect(() => {
    if (!navigation.selectedItem || items.length === 0) return;

    const preloadImage = (src: string | undefined) => {
      if (!src) return;
      const img = new Image();
      img.src = src;
    };

    const currentIndex = navigation.currentIndex;
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
  }, [navigation.currentIndex, navigation.selectedItem, items.length, items]);

  // Wheel zoom (center-based)
  useEffect(() => {
    const el = imageContainerRef.current;
    if (!el || !navigation.selectedItem) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY;
      const factor = delta > 0 ? 1.1 : 0.9;
      navigation.setZoomLevel((prev) => Math.max(1, Math.min(4, prev * factor)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [navigation.selectedItem, navigation.setZoomLevel]);

  return (
    <div className="w-full">
      {/* Masonry Grid */}
      <GalleryGrid items={items} onItemClick={navigation.handleOpen} />

      {/* Lightbox Modal */}
      {navigation.selectedItem && (
        <GalleryLightbox
          selectedItem={navigation.selectedItem}
          items={items}
          currentIndex={navigation.currentIndex}
          slideDirection={navigation.slideDirection}
          zoomLevel={navigation.zoomLevel}
          displaySrc={imageLoading.displaySrc}
          originalState={imageLoading.originalState}
          showProgress={imageLoading.showProgress}
          isDark={isDark}
          locale={locale}
          drawerOpen={navigation.drawerOpen}
          imageContainerRef={imageContainerRef}
          onClose={handleClose}
          onPrev={navigation.handlePrev}
          onNext={navigation.handleNext}
          onThumbnailClick={navigation.handleThumbnailClick}
          onToggleDrawer={() => navigation.setDrawerOpen(!navigation.drawerOpen)}
          onTouchStart={touch.handleTouchStart}
          onTouchMove={touch.handleTouchMove}
          onTouchEnd={touch.handleTouchEnd}
        />
      )}
    </div>
  );
}

export default ZhiGallery;

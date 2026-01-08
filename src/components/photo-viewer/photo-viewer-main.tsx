"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { localePath } from "@/lib/locale-path";
import { PhotoMetadataPanel } from "./photo-metadata-panel";
import { LivePhotoPlayer } from "@/components/shared/live-photo-player";
import { useImageCache } from "@/hooks/use-image-cache";
import { Thumbnails } from "@/components/ui/thumbnail-carousel";

// Import from extracted modules
import type { PhotoViewerProps, Offset } from "./types";
import { usePhotoZoom, useImageLoading, useSlideAnimation } from "./hooks";
import {
  PhotoViewerToolbar,
  PhotoViewerNavigation,
  PhotoViewerImage,
  LoadingProgress,
} from "./components";

export function PhotoViewer({
  image,
  prevId,
  nextId,
  prevPath,
  nextPath,
  locale = "zh",
  thumbnails,
  currentId,
}: PhotoViewerProps) {
  const router = useRouter();
  const imageCache = useImageCache();
  const backButtonRef = useRef<HTMLAnchorElement>(null);

  // Use extracted hooks
  const zoom = usePhotoZoom();
  const imageLoading = useImageLoading({
    imageId: image.id,
    filePath: image.filePath,
    mediumPath: image.mediumPath,
  });
  const slideAnimation = useSlideAnimation({
    imageId: image.id,
    filePath: image.filePath,
    mediumPath: image.mediumPath,
    title: image.title,
    locale,
  });

  // Drag state (inline for now due to complex dependencies)
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  }>({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 });

  const scaleRef = useRef(zoom.scale);
  const offsetRef = useRef(zoom.offset);
  const clampOffsetRef = useRef<((nextOffset: Offset, s: number) => Offset) | null>(null);

  useEffect(() => {
    scaleRef.current = zoom.scale;
  }, [zoom.scale]);

  useEffect(() => {
    offsetRef.current = zoom.offset;
  }, [zoom.offset]);

  useEffect(() => {
    clampOffsetRef.current = zoom.clampOffset;
  }, [zoom.clampOffset]);

  const visualAdjacentIds = useMemo(() => {
    if (!thumbnails || !currentId) {
      return { prev: null, next: null, index: 0 };
    }
    const currentIndex = thumbnails.findIndex((t) => t.id === currentId);
    if (currentIndex === -1) {
      return { prev: null, next: null, index: 0 };
    }
    const prevThumbnail = currentIndex > 0 ? thumbnails[currentIndex - 1] : null;
    const nextThumbnail = currentIndex < thumbnails.length - 1 ? thumbnails[currentIndex + 1] : null;
    return {
      prev: prevThumbnail?.id ?? null,
      next: nextThumbnail?.id ?? null,
      index: currentIndex,
    };
  }, [thumbnails, currentId]);

  const visualAdjacentIdsRef = useRef<{ prev: string | null; next: string | null }>({
    prev: null,
    next: null,
  });

  useEffect(() => {
    visualAdjacentIdsRef.current = {
      prev: visualAdjacentIds.prev,
      next: visualAdjacentIds.next,
    };
  }, [visualAdjacentIds.prev, visualAdjacentIds.next]);

  const noopSetThumbnailIndex = useCallback(() => {}, []);

  const preventDefault = useCallback((event: Event) => {
    event.preventDefault();
  }, []);

  const handleThumbnailClick = useCallback(
    (targetId: string) => {
      if (!thumbnails || !currentId || targetId === currentId) {
        slideAnimation.clearStoredDirection();
        return;
      }
      const currentIndex = thumbnails.findIndex((t) => t.id === currentId);
      const targetIndex = thumbnails.findIndex((t) => t.id === targetId);
      if (currentIndex === -1 || targetIndex === -1) {
        slideAnimation.clearStoredDirection();
        return;
      }
      if (targetIndex > currentIndex) {
        slideAnimation.markPendingDirection("next");
      } else if (targetIndex < currentIndex) {
        slideAnimation.markPendingDirection("prev");
      } else {
        slideAnimation.clearStoredDirection();
      }
    },
    [thumbnails, currentId, slideAnimation]
  );

  // Focus management
  useEffect(() => {
    backButtonRef.current?.focus();
  }, []);

  // Reset zoom when image changes
  useEffect(() => {
    zoom.setScale(1);
    zoom.setOffset({ x: 0, y: 0 });
    zoom.setNaturalSize(null);
    zoom.setShowHint(true);
  }, [image.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard navigation with proactive preloading
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        router.push(localePath(locale, "/gallery"));
      } else if (e.key === "ArrowLeft" && prevId) {
        slideAnimation.markPendingDirection("prev");
        if (prevPath && !imageCache.has(prevId)) {
          imageCache.preload(prevId, prevPath);
        }
        router.push(localePath(locale, `/gallery/${prevId}`));
      } else if (e.key === "ArrowRight" && nextId) {
        slideAnimation.markPendingDirection("next");
        if (nextPath && !imageCache.has(nextId)) {
          imageCache.preload(nextId, nextPath);
        }
        router.push(localePath(locale, `/gallery/${nextId}`));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, prevId, nextId, prevPath, nextPath, locale, slideAnimation, imageCache]);

  // Preload adjacent images
  useEffect(() => {
    if (prevId && prevPath && !imageCache.has(prevId)) {
      imageCache.preload(prevId, prevPath);
    }
    if (nextId && nextPath && !imageCache.has(nextId)) {
      imageCache.preload(nextId, nextPath);
    }
  }, [prevId, prevPath, nextId, nextPath, imageCache]);

  // Drag to pan or swipe navigation
  useEffect(() => {
    const el = zoom.imgWrapRef.current;
    if (!el) return;

    const SWIPE_THRESHOLD = 100;

    const onDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      const currentOffset = offsetRef.current;
      dragRef.current = {
        active: true,
        startX: e.clientX,
        startY: e.clientY,
        originX: currentOffset.x,
        originY: currentOffset.y,
      };
      setIsDragging(true);
      zoom.setShowHint(false);
    };

    const onMove = (e: MouseEvent) => {
      if (!dragRef.current.active) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      const currentScale = scaleRef.current;

      if (currentScale > 1) {
        const next = { x: dragRef.current.originX + dx, y: dragRef.current.originY + dy };
        const clampFn = clampOffsetRef.current;
        zoom.setOffset((prev) => {
          const clamped = clampFn ? clampFn(next, currentScale) : next;
          if (prev.x === clamped.x && prev.y === clamped.y) return prev;
          return clamped;
        });
      } else {
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        if (absDx > absDy && absDx > 10) {
          zoom.setOffset((prev) => {
            const nextOffset = { x: dx * 0.3, y: 0 };
            if (prev.x === nextOffset.x && prev.y === nextOffset.y) return prev;
            return nextOffset;
          });
        }
      }
    };

    const end = (e: MouseEvent) => {
      if (!dragRef.current.active) return;
      const currentScale = scaleRef.current;
      const dragDistance = e.clientX - dragRef.current.startX;

      if (currentScale === 1 && Math.abs(dragDistance) > SWIPE_THRESHOLD) {
        const visualNext = visualAdjacentIdsRef.current.next;
        const visualPrev = visualAdjacentIdsRef.current.prev;

        if (dragDistance < 0 && visualNext) {
          slideAnimation.markPendingDirection("next");
          router.push(localePath(locale, `/gallery/${visualNext}`));
        } else if (dragDistance > 0 && visualPrev) {
          slideAnimation.markPendingDirection("prev");
          router.push(localePath(locale, `/gallery/${visualPrev}`));
        }
      }

      if (currentScale === 1) {
        zoom.setOffset((prev) => {
          if (prev.x === 0 && prev.y === 0) return prev;
          return { x: 0, y: 0 };
        });
      }

      dragRef.current.active = false;
      setIsDragging(false);
    };

    el.addEventListener("mousedown", onDown);
    el.addEventListener("dragstart", preventDefault);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", end);

    return () => {
      el.removeEventListener("mousedown", onDown);
      el.removeEventListener("dragstart", preventDefault);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", end);
    };
  }, [locale, slideAnimation, preventDefault, router, zoom]);

  return (
    <div className="fixed inset-0 z-[60] bg-white dark:bg-stone-950" role="dialog" aria-modal="true">
      <PhotoViewerToolbar locale={locale} backButtonRef={backButtonRef} />

      <PhotoViewerNavigation
        locale={locale}
        prevId={visualAdjacentIds.prev}
        nextId={visualAdjacentIds.next}
        onPrevClick={() => slideAnimation.markPendingDirection("prev")}
        onNextClick={() => slideAnimation.markPendingDirection("next")}
      />

      {/* Main content */}
      <div className="flex h-full flex-col lg:flex-row">
        {/* Image area */}
        <div className="relative flex flex-1 items-center justify-center overflow-hidden p-4 pb-28 sm:p-6 sm:pb-32">
          {image.isLivePhoto && image.livePhotoVideoPath ? (
            <div className="relative h-full w-full">
              <LivePhotoPlayer
                imageSrc={image.filePath}
                videoSrc={image.livePhotoVideoPath}
                alt={image.title || (locale === "zh" ? "未命名照片" : "Untitled Photo")}
                className="h-full w-full"
              />
            </div>
          ) : (
            <PhotoViewerImage
              locale={locale}
              displaySrc={imageLoading.displaySrc}
              title={image.title}
              scale={zoom.scale}
              offset={zoom.offset}
              isDragging={isDragging}
              showZoomIndicator={zoom.showZoomIndicator}
              showHint={zoom.showHint}
              slideContext={slideAnimation.slideContext}
              imgWrapRef={zoom.imgWrapRef}
              onNaturalSizeChange={zoom.setNaturalSize}
            />
          )}
        </div>

        {imageLoading.originalState.status === "loading" && imageLoading.showProgress && (
          <LoadingProgress
            locale={locale}
            loadedBytes={imageLoading.originalState.loadedBytes}
            totalBytes={imageLoading.originalState.totalBytes}
          />
        )}

        {/* Metadata panel - desktop only */}
        <aside className="hidden w-full overflow-y-auto border-l border-stone-200/80 bg-gradient-to-b from-white to-stone-50/50 lg:block lg:max-w-[480px] lg:flex-none lg:basis-[380px] xl:basis-[420px] dark:border-stone-800/60 dark:from-[#0b0b0d] dark:to-[#0f0f12]">
          <PhotoMetadataPanel image={image} locale={locale} />
        </aside>
      </div>

      {/* Bottom thumbnail strip */}
      {Array.isArray(thumbnails) && thumbnails.length > 0 && (
        <div className="pointer-events-auto fixed right-0 bottom-0 left-0 z-[61] border-t border-stone-200/60 bg-white/80 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] backdrop-blur-md lg:right-[380px] xl:right-[420px] dark:border-stone-700/50 dark:bg-stone-900/70 dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
          <div className="px-4 py-3">
            <Thumbnails
              images={thumbnails}
              index={visualAdjacentIds.index}
              setIndex={noopSetThumbnailIndex}
              currentId={currentId || image.id}
              locale={locale}
              onImageClick={handleThumbnailClick}
            />
          </div>
        </div>
      )}
    </div>
  );
}

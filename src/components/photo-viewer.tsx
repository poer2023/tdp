"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { localePath } from "@/lib/locale-path";
import type { GalleryImage } from "@/lib/gallery";
import { PhotoMetadataPanel } from "@/components/photo-metadata-panel";
import { LivePhotoPlayer } from "@/components/live-photo-player";
import Image from "next/image";
import { useImageCache } from "@/hooks/use-image-cache";
import { ThemeToggle } from "@/components/theme-toggle";
import { Thumbnails } from "@/components/ui/thumbnail-carousel";

const SLIDE_STORAGE_KEY = "gallery-slide-direction";

type PhotoViewerProps = {
  image: GalleryImage;
  prevId: string | null;
  nextId: string | null;
  prevPath?: string;
  nextPath?: string;
  locale?: "zh" | "en";
  thumbnails?: {
    id: string;
    filePath: string;
    microThumbPath?: string | null;
    smallThumbPath?: string | null;
    mediumPath?: string | null;
  }[];
  currentId?: string;
};

type OriginalLoadState = {
  status: "idle" | "loading" | "success" | "error";
  loadedBytes: number;
  totalBytes: number | null;
};

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
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const scaleRef = useRef(scale);
  const offsetRef = useRef(offset);
  const imgWrapRef = useRef<HTMLDivElement>(null);
  const [showHint, setShowHint] = useState(true);
  const [showZoomIndicator, setShowZoomIndicator] = useState(false);
  const zoomHideTimerRef = useRef<number | null>(null);
  const [containerSize, setContainerSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  }>({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [displaySrc, setDisplaySrc] = useState<string>(image.mediumPath || image.filePath);
  const [originalState, setOriginalState] = useState<OriginalLoadState>({
    status: "idle",
    loadedBytes: 0,
    totalBytes: null,
  });
  const [showProgress, setShowProgress] = useState(true);
  const progressHideTimerRef = useRef<number | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const pendingDirectionRef = useRef<"prev" | "next" | null>(null);
  const previousSnapshotRef = useRef<{ id: string; src: string; alt: string } | null>({
    id: image.id,
    src: image.mediumPath || image.filePath,
    alt: image.title || (locale === "zh" ? "未命名照片" : "Untitled Photo"),
  });
  const clampOffsetRef = useRef<
    ((nextOffset: { x: number; y: number }, s: number) => { x: number; y: number }) | null
  >(null);
  const slideTimeoutRef = useRef<number | null>(null);
  const [slideContext, setSlideContext] = useState<{
    direction: "left" | "right";
    fromSrc: string;
    fromAlt: string;
    phase: "pre" | "animating";
  } | null>(null);
  const [thumbnailIndex, setThumbnailIndex] = useState(0);

  // Calculate visual adjacent IDs from thumbnails array (not timeline)
  const visualAdjacentIds = useRef<{ prev: string | null; next: string | null }>({
    prev: null,
    next: null,
  });
  useEffect(() => {
    if (!thumbnails || !currentId) {
      visualAdjacentIds.current = { prev: null, next: null };
      setThumbnailIndex(0);
      return;
    }
    const currentIndex = thumbnails.findIndex((t) => t.id === currentId);
    if (currentIndex === -1) {
      visualAdjacentIds.current = { prev: null, next: null };
      setThumbnailIndex(0);
      return;
    }
    // Update thumbnail index
    setThumbnailIndex(currentIndex);

    // Visual order: index 0 = newest (left), index N = oldest (right)
    // prev = left = newer = index - 1
    // next = right = older = index + 1
    const prevThumbnail = currentIndex > 0 ? thumbnails[currentIndex - 1] : null;
    const nextThumbnail =
      currentIndex < thumbnails.length - 1 ? thumbnails[currentIndex + 1] : null;
    visualAdjacentIds.current = {
      prev: prevThumbnail?.id ?? null,
      next: nextThumbnail?.id ?? null,
    };
  }, [thumbnails, currentId]);

  const preventDefault = useCallback((event: Event) => {
    event.preventDefault();
  }, []);

  const markPendingDirection = useCallback(
    (direction: "prev" | "next") => {
      pendingDirectionRef.current = direction;
      const fromSrc = image.mediumPath || image.filePath;
      const payload = {
        direction,
        ts: Date.now(),
        fromSrc,
        fromAlt: image.title || (locale === "zh" ? "未命名照片" : "Untitled Photo"),
        fromId: image.id,
      };
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem(SLIDE_STORAGE_KEY, JSON.stringify(payload));
        } catch {
          // sessionStorage unavailable
        }
      }
    },
    [image.filePath, image.id, image.mediumPath, image.title]
  );

  const clearStoredDirection = useCallback(() => {
    pendingDirectionRef.current = null;
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem(SLIDE_STORAGE_KEY);
      } catch {
        // ignore storage errors
      }
    }
  }, []);

  const handleThumbnailClick = useCallback(
    (targetId: string) => {
      if (!thumbnails || !currentId || targetId === currentId) {
        clearStoredDirection();
        return;
      }
      const currentIndex = thumbnails.findIndex((t) => t.id === currentId);
      const targetIndex = thumbnails.findIndex((t) => t.id === targetId);
      if (currentIndex === -1 || targetIndex === -1) {
        clearStoredDirection();
        return;
      }
      if (targetIndex > currentIndex) {
        markPendingDirection("next");
      } else if (targetIndex < currentIndex) {
        markPendingDirection("prev");
      } else {
        clearStoredDirection();
      }
    },
    [thumbnails, currentId, markPendingDirection, clearStoredDirection]
  );

  const startSlide = useCallback(
    (direction: "left" | "right", from: { src: string; alt: string }) => {
      if (typeof window === "undefined") {
        setSlideContext(null);
        return;
      }
      if (slideTimeoutRef.current) {
        window.clearTimeout(slideTimeoutRef.current);
        slideTimeoutRef.current = null;
      }
      setSlideContext({ direction, fromSrc: from.src, fromAlt: from.alt, phase: "pre" });
      requestAnimationFrame(() => {
        setSlideContext((prev) => (prev ? { ...prev, phase: "animating" } : prev));
      });
      slideTimeoutRef.current = window.setTimeout(() => {
        setSlideContext(null);
        slideTimeoutRef.current = null;
      }, 320);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (slideTimeoutRef.current) {
        window.clearTimeout(slideTimeoutRef.current);
        slideTimeoutRef.current = null;
      }
    };
  }, []);

  // Focus management
  useEffect(() => {
    // Focus the back button when dialog opens
    backButtonRef.current?.focus();
  }, []);

  // Auto-hide progress indicator when 100%
  useEffect(() => {
    // Clear existing timer
    if (progressHideTimerRef.current) {
      window.clearTimeout(progressHideTimerRef.current);
      progressHideTimerRef.current = null;
    }

    // Show progress when loading starts
    if (originalState.status === "loading") {
      setShowProgress(true);
    }

    // Hide after 2s when successfully loaded (100%)
    if (
      originalState.status === "success" &&
      originalState.loadedBytes > 0 &&
      originalState.totalBytes &&
      originalState.loadedBytes >= originalState.totalBytes
    ) {
      progressHideTimerRef.current = window.setTimeout(() => {
        setShowProgress(false);
        progressHideTimerRef.current = null;
      }, 2000);
    }

    return () => {
      if (progressHideTimerRef.current) {
        window.clearTimeout(progressHideTimerRef.current);
        progressHideTimerRef.current = null;
      }
    };
  }, [originalState]);

  // Auto-hide zoom indicator when scale is 100%
  useEffect(() => {
    // Clear existing timer
    if (zoomHideTimerRef.current) {
      window.clearTimeout(zoomHideTimerRef.current);
      zoomHideTimerRef.current = null;
    }

    // Show indicator when scale changes
    setShowZoomIndicator(true);

    // Hide after 2s if scale is 100% (scale === 1)
    if (scale === 1) {
      zoomHideTimerRef.current = window.setTimeout(() => {
        setShowZoomIndicator(false);
        zoomHideTimerRef.current = null;
      }, 2000);
    }

    return () => {
      if (zoomHideTimerRef.current) {
        window.clearTimeout(zoomHideTimerRef.current);
        zoomHideTimerRef.current = null;
      }
    };
  }, [scale]);

  // Keyboard navigation with proactive preloading
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        router.push(localePath(locale, "/gallery"));
      } else if (e.key === "ArrowLeft" && prevId) {
        markPendingDirection("prev");
        // Proactively preload before navigation
        if (prevPath && !imageCache.has(prevId)) {
          imageCache.preload(prevId, prevPath);
        }
        router.push(localePath(locale, `/gallery/${prevId}`));
      } else if (e.key === "ArrowRight" && nextId) {
        markPendingDirection("next");
        // Proactively preload before navigation
        if (nextPath && !imageCache.has(nextId)) {
          imageCache.preload(nextId, nextPath);
        }
        router.push(localePath(locale, `/gallery/${nextId}`));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, prevId, nextId, prevPath, nextPath, locale, markPendingDirection, imageCache]);

  // Preload adjacent images (cache-aware)
  useEffect(() => {
    if (prevId && prevPath && !imageCache.has(prevId)) {
      imageCache.preload(prevId, prevPath);
    }
    if (nextId && nextPath && !imageCache.has(nextId)) {
      imageCache.preload(nextId, nextPath);
    }
  }, [prevId, prevPath, nextId, nextPath, imageCache]);

  // Reset zoom and prepare slide animation when image changes
  useEffect(() => {
    const prevSnapshot = previousSnapshotRef.current;
    let pending = pendingDirectionRef.current;
    let storedSnapshot: {
      direction: "prev" | "next";
      fromSrc: string;
      fromAlt: string;
      fromId?: string;
    } | null = null;

    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem(SLIDE_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as {
            direction?: "prev" | "next";
            ts?: number;
            fromSrc?: string;
            fromAlt?: string;
            fromId?: string;
          };
          if (parsed.direction && parsed.ts && Date.now() - parsed.ts < 1500) {
            storedSnapshot = {
              direction: parsed.direction,
              fromSrc: parsed.fromSrc || "",
              fromAlt: parsed.fromAlt || image.title || (locale === "zh" ? "未命名照片" : "Untitled Photo"),
              fromId: parsed.fromId,
            };
            if (!pending) {
              pending = parsed.direction;
            }
          }
        }
      } catch {
        // ignore storage errors
      }
    }

    clearStoredDirection();

    const baseSrc = image.mediumPath || image.filePath;

    setScale(1);
    setOffset({ x: 0, y: 0 });
    setNaturalSize(null);
    setShowHint(true);
    setDisplaySrc(baseSrc);

    const fallbackSnapshot =
      storedSnapshot && storedSnapshot.fromSrc
        ? {
            id: storedSnapshot.fromId || "stored",
            src: storedSnapshot.fromSrc,
            alt: storedSnapshot.fromAlt,
          }
        : null;

    const snapshotToUse =
      prevSnapshot && prevSnapshot.id !== image.id ? prevSnapshot : fallbackSnapshot;

    if (snapshotToUse && pending) {
      const direction = pending === "next" ? "left" : "right";
      startSlide(direction, snapshotToUse);
    } else {
      setSlideContext(null);
    }
  }, [image.id, image.mediumPath, image.filePath, image.title, startSlide, clearStoredDirection]);

  // Cleanup download artefacts on unmount
  useEffect(() => {
    return () => {
      xhrRef.current?.abort();
      xhrRef.current = null;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  // Fetch original image with progress once visible (with caching)
  useEffect(() => {
    xhrRef.current?.abort();
    xhrRef.current = null;
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    // No mediumPath or already using full resolution
    if (!image.mediumPath || image.mediumPath === image.filePath) {
      setDisplaySrc(image.filePath);
      setOriginalState({ status: "success", loadedBytes: 0, totalBytes: null });
      return;
    }

    // Check cache first
    const cachedUrl = imageCache.get(image.id);
    if (cachedUrl) {
      setDisplaySrc(cachedUrl);
      setOriginalState({ status: "success", loadedBytes: 0, totalBytes: null });
      return;
    }

    // SSR guard
    if (typeof window === "undefined" || typeof window.XMLHttpRequest === "undefined") {
      setOriginalState({ status: "idle", loadedBytes: 0, totalBytes: null });
      return;
    }

    // Start loading original image
    const xhr = new window.XMLHttpRequest();
    xhrRef.current = xhr;
    setOriginalState({ status: "loading", loadedBytes: 0, totalBytes: null });

    xhr.open("GET", image.filePath, true);
    xhr.responseType = "blob";

    xhr.onprogress = (event) => {
      setOriginalState((prev) => ({
        status: "loading",
        loadedBytes: event.loaded,
        totalBytes: event.lengthComputable ? event.total : prev.totalBytes,
      }));
    };

    const handleFailure = () => {
      if (xhrRef.current === xhr) {
        xhrRef.current = null;
      }
      setOriginalState({ status: "error", loadedBytes: 0, totalBytes: null });
      setDisplaySrc(image.filePath);
    };

    xhr.onerror = handleFailure;
    xhr.onabort = () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      if (xhrRef.current === xhr) {
        xhrRef.current = null;
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300 && xhr.response instanceof Blob) {
        const blob = xhr.response as Blob;
        const url = imageCache.set(image.id, blob);
        setDisplaySrc(url);
        setOriginalState({ status: "success", loadedBytes: blob.size, totalBytes: blob.size });
        if (xhrRef.current === xhr) {
          xhrRef.current = null;
        }
      } else {
        handleFailure();
      }
    };

    try {
      xhr.send();
    } catch {
      handleFailure();
    }

    return () => {
      xhr.abort();
      if (xhrRef.current === xhr) {
        xhrRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image.id, image.filePath, image.mediumPath]);

  useEffect(() => {
    previousSnapshotRef.current = {
      id: image.id,
      src: displaySrc,
      alt: image.title || (locale === "zh" ? "未命名照片" : "Untitled Photo"),
    };
  }, [image.id, displaySrc, image.title]);

  // Helper: clamp offset so image stays within bounds based on scale
  const clampOffset = useCallback(
    function clampOffset(
      nextOffset: { x: number; y: number },
      s: number
    ): { x: number; y: number } {
      const cw = containerSize.w;
      const ch = containerSize.h;
      if (!cw || !ch) return { x: 0, y: 0 };
      // Compute contained image base size
      let w0 = cw;
      let h0 = ch;
      if (naturalSize && naturalSize.w > 0 && naturalSize.h > 0) {
        const a = naturalSize.w / naturalSize.h;
        if (cw / ch < a) {
          w0 = cw;
          h0 = cw / a;
        } else {
          h0 = ch;
          w0 = ch * a;
        }
      }
      const w = w0 * s;
      const h = h0 * s;
      const maxX = Math.max(0, (w - cw) / 2);
      const maxY = Math.max(0, (h - ch) / 2);
      return {
        x: Math.max(-maxX, Math.min(maxX, nextOffset.x)),
        y: Math.max(-maxY, Math.min(maxY, nextOffset.y)),
      };
    },
    [containerSize, naturalSize]
  );
  useEffect(() => {
    clampOffsetRef.current = clampOffset;
  }, [clampOffset]);

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  // Observe container size
  useEffect(() => {
    const el = imgWrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        setContainerSize((prev) => {
          // Only update if size actually changed to avoid unnecessary re-renders
          if (prev.w === cr.width && prev.h === cr.height) return prev;
          return { w: cr.width, h: cr.height };
        });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []); // Remove clampOffset from dependencies

  // Wheel zoom (center-based)
  useEffect(() => {
    const el = imgWrapRef.current;
    if (!el) return;
    const onWheel = (e: Event) => {
      const we = e as WheelEvent;
      we.preventDefault();
      setShowHint(false);
      const delta = -we.deltaY;
      const factor = delta > 0 ? 1.1 : 0.9;
      setScale((prev) => {
        const next = Math.max(1, Math.min(4, prev * factor));
        // Clamp offset under new scale
        setOffset((off) => clampOffset(off, next));
        return next;
      });
    };
    el.addEventListener("wheel", onWheel as EventListener, { passive: false });
    return () => el.removeEventListener("wheel", onWheel as EventListener);
  }, [clampOffset]);

  // Double-click toggle zoom
  useEffect(() => {
    const el = imgWrapRef.current;
    if (!el) return;
    const onDbl = (e: MouseEvent) => {
      e.preventDefault();
      setScale((s) => {
        const next = s > 1 ? 1 : 2;
        setOffset((off) => clampOffset(off, next));
        return next;
      });
      setShowHint(false);
    };
    el.addEventListener("dblclick", onDbl);
    return () => el.removeEventListener("dblclick", onDbl);
  }, [clampOffset]);

  // Drag to pan (when zoomed) or swipe to switch images (when not zoomed)
  useEffect(() => {
    const el = imgWrapRef.current;
    if (!el) return;

    const SWIPE_THRESHOLD = 100; // pixels to trigger image switch

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
      setShowHint(false);
    };

    const onMove = (e: MouseEvent) => {
      if (!dragRef.current.active) return;

      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      const currentScale = scaleRef.current;

      if (currentScale > 1) {
        // Zoomed: pan the image
        const next = { x: dragRef.current.originX + dx, y: dragRef.current.originY + dy };
        const clampFn = clampOffsetRef.current;
        setOffset((prev) => {
          const clamped = clampFn ? clampFn(next, currentScale) : next;
          if (prev.x === clamped.x && prev.y === clamped.y) {
            return prev;
          }
          return clamped;
        });
      } else {
        // Not zoomed: horizontal swipe for navigation
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        // Only apply horizontal offset if dragging horizontally
        if (absDx > absDy && absDx > 10) {
          setOffset((prev) => {
            const nextOffset = { x: dx * 0.3, y: 0 };
            if (prev.x === nextOffset.x && prev.y === nextOffset.y) {
              return prev;
            }
            return nextOffset;
          }); // Apply damping for visual feedback
        }
      }
    };

    const end = (e: MouseEvent) => {
      if (!dragRef.current.active) return;
      const currentScale = scaleRef.current;

      // Calculate actual drag distance from start position
      const dragDistance = e.clientX - dragRef.current.startX;

      // Check if swipe threshold met for navigation
      if (currentScale === 1 && Math.abs(dragDistance) > SWIPE_THRESHOLD) {
        // Use visual adjacent IDs (thumbnail array order)
        const visualNext = visualAdjacentIds.current.next;
        const visualPrev = visualAdjacentIds.current.prev;

        if (dragDistance < 0 && visualNext) {
          // Swiped left -> next image (right in thumbnails, older)
          markPendingDirection("next");
          router.push(localePath(locale, `/gallery/${visualNext}`));
        } else if (dragDistance > 0 && visualPrev) {
          // Swiped right -> previous image (left in thumbnails, newer)
          markPendingDirection("prev");
          router.push(localePath(locale, `/gallery/${visualPrev}`));
        }
      }

      // Reset offset if not zoomed (bounce back animation)
      if (currentScale === 1) {
        setOffset((prev) => {
          if (prev.x === 0 && prev.y === 0) {
            return prev;
          }
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
  }, [locale, markPendingDirection, preventDefault, router]);

  // Pinch zoom for touch devices
  useEffect(() => {
    const el = imgWrapRef.current;
    if (!el) return;
    let startDist = 0;
    let startScale = 1;
    const dist = (t1: Touch, t2: Touch) => {
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      return Math.hypot(dx, dy);
    };
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const t1 = e.touches[0]!;
        const t2 = e.touches[1]!;
        startDist = dist(t1, t2);
        startScale = scale;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const t1 = e.touches[0]!;
        const t2 = e.touches[1]!;
        const d = dist(t1, t2);
        const ratio = d / (startDist || d);
        const next = Math.max(1, Math.min(4, startScale * ratio));
        setScale(next);
        setOffset((off) => clampOffset(off, next));
      }
    };
    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, [scale, clampOffset]);

  return (
    <div className="fixed inset-0 z-[60] bg-white dark:bg-zinc-950" role="dialog" aria-modal="true">
      {/* Minimal floating toolbar (no full-width header) */}
      <div className="fixed top-4 right-4 z-[62] flex items-center gap-2">
        {/* Theme Toggle */}
        <ThemeToggle />
        {/* Close */}
        <Link
          ref={backButtonRef}
          href={localePath(locale, "/gallery")}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white/80 text-zinc-700 shadow-sm backdrop-blur hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300"
          aria-label={locale === "zh" ? "返回相册页面" : "Back to Gallery"}
          title={locale === "zh" ? "返回相册" : "Back"}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </Link>
      </div>

      {/* Side navigation arrows - vertically centered */}
      <div className="pointer-events-none fixed top-1/2 left-4 z-[62] -translate-y-1/2 lg:left-6">
        {visualAdjacentIds.current.prev && (
          <Link
            href={localePath(locale, `/gallery/${visualAdjacentIds.current.prev}`)}
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white/80 text-zinc-700 shadow-sm backdrop-blur hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300"
            title={locale === "zh" ? "上一张" : "Previous"}
            aria-label={locale === "zh" ? "上一张" : "Previous"}
            onClick={() => markPendingDirection("prev")}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
        )}
      </div>
      {/* Right arrow: avoid right sidebar on desktop, stay within thumbnail area */}
      <div className="pointer-events-none fixed top-1/2 right-4 z-[62] -translate-y-1/2 lg:right-[calc(380px+1.5rem)] xl:right-[calc(420px+1.5rem)]">
        {visualAdjacentIds.current.next && (
          <Link
            href={localePath(locale, `/gallery/${visualAdjacentIds.current.next}`)}
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white/80 text-zinc-700 shadow-sm backdrop-blur hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300"
            title={locale === "zh" ? "下一张" : "Next"}
            aria-label={locale === "zh" ? "下一张" : "Next"}
            onClick={() => markPendingDirection("next")}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>

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
            <div
              ref={imgWrapRef}
              className={`relative h-full w-full ${scale > 1 ? "cursor-grab" : ""}`}
            >
              <div className="absolute inset-0 overflow-hidden">
                {slideContext && (
                  <div
                    className={`pointer-events-none absolute inset-0 transition-transform duration-300 ease-out ${
                      slideContext.direction === "left"
                        ? slideContext.phase === "pre"
                          ? "translate-x-0"
                          : "-translate-x-full"
                        : slideContext.phase === "pre"
                          ? "translate-x-0"
                          : "translate-x-full"
                    }`}
                    style={{ willChange: "transform" }}
                  >
                    <Image
                      src={slideContext.fromSrc}
                      alt={slideContext.fromAlt}
                      fill
                      className="object-contain"
                      sizes="(max-width: 1024px) 100vw, 65vw"
                      unoptimized
                    />
                  </div>
                )}
                <div
                  className={`absolute inset-0 transition-transform duration-300 ease-out ${
                    slideContext
                      ? slideContext.direction === "left"
                        ? slideContext.phase === "pre"
                          ? "translate-x-full"
                          : "translate-x-0"
                        : slideContext.phase === "pre"
                          ? "-translate-x-full"
                          : "translate-x-0"
                      : "translate-x-0"
                  }`}
                  style={{ willChange: "transform" }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
                      transformOrigin: "50% 50%",
                      transition: isDragging ? "none" : "transform 200ms ease-out",
                      willChange: "transform",
                      cursor: isDragging ? "grabbing" : "grab",
                    }}
                  >
                    <Image
                      src={displaySrc}
                      alt={image.title || (locale === "zh" ? "未命名照片" : "Untitled Photo")}
                      fill
                      className="object-contain"
                      sizes="(max-width: 1024px) 100vw, 65vw"
                      unoptimized
                      onLoad={(e) => {
                        const img = e.currentTarget;
                        setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
                      }}
                    />
                  </div>
                </div>
              </div>
              {showZoomIndicator && (
                <div className="pointer-events-none absolute top-4 right-4 rounded-full border border-zinc-200 bg-white/80 px-3 py-1 text-xs font-medium text-zinc-700 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300">
                  {(scale * 100).toFixed(0)}%
                </div>
              )}
              {showHint && (
                <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-zinc-200 bg-white/80 px-3 py-1 text-xs text-zinc-600 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400">
                  {locale === "zh" ? "滚轮缩放 · 双击重置" : "Wheel to zoom · Double click to reset"}
                </div>
              )}
            </div>
          )}
        </div>

        {originalState.status === "loading" && showProgress && (
          <div className="pointer-events-none absolute right-6 bottom-6 z-[63] flex items-center gap-3 rounded-xl bg-black/75 px-4 py-2 text-xs text-white shadow-lg backdrop-blur">
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
                {locale === "zh"
                  ? `正在加载图片${formatProgress(originalState.loadedBytes, originalState.totalBytes)}`
                  : `Loading image${formatProgress(originalState.loadedBytes, originalState.totalBytes)}`}
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

        {/* Metadata panel - desktop only */}
        <aside className="hidden w-full overflow-y-auto border-l border-zinc-200 bg-white lg:block lg:max-w-[480px] lg:flex-none lg:basis-[380px] xl:basis-[420px] dark:border-zinc-800 dark:bg-[#0b0b0d]">
          <PhotoMetadataPanel image={image} locale={locale} />
        </aside>
      </div>

      {/* Bottom thumbnail strip - exclude right sidebar on desktop */}
      {Array.isArray(thumbnails) && thumbnails.length > 0 && (
        <div className="pointer-events-auto fixed right-0 bottom-0 left-0 z-[61] border-t border-zinc-200 bg-white/75 backdrop-blur lg:right-[380px] xl:right-[420px] dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="px-4 py-3">
            <Thumbnails
              images={thumbnails}
              index={thumbnailIndex}
              setIndex={setThumbnailIndex}
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

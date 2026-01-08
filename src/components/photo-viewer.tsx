"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { localePath } from "@/lib/locale-path";
import type { GalleryImage } from "@/lib/gallery";
import { PhotoMetadataPanel } from "@/components/photo-viewer/photo-metadata-panel";
import { LivePhotoPlayer } from "@/components/shared/live-photo-player";
import Image from "next/image";
import { useImageCache } from "@/hooks/use-image-cache";
import { ThemeToggle } from "@/components/layout/theme-toggle";
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
  const scaleRef = useRef(scale);
  const offsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const imgWrapRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const pendingTransformRef = useRef<{ x: number; y: number; scale: number } | null>(null);
  const isPinchingRef = useRef(false);
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
  // Always use medium resolution for slide animation (not blob URL) to avoid jank
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
  const isMediumSrc = Boolean(image.mediumPath && displaySrc === image.mediumPath);

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

  // Detect if we're on a mobile device
  const isMobile = useCallback(() => {
    if (typeof window === "undefined") return false;
    // Check viewport width (more reliable than user agent)
    return window.innerWidth < 768;
  }, []);

  // Drive transforms via CSS variables + RAF to avoid rerendering on every move.
  const applyTransform = useCallback((x: number, y: number, s: number) => {
    const el = transformRef.current;
    if (!el) return;
    el.style.setProperty("--pv-offset-x", `${x}px`);
    el.style.setProperty("--pv-offset-y", `${y}px`);
    el.style.setProperty("--pv-scale", `${s}`);
  }, []);

  const scheduleTransform = useCallback(
    (x: number, y: number, s: number) => {
      pendingTransformRef.current = { x, y, scale: s };
      if (rafRef.current !== null) return;
      if (typeof window === "undefined") {
        applyTransform(x, y, s);
        pendingTransformRef.current = null;
        return;
      }
      const schedule =
        window.requestAnimationFrame ?? ((cb: FrameRequestCallback) => window.setTimeout(cb, 16));
      rafRef.current = schedule(() => {
        rafRef.current = null;
        const pending = pendingTransformRef.current;
        if (!pending) return;
        pendingTransformRef.current = null;
        applyTransform(pending.x, pending.y, pending.scale);
      });
    },
    [applyTransform]
  );

  const updateOffset = useCallback(
    (nextOffset: { x: number; y: number }, s: number = scaleRef.current) => {
      offsetRef.current = nextOffset;
      scheduleTransform(nextOffset.x, nextOffset.y, s);
    },
    [scheduleTransform]
  );

  const markPendingDirection = useCallback(
    (direction: "prev" | "next") => {
      pendingDirectionRef.current = direction;
      // Always use medium resolution for slide animation (not blob URL)
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
    [image.filePath, image.id, image.mediumPath, image.title, locale]
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

  useEffect(() => {
    return () => {
      if (rafRef.current === null || typeof window === "undefined") return;
      if (window.cancelAnimationFrame) {
        window.cancelAnimationFrame(rafRef.current);
      }
      window.clearTimeout(rafRef.current);
      rafRef.current = null;
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
    if (isMobile()) {
      return;
    }
    if (prevId && prevPath && !imageCache.has(prevId)) {
      imageCache.preload(prevId, prevPath);
    }
    if (nextId && nextPath && !imageCache.has(nextId)) {
      imageCache.preload(nextId, nextPath);
    }
  }, [prevId, prevPath, nextId, nextPath, imageCache, isMobile]);

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

    scaleRef.current = 1;
    offsetRef.current = { x: 0, y: 0 };
    scheduleTransform(0, 0, 1);
    setScale(1);
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
  }, [
    image.id,
    image.mediumPath,
    image.filePath,
    image.title,
    locale,
    startSlide,
    clearStoredDirection,
    scheduleTransform,
  ]);

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



  // Fetch original image with progress (with caching)
  // On mobile: skip auto-download to avoid performance issues
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

    // On mobile: don't auto-download large originals to prevent performance issues
    // Medium resolution is sufficient for mobile viewing
    if (isMobile()) {
      setDisplaySrc(image.mediumPath);
      setOriginalState({ status: "idle", loadedBytes: 0, totalBytes: null });
      return;
    }

    // Start loading original image (desktop only)
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
  }, [image.id, image.filePath, image.mediumPath, isMobile]);

  useEffect(() => {
    // Always store medium resolution for slide animation (not blob URL)
    // This ensures smooth transitions without jank from 15MB+ images
    previousSnapshotRef.current = {
      id: image.id,
      src: image.mediumPath || image.filePath,
      alt: image.title || (locale === "zh" ? "未命名照片" : "Untitled Photo"),
    };
  }, [image.id, image.mediumPath, image.filePath, image.title, locale]);

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
      const next = Math.max(1, Math.min(4, scaleRef.current * factor));
      scaleRef.current = next;
      const clamped = clampOffset(offsetRef.current, next);
      offsetRef.current = clamped;
      scheduleTransform(clamped.x, clamped.y, next);
      setScale(next);
    };
    el.addEventListener("wheel", onWheel as EventListener, { passive: false });
    return () => el.removeEventListener("wheel", onWheel as EventListener);
  }, [clampOffset, scheduleTransform]);

  // Double-click toggle zoom
  useEffect(() => {
    const el = imgWrapRef.current;
    if (!el) return;
    const onDbl = (e: MouseEvent) => {
      e.preventDefault();
      const next = scaleRef.current > 1 ? 1 : 2;
      scaleRef.current = next;
      const clamped = clampOffset(offsetRef.current, next);
      offsetRef.current = clamped;
      scheduleTransform(clamped.x, clamped.y, next);
      setScale(next);
      setShowHint(false);
    };
    el.addEventListener("dblclick", onDbl);
    return () => el.removeEventListener("dblclick", onDbl);
  }, [clampOffset, scheduleTransform]);

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
        const clamped = clampFn ? clampFn(next, currentScale) : next;
        updateOffset(clamped, currentScale);
      } else {
        // Not zoomed: horizontal swipe for navigation
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        // Only apply horizontal offset if dragging horizontally
        if (absDx > absDy && absDx > 10) {
          const nextOffset = { x: dx * 0.3, y: 0 };
          updateOffset(nextOffset, currentScale); // Apply damping for visual feedback
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
        updateOffset({ x: 0, y: 0 }, currentScale);
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
  }, [locale, markPendingDirection, preventDefault, router, updateOffset]);

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
        isPinchingRef.current = true;
        const t1 = e.touches[0]!;
        const t2 = e.touches[1]!;
        startDist = dist(t1, t2);
        startScale = scaleRef.current;
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
        scaleRef.current = next;
        const clamped = clampOffset(offsetRef.current, next);
        offsetRef.current = clamped;
        scheduleTransform(clamped.x, clamped.y, next);
        setScale(next);
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        isPinchingRef.current = false;
      }
    };
    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [clampOffset, scheduleTransform]);

  // Single-finger touch swipe for mobile navigation
  useEffect(() => {
    const el = imgWrapRef.current;
    if (!el) return;

    const SWIPE_THRESHOLD = 80; // Slightly lower threshold for touch
    let touchStartX = 0;
    let touchStartY = 0;
    let isSwiping = false;

    const onTouchStart = (e: TouchEvent) => {
      // Only handle single finger touch
      if (isPinchingRef.current || e.touches.length !== 1) return;
      const touch = e.touches[0]!;
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      isSwiping = true;
      setShowHint(false);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isSwiping || isPinchingRef.current || e.touches.length !== 1) return;
      const currentScale = scaleRef.current;

      // Only handle swipe when not zoomed
      if (currentScale > 1) {
        isSwiping = false;
        return;
      }

      const touch = e.touches[0]!;
      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // If horizontal swipe, prevent default scroll and show feedback
      if (absDx > absDy && absDx > 20) {
        e.preventDefault();
        updateOffset({ x: dx * 0.3, y: 0 }, currentScale);
        setIsDragging(true);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!isSwiping) return;
      isSwiping = false;

      const currentScale = scaleRef.current;
      if (currentScale > 1) {
        setIsDragging(false);
        return;
      }

      // Get end position from changedTouches
      const touch = e.changedTouches[0];
      if (!touch) {
        updateOffset({ x: 0, y: 0 }, currentScale);
        setIsDragging(false);
        return;
      }

      const dragDistance = touch.clientX - touchStartX;

      // Navigate if threshold met
      if (Math.abs(dragDistance) > SWIPE_THRESHOLD) {
        const visualNext = visualAdjacentIds.current.next;
        const visualPrev = visualAdjacentIds.current.prev;

        if (dragDistance < 0 && visualNext) {
          markPendingDirection("next");
          router.push(localePath(locale, `/gallery/${visualNext}`));
        } else if (dragDistance > 0 && visualPrev) {
          markPendingDirection("prev");
          router.push(localePath(locale, `/gallery/${visualPrev}`));
        }
      }

      // Reset offset with animation
      updateOffset({ x: 0, y: 0 }, currentScale);
      setIsDragging(false);
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [locale, markPendingDirection, router, updateOffset]);

  return (
    <div className="fixed inset-0 z-[60] bg-white dark:bg-stone-950" role="dialog" aria-modal="true">
      {/* Minimal floating toolbar (no full-width header) */}
      <div className="fixed top-4 right-4 z-[62] flex items-center gap-2">
        {/* Theme Toggle */}
        <ThemeToggle />
        {/* Close */}
        <Link
          ref={backButtonRef}
          href={localePath(locale, "/gallery")}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white/80 text-stone-700 shadow-sm backdrop-blur hover:bg-white dark:border-stone-800 dark:bg-stone-900/80 dark:text-stone-300"
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
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white/80 text-stone-700 shadow-sm backdrop-blur hover:bg-white dark:border-stone-800 dark:bg-stone-900/80 dark:text-stone-300"
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
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white/80 text-stone-700 shadow-sm backdrop-blur hover:bg-white dark:border-stone-800 dark:bg-stone-900/80 dark:text-stone-300"
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
              style={{ touchAction: "none" }}
            >
              <div className="absolute inset-0 overflow-hidden" style={{ contain: "content" }}>
                {slideContext && (
                  <div
                    className={`pointer-events-none absolute inset-0 transition-transform duration-300 ease-out ${slideContext.direction === "left"
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
                  className={`absolute inset-0 transition-transform duration-300 ease-out ${slideContext
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
                    ref={transformRef}
                    className="absolute inset-0"
                    style={{
                      transform:
                        "translate3d(var(--pv-offset-x, 0px), var(--pv-offset-y, 0px), 0) scale(var(--pv-scale, 1))",
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
                      unoptimized={displaySrc.startsWith("blob:") || isMediumSrc}
                      onLoad={(e) => {
                        const img = e.currentTarget;
                        setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
                      }}
                    />
                  </div>
                </div>
              </div>
              {showZoomIndicator && (
                <div className="pointer-events-none absolute top-4 right-4 rounded-full border border-stone-200 bg-white/80 px-3 py-1 text-xs font-medium text-stone-700 shadow-sm backdrop-blur dark:border-stone-800 dark:bg-stone-900/80 dark:text-stone-300">
                  {(scale * 100).toFixed(0)}%
                </div>
              )}
              {showHint && (
                <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-stone-200 bg-white/80 px-3 py-1 text-xs text-stone-600 shadow-sm backdrop-blur dark:border-stone-800 dark:bg-stone-900/80 dark:text-stone-400">
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
        <aside className="hidden w-full overflow-y-auto border-l border-stone-200/80 bg-gradient-to-b from-white to-stone-50/50 lg:block lg:max-w-[480px] lg:flex-none lg:basis-[380px] xl:basis-[420px] dark:border-stone-800/60 dark:from-[#0b0b0d] dark:to-[#0f0f12]">
          <PhotoMetadataPanel image={image} locale={locale} />
        </aside>
      </div>

      {/* Bottom thumbnail strip - exclude right sidebar on desktop */}
      {Array.isArray(thumbnails) && thumbnails.length > 0 && (
        <div className="pointer-events-auto fixed right-0 bottom-0 left-0 z-[61] border-t border-stone-200/60 bg-white/80 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] backdrop-blur-md lg:right-[380px] xl:right-[420px] dark:border-stone-700/50 dark:bg-stone-900/70 dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
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

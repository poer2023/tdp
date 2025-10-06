"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { GalleryImage } from "@/lib/gallery";
import { PhotoMetadataPanel } from "@/components/photo-metadata-panel";
import { LivePhotoPlayer } from "@/components/live-photo-player";
import Image from "next/image";

type PhotoViewerProps = {
  image: GalleryImage;
  prevId: string | null;
  nextId: string | null;
  prevPath?: string;
  nextPath?: string;
  locale?: "zh" | "en";
  thumbnails?: { id: string; filePath: string; microThumbPath?: string | null }[];
  currentId?: string;
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
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [copyToast, setCopyToast] = useState(false);
  const backButtonRef = useRef<HTMLAnchorElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const imgWrapRef = useRef<HTMLDivElement>(null);
  const [showHint, setShowHint] = useState(true);
  const [containerSize, setContainerSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [drag, setDrag] = useState<{
    active: boolean;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  }>({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 });

  // Focus management
  useEffect(() => {
    // Focus the back button when dialog opens
    backButtonRef.current?.focus();
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        router.push(`/${locale}/gallery`);
      } else if (e.key === "ArrowLeft" && prevId) {
        router.push(`/${locale}/gallery/${prevId}`);
      } else if (e.key === "ArrowRight" && nextId) {
        router.push(`/${locale}/gallery/${nextId}`);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, prevId, nextId, locale]);

  // Preload adjacent images
  useEffect(() => {
    if (prevPath) {
      const img = new window.Image();
      img.src = prevPath;
    }
    if (nextPath) {
      const img = new window.Image();
      img.src = nextPath;
    }
  }, [prevPath, nextPath]);

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

  // Observe container size
  useEffect(() => {
    const el = imgWrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        setContainerSize({ w: cr.width, h: cr.height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [clampOffset]);

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
        const next = Math.max(1, Math.min(3, prev * factor));
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

  // Drag to pan when scale > 1
  useEffect(() => {
    const el = imgWrapRef.current;
    if (!el) return;
    const onDown = (e: MouseEvent) => {
      if (scale <= 1) return;
      setDrag({
        active: true,
        startX: e.clientX,
        startY: e.clientY,
        originX: offset.x,
        originY: offset.y,
      });
    };
    const onMove = (e: MouseEvent) => {
      if (!drag.active) return;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      const next = { x: drag.originX + dx, y: drag.originY + dy };
      setOffset(clampOffset(next, scale));
    };
    const end = () => setDrag((d) => ({ ...d, active: false }));
    el.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", end);
    return () => {
      el.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", end);
    };
  }, [scale, offset, drag, containerSize, naturalSize, clampOffset]);

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
        const next = Math.max(1, Math.min(3, startScale * ratio));
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

  const handleShare = async () => {
    const shareData = {
      title: image.title || (locale === "zh" ? "未命名照片" : "Untitled Photo"),
      text: image.description || "",
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled or error occurred
      }
    } else {
      // Fallback: copy link
      navigator.clipboard.writeText(window.location.href);
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-white dark:bg-zinc-950" role="dialog" aria-modal="true">
      {/* Minimal floating toolbar (no full-width header) */}
      <div className="fixed top-4 right-4 z-[62] flex items-center gap-2">
        {/* Info (mobile) */}
        <button
          onClick={() => setShowInfoDrawer(true)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white/80 text-zinc-700 shadow-sm backdrop-blur hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300"
          title="查看信息"
          aria-label="查看照片信息"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
        {/* Download */}
        <a
          href={image.filePath}
          download
          className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white/80 text-zinc-700 shadow-sm backdrop-blur hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300"
          title="下载照片"
          aria-label="下载照片"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        </a>
        {/* Share */}
        <button
          onClick={handleShare}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white/80 text-zinc-700 shadow-sm backdrop-blur hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300"
          title="分享照片"
          aria-label="分享照片"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
        </button>
        {/* Close */}
        <Link
          ref={backButtonRef}
          href={`/${locale}/gallery`}
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

      {/* Side navigation arrows */}
      <div className="pointer-events-none fixed top-1/2 left-4 z-[62] -translate-y-1/2 lg:left-6">
        {prevId && (
          <Link
            href={`/${locale}/gallery/${prevId}`}
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white/80 text-zinc-700 shadow-sm backdrop-blur hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300"
            title="上一张"
            aria-label="上一张"
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
      <div className="pointer-events-none fixed top-1/2 right-4 z-[62] -translate-y-1/2 lg:right-6">
        {nextId && (
          <Link
            href={`/${locale}/gallery/${nextId}`}
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white/80 text-zinc-700 shadow-sm backdrop-blur hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300"
            title="下一张"
            aria-label="下一张"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>

      {/* Copy toast */}
      {copyToast && (
        <div className="fixed top-20 right-6 z-[62] rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow-lg dark:bg-zinc-900 dark:text-zinc-100">
          已复制链接
        </div>
      )}

      {/* Main content */}
      <div className="flex h-full flex-col lg:flex-row">
        {/* Image area */}
        <div className="relative flex flex-1 items-center justify-center overflow-hidden p-6">
          {image.isLivePhoto && image.livePhotoVideoPath ? (
            <div className="relative h-full w-full">
              <LivePhotoPlayer
                imageSrc={image.filePath}
                videoSrc={image.livePhotoVideoPath}
                alt={image.title || "未命名照片"}
                className="h-full w-full"
              />
            </div>
          ) : (
            <div
              ref={imgWrapRef}
              className={`relative h-full w-full ${scale > 1 ? "cursor-grab" : ""}`}
            >
              <div
                className="absolute inset-0"
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                  transformOrigin: "50% 50%",
                  transition: "transform 120ms ease-out",
                  willChange: "transform",
                  cursor: scale > 1 ? (drag.active ? "grabbing" : "grab") : "zoom-in",
                }}
              >
                <Image
                  src={scale > 2 ? image.filePath : image.mediumPath || image.filePath}
                  alt={image.title || "未命名照片"}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 65vw"
                  priority
                  onLoadingComplete={(img) =>
                    setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight })
                  }
                />
              </div>
              <div className="pointer-events-none absolute top-4 right-4 rounded-full border border-zinc-200 bg-white/80 px-3 py-1 text-xs font-medium text-zinc-700 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300">
                {(scale * 100).toFixed(0)}%
              </div>
              {showHint && (
                <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-zinc-200 bg-white/80 px-3 py-1 text-xs text-zinc-600 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400">
                  滚轮缩放 · 双击重置
                </div>
              )}
            </div>
          )}
        </div>

        {/* Metadata panel - desktop only */}
        <aside className="hidden w-full overflow-y-auto border-l border-zinc-200 bg-white lg:block lg:max-w-[480px] lg:flex-none lg:basis-[380px] xl:basis-[420px] dark:border-zinc-800 dark:bg-[#0b0b0d]">
          <PhotoMetadataPanel image={image} />
        </aside>
      </div>

      {/* Bottom film strip */}
      {Array.isArray(thumbnails) && thumbnails.length > 0 && (
        <div className="pointer-events-auto fixed right-0 bottom-0 left-0 z-[61] border-t border-zinc-200 bg-white/75 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-3">
            {thumbnails.map((t) => (
              <Link
                key={t.id}
                href={`/${locale}/gallery/${t.id}`}
                className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-md ring-1 ${
                  currentId === t.id ? "ring-blue-500" : "ring-zinc-200 dark:ring-zinc-700"
                }`}
                title={image.title || ""}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={t.microThumbPath || t.filePath}
                  alt="thumb"
                  className="h-full w-full object-cover"
                />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Mobile info drawer */}
      {showInfoDrawer && (
        <div
          className="fixed inset-0 z-[62] bg-black/30 lg:hidden"
          onClick={() => setShowInfoDrawer(false)}
        >
          <div
            className="fixed right-0 bottom-0 left-0 max-h-[70vh] overflow-y-auto rounded-t-2xl bg-white p-6 dark:bg-[#0b0b0d]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">照片信息</h2>
              <button
                onClick={() => setShowInfoDrawer(false)}
                className="flex h-8 w-8 items-center justify-center rounded text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                aria-label="关闭"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <PhotoMetadataPanel image={image} />
          </div>
        </div>
      )}
    </div>
  );
}

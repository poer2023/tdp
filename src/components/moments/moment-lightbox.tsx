"use client";

import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useLightbox } from "@/contexts/lightbox-context";

/**
 * Lightbox 组件 - 全屏图片和文字预览
 *
 * 使用 Context API 而非自定义事件，提供更好的类型安全和依赖追踪
 */
export function MomentLightbox() {
  const { isOpen, images, currentIndex, textContent, closeLightbox } = useLightbox();
  const [idx, setIdx] = useState(currentIndex);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  // Sync internal index with context
  useEffect(() => {
    setIdx(currentIndex);
  }, [currentIndex]);

  // Reset loaded images when opening new lightbox
  useEffect(() => {
    if (isOpen) {
      setLoadedImages(new Set());
    }
  }, [isOpen]);

  // 键盘导航
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeLightbox();
      } else if (e.key === "ArrowLeft" && images.length > 1) {
        setIdx((i) => (i - 1 + images.length) % images.length);
      } else if (e.key === "ArrowRight" && images.length > 1) {
        setIdx((i) => (i + 1) % images.length);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, images.length, closeLightbox]);

  // Check if lightbox should be open (either images or text)
  if (!isOpen || (images.length < 1 && !textContent)) return null;

  const isTextMode = !!textContent;
  const cur = images[idx];
  const prev = () => setIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setIdx((i) => (i + 1) % images.length);
  const isSingleImage = images.length === 1;

  return (
    <div
      className="fixed inset-0 z-[90] bg-black/85 backdrop-blur-sm"
      onClick={closeLightbox}
    >
      {/* 关闭按钮 - 44px minimum touch target */}
      <button
        className="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        onClick={(e) => {
          e.stopPropagation();
          closeLightbox();
        }}
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      {/* 左箭头 - 仅多图时显示 */}
      {!isTextMode && !isSingleImage && (
        <button
          className="absolute left-5 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          onClick={(e) => {
            e.stopPropagation();
            prev();
          }}
          aria-label="Previous image"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* 右箭头 - 仅多图时显示 */}
      {!isTextMode && !isSingleImage && (
        <button
          className="absolute right-5 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
          aria-label="Next image"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* 内容容器 - 图片或文字 */}
      <div
        className="flex h-full w-full items-center justify-center p-5"
        onClick={(e) => e.stopPropagation()}
      >
        {isTextMode ? (
          /* 文字内容显示 */
          <div className="max-h-[85vh] max-w-[800px] overflow-y-auto rounded-lg bg-white/95 p-8 shadow-2xl backdrop-blur-sm dark:bg-stone-900/95 md:p-12">
            <p className="whitespace-pre-wrap text-lg leading-relaxed text-stone-800 dark:text-stone-200 md:text-xl">
              {textContent}
            </p>
          </div>
        ) : (
          /* 图片显示 */
          cur && (
            <div className="relative">
              {/* Loading skeleton */}
              {!loadedImages.has(idx) && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-32 w-32 animate-pulse rounded-lg bg-white/10" />
                </div>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cur.url}
                alt={cur.alt || ""}
                className={`max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl transition-opacity duration-300 ${
                  !loadedImages.has(idx) ? "opacity-0" : "opacity-100"
                }`}
                onLoad={() => setLoadedImages((prev) => new Set(prev).add(idx))}
                onError={() => setLoadedImages((prev) => new Set(prev).add(idx))}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )
        )}
      </div>

      {/* 图片计数器 - 仅多图时显示 */}
      {!isTextMode && !isSingleImage && (
        <div className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/60 px-4 py-2 text-sm text-white backdrop-blur-sm">
          {idx + 1} / {images.length}
        </div>
      )}
    </div>
  );
}

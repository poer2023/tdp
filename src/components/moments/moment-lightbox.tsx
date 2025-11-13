"use client";

import { startTransition, useEffect, useState } from "react";
import type { MomentImage } from "@/lib/moments";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export function MomentLightbox() {
  const [open, setOpen] = useState(false);
  const [images, setImages] = useState<MomentImage[]>([]);
  const [idx, setIdx] = useState(0);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);

  // Listen for custom event to open lightbox
  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{ images: MomentImage[]; initialIndex: number }>;
      const { images: newImages, initialIndex } = customEvent.detail;

      if (newImages && newImages.length >= 1) {
        startTransition(() => {
          setImages(newImages);
          setIdx(Math.min(initialIndex, newImages.length - 1));
          setTextContent(null); // Clear text mode
          setImageLoading(true); // Reset loading state
          setOpen(true);
        });
      }
    };

    window.addEventListener('open-moment-lightbox', handleOpen);
    return () => window.removeEventListener('open-moment-lightbox', handleOpen);
  }, []);

  // Listen for text lightbox event
  useEffect(() => {
    const handleTextOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{ text: string }>;
      const { text } = customEvent.detail;

      if (text) {
        startTransition(() => {
          setTextContent(text);
          setImages([]); // Clear image mode
          setOpen(true);
        });
      }
    };

    window.addEventListener('open-text-lightbox', handleTextOpen);
    return () => window.removeEventListener('open-text-lightbox', handleTextOpen);
  }, []);

  // Reset loading state when image index changes
  useEffect(() => {
    if (open && !textContent && images.length > 0) {
      setImageLoading(true);
    }
  }, [idx, open, textContent, images.length]);

  // 键盘导航
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      } else if (e.key === "ArrowLeft" && images.length > 1) {
        prev();
      } else if (e.key === "ArrowRight" && images.length > 1) {
        next();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, images.length]);

  // Check if lightbox should be open (either images or text)
  if (!open || (images.length < 1 && !textContent)) return null;

  const isTextMode = !!textContent;
  const cur = images[idx];
  const prev = () => setIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setIdx((i) => (i + 1) % images.length);
  const isSingleImage = images.length === 1;

  return (
    <div
      className="fixed inset-0 z-[90] bg-black/85 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      {/* 关闭按钮 - 44px minimum touch target */}
      <button
        className="absolute top-5 right-5 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(false);
        }}
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      {/* 左箭头 - 仅多图时显示 */}
      {!isTextMode && !isSingleImage && (
        <button
          className="absolute top-1/2 left-5 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
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
          className="absolute top-1/2 right-5 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
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
          <div className="max-h-[85vh] max-w-[800px] overflow-y-auto rounded-lg bg-white/95 p-8 shadow-2xl backdrop-blur-sm dark:bg-zinc-900/95 md:p-12">
            <p className="whitespace-pre-wrap text-lg leading-relaxed text-zinc-800 dark:text-zinc-200 md:text-xl">
              {textContent}
            </p>
          </div>
        ) : (
          /* 图片显示 */
          cur && (
            <div className="relative">
              {/* Loading skeleton */}
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-32 w-32 animate-pulse rounded-lg bg-white/10" />
                </div>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cur.url}
                alt={cur.alt || ""}
                className={`max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl transition-opacity duration-300 ${
                  imageLoading ? "opacity-0" : "opacity-100"
                }`}
                onLoad={() => setImageLoading(false)}
                onError={() => setImageLoading(false)}
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

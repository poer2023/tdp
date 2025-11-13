"use client";

import { startTransition, useEffect, useState } from "react";
import type { MomentImage } from "@/lib/moments";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export function MomentLightbox() {
  const [open, setOpen] = useState(false);
  const [images, setImages] = useState<MomentImage[]>([]);
  const [idx, setIdx] = useState(0);

  // Listen for custom event to open lightbox
  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{ images: MomentImage[]; initialIndex: number }>;
      const { images: newImages, initialIndex } = customEvent.detail;

      if (newImages && newImages.length >= 1) {
        startTransition(() => {
          setImages(newImages);
          setIdx(Math.min(initialIndex, newImages.length - 1));
          setOpen(true);
        });
      }
    };

    window.addEventListener('open-moment-lightbox', handleOpen);
    return () => window.removeEventListener('open-moment-lightbox', handleOpen);
  }, []);

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

  // 修改：支持单图时也显示
  if (!open || images.length < 1) return null;

  const cur = images[idx]!;
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
      {!isSingleImage && (
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
      {!isSingleImage && (
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

      {/* 图片容器 */}
      <div
        className="flex h-full w-full items-center justify-center p-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cur.url}
          alt={cur.alt || ""}
          className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* 图片计数器 - 仅多图时显示 */}
      {!isSingleImage && (
        <div className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/60 px-4 py-2 text-sm text-white backdrop-blur-sm">
          {idx + 1} / {images.length}
        </div>
      )}
    </div>
  );
}

"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import type { GalleryItemData } from "@/lib/gallery-utils";

interface GalleryProps {
  data: GalleryItemData[];
  onImageClick?: (src: string) => void;
  locale: string; // 用于国际化路由
}

interface ImageModalProps {
  src: string | null;
  onClose: () => void;
}

/**
 * Gallery Component - 响应式网格布局相册
 * 适配 Next.js 和 TypeScript，使用数据库的 GalleryImage 数据
 */
export function Gallery({ data, onImageClick, locale }: GalleryProps) {
  return (
    <section className="py-12 md:py-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {data.map((img) => (
            <Link
              key={img.id}
              href={`/${locale}/gallery/${img.id}`}
              className={`group relative cursor-pointer overflow-hidden rounded-lg ${img.span} block`}
              onClick={(e) => {
                // 如果提供了 onImageClick，则阻止默认跳转并触发点击事件
                if (onImageClick) {
                  e.preventDefault();
                  onImageClick(img.src);
                }
              }}
            >
              <div className="relative aspect-square h-full min-h-[200px] w-full">
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="gallery-img object-cover"
                  placeholder="blur"
                  blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB2aWV3Qm94PSIwIDAgMSAxIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlNWU3ZWIiLz48L3N2Zz4="
                />
              </div>
              {/* 悬停渐变遮罩 */}
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <p className="translate-y-4 transform text-base font-medium text-white transition-transform duration-300 ease-in-out group-hover:translate-y-0 md:text-lg">
                  {img.title}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * ImageModal Component - 图片放大预览模态框
 * 支持 ESC 键关闭和点击背景关闭
 */
export function ImageModal({ src, onClose }: ImageModalProps) {
  if (!src) return null;

  return (
    <div
      className="bg-opacity-80 fixed inset-0 z-50 flex items-center justify-center bg-black opacity-100"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Image Preview"
    >
      <div className="relative max-h-[90vh] max-w-[90vw]">
        <Image
          src={src}
          alt="Enlarged view"
          width={1200}
          height={900}
          className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <button
        className="absolute top-5 right-5 text-4xl font-bold text-white transition-colors hover:text-gray-300"
        onClick={onClose}
        aria-label="Close Preview"
      >
        &times;
      </button>
    </div>
  );
}

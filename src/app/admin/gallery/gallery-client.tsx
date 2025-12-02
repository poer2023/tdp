"use client";

import type { GalleryImage as GalleryImageType } from "@/lib/gallery";
import type { PostSummary } from "@/lib/posts";
import { UnifiedUploadForm } from "./unified-upload-form";
import { AdminGalleryGrid } from "./admin-gallery-grid";

type GalleryClientProps = {
  images: GalleryImageType[];
  posts: PostSummary[];
};

export function AdminGalleryClient({ images, posts: _posts }: GalleryClientProps) {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs tracking-[0.3em] text-stone-400 uppercase">Gallery</p>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl dark:text-stone-50">
          相册管理
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          上传、整理博客配图，让首页和文章更具视觉表现力。
        </p>
      </header>

      <UnifiedUploadForm />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">照片列表</h2>
          <span className="text-sm text-stone-500 dark:text-stone-400">共 {images.length} 张</span>
        </div>
        {images.length ? (
          <AdminGalleryGrid images={images} />
        ) : (
          <p className="rounded-3xl border border-dashed border-stone-300 px-6 py-12 text-center text-sm text-stone-500 dark:border-stone-700 dark:text-stone-400">
            相册还没有内容，尝试上传一张照片吧。
          </p>
        )}
      </section>
    </div>
  );
}

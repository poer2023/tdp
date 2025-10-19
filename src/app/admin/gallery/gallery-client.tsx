"use client";

import type { GalleryImage as GalleryImageType } from "@/lib/gallery";
import type { PostSummary } from "@/lib/posts";
import { GalleryUploadForm } from "./upload-form";
import { BulkUploadPanel } from "./bulk-upload-panel";
import { AdminGalleryGrid } from "./admin-gallery-grid";

type GalleryClientProps = {
  images: GalleryImageType[];
  posts: PostSummary[];
};

export function AdminGalleryClient({ images, posts }: GalleryClientProps) {
  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="text-sm tracking-[0.3em] text-zinc-400 uppercase">Gallery</p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          相册管理
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          上传、整理博客配图，让首页和文章更具视觉表现力。
        </p>
      </header>

      <GalleryUploadForm posts={posts} />
      <BulkUploadPanel />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">照片列表</h2>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">共 {images.length} 张</span>
        </div>
        {images.length ? (
          <AdminGalleryGrid images={images} />
        ) : (
          <p className="rounded-3xl border border-dashed border-zinc-300 px-6 py-12 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            相册还没有内容，尝试上传一张照片吧。
          </p>
        )}
      </section>
    </div>
  );
}

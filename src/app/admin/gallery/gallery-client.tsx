"use client";

import type { GalleryImage as GalleryImageType } from "@/lib/gallery";
import type { PostSummary } from "@/lib/posts";
import { UnifiedUploadForm } from "./unified-upload-form";
import { AdminGalleryGrid } from "./admin-gallery-grid";
import { Card } from "@/components/ui-heroui";

type GalleryClientProps = {
  images: GalleryImageType[];
  posts: PostSummary[];
};

export function AdminGalleryClient({ images, posts: _posts }: GalleryClientProps) {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs tracking-[0.3em] text-zinc-400 uppercase">Gallery</p>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
          相册管理
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          上传、整理博客配图，让首页和文章更具视觉表现力。
        </p>
      </header>

      <UnifiedUploadForm />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">照片列表</h2>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">共 {images.length} 张</span>
        </div>
        {images.length ? (
          <AdminGalleryGrid images={images} />
        ) : (
          <Card variant="default" className="px-6 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
            相册还没有内容，尝试上传一张照片吧。
          </Card>
        )}
      </section>
    </div>
  );
}

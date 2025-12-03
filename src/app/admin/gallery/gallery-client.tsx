"use client";

import type { GalleryImage as GalleryImageType } from "@/lib/gallery";
import type { PostSummary } from "@/lib/posts";
import { UnifiedUploadForm } from "./unified-upload-form";
import { AdminGalleryGrid } from "./admin-gallery-grid";
import { LuminaDataSection } from "@/components/admin/lumina-shared";

type GalleryClientProps = {
  images: GalleryImageType[];
  posts: PostSummary[];
};

export function AdminGalleryClient({ images, posts: _posts }: GalleryClientProps) {
  return (
    <div className="max-w-6xl mx-auto animate-in fade-in space-y-8 pb-12">
      <header className="space-y-3">
        <p className="text-sm tracking-[0.3em] text-stone-400 uppercase">Media</p>
        <h1 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100">
          相册管理
        </h1>
        <p className="text-stone-500 dark:text-stone-400">
          上传、整理博客配图，让首页和文章更具视觉表现力。
        </p>
      </header>

      <LuminaDataSection title="上传" description="Lumina 风格上传区，支持批量和单独编辑">
        <UnifiedUploadForm />
      </LuminaDataSection>

      <LuminaDataSection
        title="照片列表"
        description="最新上传靠前展示，支持快速操作"
        action={<span className="text-sm text-stone-500 dark:text-stone-400">共 {images.length} 张</span>}
      >
        {images.length ? (
          <AdminGalleryGrid images={images} />
        ) : (
          <p className="rounded-3xl border border-dashed border-stone-300 px-6 py-12 text-center text-sm text-stone-500 dark:border-stone-700 dark:text-stone-400">
            相册还没有内容，尝试上传一张照片吧。
          </p>
        )}
      </LuminaDataSection>
    </div>
  );
}

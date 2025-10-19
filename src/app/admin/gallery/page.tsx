import { Suspense } from "react";
import { listGalleryImages } from "@/lib/gallery";
import { listPostSummaries } from "@/lib/posts";
import { features } from "@/config/features";
import { AdminErrorBoundary } from "@/components/error-boundaries/admin-error-boundary";
import { AdminGalleryClientShell } from "./gallery-client-shell";

export const revalidate = 0;

const GallerySkeleton = () => (
  <div className="space-y-10">
    <div className="h-32 animate-pulse rounded-3xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/40" />
    <div className="h-72 animate-pulse rounded-3xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/40" />
    <div className="h-[500px] animate-pulse rounded-3xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/40" />
  </div>
);

async function GalleryContent() {
  const [images, posts] = await Promise.all([listGalleryImages(), listPostSummaries()]);
  return <AdminGalleryClientShell images={images} posts={posts} />;
}

export default async function AdminGalleryPage() {
  if (!features.get("adminGallery")) {
    return (
      <div className="space-y-6">
        <header className="space-y-3">
          <p className="text-sm tracking-[0.3em] text-zinc-400 uppercase">Gallery</p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
            相册管理
          </h1>
        </header>
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          已禁用相册管理功能。请在环境变量中设置{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs">FEATURE_ADMIN_GALLERY=on</code>{" "}
          后重新部署启用。
        </section>
      </div>
    );
  }

  return (
    <AdminErrorBoundary>
      <Suspense fallback={<GallerySkeleton />}>
        <GalleryContent />
      </Suspense>
    </AdminErrorBoundary>
  );
}

"use client";

import dynamic from "next/dynamic";
import type { GalleryImage as GalleryImageType } from "@/lib/gallery";
import type { PostSummary } from "@/lib/posts";

const AdminGalleryClientLazy = dynamic(
  () => import("./gallery-client").then((mod) => ({ default: mod.AdminGalleryClient })),
  {
    ssr: false,
    loading: () => <GallerySkeleton />,
  }
);

type AdminGalleryClientShellProps = {
  images: GalleryImageType[];
  posts: PostSummary[];
};

export function AdminGalleryClientShell(props: AdminGalleryClientShellProps) {
  return <AdminGalleryClientLazy {...props} />;
}

function GallerySkeleton() {
  return (
    <div className="space-y-10">
      <div className="h-32 animate-pulse rounded-3xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/40" />
      <div className="h-72 animate-pulse rounded-3xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/40" />
      <div className="h-[500px] animate-pulse rounded-3xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/40" />
    </div>
  );
}

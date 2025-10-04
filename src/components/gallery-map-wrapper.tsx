"use client";

import dynamic from "next/dynamic";
import type { GalleryImage } from "@/lib/gallery";

const GalleryMap = dynamic(() => import("@/components/gallery-map").then((mod) => mod.GalleryMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-[600px] items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm text-zinc-500">Loading map...</p>
    </div>
  ),
});

type GalleryMapWrapperProps = {
  images: GalleryImage[];
  locale?: "zh" | "en";
};

export function GalleryMapWrapper({ images, locale = "zh" }: GalleryMapWrapperProps) {
  return <GalleryMap images={images} locale={locale} />;
}

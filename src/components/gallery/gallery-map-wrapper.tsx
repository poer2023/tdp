"use client";

import dynamic from "next/dynamic";
import type { GalleryLocationImage } from "@/lib/gallery";

const GalleryMap = dynamic(() => import("@/components/gallery/gallery-map").then((mod) => mod.GalleryMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-[600px] items-center justify-center rounded-lg border border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-900">
      <p className="text-sm text-stone-500">Loading map...</p>
    </div>
  ),
});

type GalleryMapWrapperProps = {
  images: GalleryLocationImage[];
  locale?: "zh" | "en";
};

export function GalleryMapWrapper({ images, locale = "zh" }: GalleryMapWrapperProps) {
  return <GalleryMap images={images} locale={locale} />;
}

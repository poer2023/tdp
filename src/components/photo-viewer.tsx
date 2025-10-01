"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { GalleryImage } from "@/lib/gallery";
import { PhotoMetadataPanel } from "@/components/photo-metadata-panel";
import { LivePhotoPlayer } from "@/components/live-photo-player";
import Image from "next/image";

type PhotoViewerProps = {
  image: GalleryImage;
  prevId: string | null;
  nextId: string | null;
};

export function PhotoViewer({ image, prevId, nextId }: PhotoViewerProps) {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        router.push("/gallery");
      } else if (e.key === "ArrowLeft" && prevId) {
        router.push(`/gallery/${prevId}`);
      } else if (e.key === "ArrowRight" && nextId) {
        router.push(`/gallery/${nextId}`);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, prevId, nextId]);

  return (
    <div className="fixed inset-0 bg-zinc-950">
      {/* Header with back button */}
      <header className="absolute top-0 right-0 left-0 z-20 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/95 px-6 py-4 backdrop-blur-sm">
        <Link
          href="/gallery"
          className="flex items-center gap-2 text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-100"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          返回相册
        </Link>

        {/* Navigation buttons */}
        <div className="flex items-center gap-2">
          {prevId ? (
            <Link
              href={`/gallery/${prevId}`}
              className="flex h-8 w-8 items-center justify-center rounded border border-zinc-700 text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-100"
              title="上一张 (←)"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>
          ) : (
            <div className="h-8 w-8 rounded border border-zinc-800 text-zinc-700">
              <svg
                className="h-full w-full p-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </div>
          )}

          {nextId ? (
            <Link
              href={`/gallery/${nextId}`}
              className="flex h-8 w-8 items-center justify-center rounded border border-zinc-700 text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-100"
              title="下一张 (→)"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          ) : (
            <div className="h-8 w-8 rounded border border-zinc-800 text-zinc-700">
              <svg
                className="h-full w-full p-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="flex h-full flex-col pt-[65px] lg:flex-row">
        {/* Image area - 65% on desktop */}
        <div className="relative flex flex-1 items-center justify-center p-6 lg:w-[65%]">
          {image.isLivePhoto && image.livePhotoVideoPath ? (
            <div className="relative h-full w-full">
              <LivePhotoPlayer
                imageSrc={image.filePath}
                videoSrc={image.livePhotoVideoPath}
                alt={image.title || "Live Photo"}
                className="h-full w-full"
              />
            </div>
          ) : (
            <div className="relative h-full w-full">
              <Image
                src={image.filePath}
                alt={image.title || "照片"}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 65vw"
                priority
              />
            </div>
          )}
        </div>

        {/* Metadata panel - 35% on desktop, below on mobile */}
        <aside className="w-full overflow-y-auto border-t border-zinc-800 bg-zinc-900/50 lg:w-[35%] lg:border-t-0 lg:border-l">
          <PhotoMetadataPanel image={image} />
        </aside>
      </div>
    </div>
  );
}

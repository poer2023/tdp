"use client";

import { useEffect, useState, useRef } from "react";
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
  prevPath?: string;
  nextPath?: string;
  locale?: "zh" | "en";
};

export function PhotoViewer({
  image,
  prevId,
  nextId,
  prevPath,
  nextPath,
  locale = "zh",
}: PhotoViewerProps) {
  const router = useRouter();
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [copyToast, setCopyToast] = useState(false);
  const backButtonRef = useRef<HTMLAnchorElement>(null);

  // Focus management
  useEffect(() => {
    // Focus the back button when dialog opens
    backButtonRef.current?.focus();
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        router.push(`/${locale}/gallery`);
      } else if (e.key === "ArrowLeft" && prevId) {
        router.push(`/${locale}/gallery/${prevId}`);
      } else if (e.key === "ArrowRight" && nextId) {
        router.push(`/${locale}/gallery/${nextId}`);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, prevId, nextId, locale]);

  // Preload adjacent images
  useEffect(() => {
    if (prevPath) {
      const img = new window.Image();
      img.src = prevPath;
    }
    if (nextPath) {
      const img = new window.Image();
      img.src = nextPath;
    }
  }, [prevPath, nextPath]);

  const handleShare = async () => {
    const shareData = {
      title: image.title || (locale === "zh" ? "未命名照片" : "Untitled Photo"),
      text: image.description || "",
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback: copy link
      navigator.clipboard.writeText(window.location.href);
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-zinc-950" role="dialog" aria-modal="true">
      {/* Header with back button */}
      <header className="fixed top-0 right-0 left-0 z-[61] flex items-center justify-between border-b border-zinc-800 bg-zinc-950/95 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Link
            ref={backButtonRef}
            href={`/${locale}/gallery`}
            className="flex items-center gap-2 text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-100"
            aria-label={locale === "zh" ? "返回相册页面" : "Back to Gallery"}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            {locale === "zh" ? "返回相册" : "Back to Gallery"}
          </Link>

          {/* Keyboard hints - desktop only */}
          <span className="hidden text-xs text-zinc-600 md:block">Esc 返回 · ←/→ 切换</span>
        </div>

        {/* Navigation and action buttons */}
        <div className="flex items-center gap-2">
          {/* Info button - mobile only */}
          <button
            onClick={() => setShowInfoDrawer(true)}
            className="flex h-8 w-8 items-center justify-center rounded border border-zinc-700 text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-100 lg:hidden"
            title="查看信息"
            aria-label="查看照片信息"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>

          {/* Previous */}
          {prevId ? (
            <Link
              href={`/gallery/${prevId}`}
              className="flex h-8 w-8 items-center justify-center rounded border border-zinc-700 text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-100"
              title="上一张 (←)"
              aria-label="上一张照片"
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

          {/* Next */}
          {nextId ? (
            <Link
              href={`/gallery/${nextId}`}
              className="flex h-8 w-8 items-center justify-center rounded border border-zinc-700 text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-100"
              title="下一张 (→)"
              aria-label="下一张照片"
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

          {/* Download */}
          <a
            href={image.filePath}
            download
            className="flex h-8 w-8 items-center justify-center rounded border border-zinc-700 text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-100"
            title="下载照片"
            aria-label="下载照片"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </a>

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex h-8 w-8 items-center justify-center rounded border border-zinc-700 text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-100"
            title="分享照片"
            aria-label="分享照片"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Copy toast */}
      {copyToast && (
        <div className="fixed top-20 right-6 z-[62] rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow-lg">
          已复制链接
        </div>
      )}

      {/* Main content */}
      <div className="flex h-full flex-col pt-[65px] lg:flex-row">
        {/* Image area */}
        <div className="relative flex flex-1 items-center justify-center p-6">
          {image.isLivePhoto && image.livePhotoVideoPath ? (
            <div className="relative h-full w-full">
              <LivePhotoPlayer
                imageSrc={image.filePath}
                videoSrc={image.livePhotoVideoPath}
                alt={image.title || "未命名照片"}
                className="h-full w-full"
              />
            </div>
          ) : (
            <div className="relative h-full w-full">
              <Image
                src={image.filePath}
                alt={image.title || "未命名照片"}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 65vw"
                priority
              />
            </div>
          )}
        </div>

        {/* Metadata panel - desktop only */}
        <aside className="hidden w-full overflow-y-auto border-l border-zinc-800 bg-[#0b0b0d] lg:block lg:max-w-[480px] lg:flex-none lg:basis-[380px] xl:basis-[420px]">
          <PhotoMetadataPanel image={image} />
        </aside>
      </div>

      {/* Mobile info drawer */}
      {showInfoDrawer && (
        <div
          className="fixed inset-0 z-[62] bg-black/50 lg:hidden"
          onClick={() => setShowInfoDrawer(false)}
        >
          <div
            className="fixed right-0 bottom-0 left-0 max-h-[70vh] overflow-y-auto rounded-t-2xl bg-[#0b0b0d] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-100">照片信息</h2>
              <button
                onClick={() => setShowInfoDrawer(false)}
                className="flex h-8 w-8 items-center justify-center rounded text-zinc-400 hover:text-zinc-100"
                aria-label="关闭"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <PhotoMetadataPanel image={image} />
          </div>
        </div>
      )}
    </div>
  );
}

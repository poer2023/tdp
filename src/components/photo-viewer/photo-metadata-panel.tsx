"use client";

import dynamic from "next/dynamic";
import type { GalleryImage } from "@/lib/gallery";
import { useTheme } from "next-themes";

// Dynamically import map components to avoid SSR issues
const LocationMapMini = dynamic(
  () => import("@/components/ui/map").then((mod) => {
    const { Map, MapMarker, MarkerContent, MapControls } = mod;

    return function LocationMapMiniInner({
      latitude,
      longitude,
    }: {
      latitude: number;
      longitude: number;
    }) {
      return (
        <Map
          center={[longitude, latitude]}
          zoom={14}
          scrollZoom={true}
          doubleClickZoom={true}
          className="h-full w-full"
        >
          <MapMarker longitude={longitude} latitude={latitude}>
            <MarkerContent>
              <div className="relative">
                <div className="h-8 w-8 text-rose-500 drop-shadow-md">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                </div>
                <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 animate-ping rounded-full bg-rose-400/50" />
              </div>
            </MarkerContent>
          </MapMarker>
          <MapControls position="top-right" showZoom />
        </Map>
      );
    };
  }),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-stone-100 dark:bg-stone-800">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" />
      </div>
    ),
  }
);

type PhotoMetadataPanelProps = {
  image: GalleryImage;
  locale?: "zh" | "en";
};

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return "Unknown";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateString: string | null | undefined, locale: string = "zh"): string {
  if (!dateString) return locale === "zh" ? "未知" : "Unknown";
  const date = new Date(dateString);
  return date.toLocaleString(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeTime(dateString: string | null | undefined, locale: string = "zh"): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return locale === "zh" ? "今天" : "Today";
  if (diffDays === 1) return locale === "zh" ? "昨天" : "Yesterday";
  if (diffDays < 7) return locale === "zh" ? `${diffDays} 天前` : `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return locale === "zh" ? `${weeks} 周前` : `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return locale === "zh" ? `${months} 个月前` : `${months} month${months > 1 ? "s" : ""} ago`;
  }
  const years = Math.floor(diffDays / 365);
  return locale === "zh" ? `${years} 年前` : `${years} year${years > 1 ? "s" : ""} ago`;
}

export function PhotoMetadataPanel({ image, locale = "zh" }: PhotoMetadataPanelProps) {
  useTheme(); // Keep hook call for potential future use
  const hasLocation = image.latitude && image.longitude;

  return (
    <div className="space-y-5 p-5">
      {/* Title and description */}
      <div className="space-y-2">
        <h1 className="text-xl font-semibold leading-tight text-stone-900 dark:text-stone-100">
          {image.title || (locale === "zh" ? "未命名照片" : "Untitled Photo")}
        </h1>
        {image.description && (
          <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">
            {image.description}
          </p>
        )}
      </div>

      {/* Location map */}
      {hasLocation && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-rose-100 dark:bg-rose-900/30">
              <svg className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-xs font-medium tracking-wider text-stone-500 uppercase dark:text-stone-400">
              {locale === "zh" ? "位置" : "Location"}
            </h2>
          </div>
          <div className="overflow-hidden rounded-xl border border-stone-200/60 shadow-sm dark:border-stone-700/50">
            <div className="aspect-square w-full">
              <LocationMapMini
                latitude={image.latitude!}
                longitude={image.longitude!}
              />
            </div>
          </div>
          <div className="space-y-1.5 rounded-lg bg-stone-50/80 p-3 dark:bg-stone-800/50">
            {(image.city || image.country) && (
              <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
                {[image.city, image.country].filter(Boolean).join(", ")}
              </p>
            )}
            {image.locationName && (
              <p className="text-xs text-stone-500 dark:text-stone-400">{image.locationName}</p>
            )}
            <p className="font-mono text-[11px] text-stone-400 dark:text-stone-500">
              {image.latitude?.toFixed(6)}, {image.longitude?.toFixed(6)}
            </p>
          </div>
        </section>
      )}

      {/* File information */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
            <svg className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-xs font-medium tracking-wider text-stone-500 uppercase dark:text-stone-400">
            {locale === "zh" ? "文件信息" : "File Info"}
          </h2>
        </div>
        <div className="rounded-lg bg-stone-50/80 p-3 dark:bg-stone-800/50">
          <dl className="grid grid-cols-[90px_1fr] gap-x-3 gap-y-2 text-sm">
            {image.width && image.height && (
              <>
                <dt className="text-stone-500 dark:text-stone-400">{locale === "zh" ? "分辨率" : "Resolution"}</dt>
                <dd className="font-medium text-stone-700 dark:text-stone-300">
                  {image.width} × {image.height}
                </dd>
              </>
            )}

            <dt className="text-stone-500 dark:text-stone-400">{locale === "zh" ? "大小" : "Size"}</dt>
            <dd className="font-medium text-stone-700 dark:text-stone-300">{formatFileSize(image.fileSize)}</dd>

            {image.mimeType && (
              <>
                <dt className="text-stone-500 dark:text-stone-400">{locale === "zh" ? "格式" : "Format"}</dt>
                <dd className="font-mono text-xs font-medium text-stone-700 uppercase dark:text-stone-300">
                  {image.mimeType.split("/")[1]}
                </dd>
              </>
            )}
          </dl>
        </div>
      </section>

      {/* Temporal information */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-900/30">
            <svg className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xs font-medium tracking-wider text-stone-500 uppercase dark:text-stone-400">
            {locale === "zh" ? "时间" : "Time"}
          </h2>
        </div>
        <div className="rounded-lg bg-stone-50/80 p-3 dark:bg-stone-800/50">
          <dl className="grid grid-cols-[90px_1fr] gap-x-3 gap-y-2 text-sm">
            {image.capturedAt && (
              <>
                <dt className="text-stone-500 dark:text-stone-400">{locale === "zh" ? "拍摄" : "Captured"}</dt>
                <dd className="text-stone-700 dark:text-stone-300">
                  <span className="font-medium">{formatDate(image.capturedAt, locale)}</span>
                  <span className="ml-2 text-xs text-stone-400 dark:text-stone-500">
                    {formatRelativeTime(image.capturedAt, locale)}
                  </span>
                </dd>
              </>
            )}
            <dt className="text-stone-500 dark:text-stone-400">{locale === "zh" ? "上传" : "Uploaded"}</dt>
            <dd className="text-stone-700 dark:text-stone-300">
              <span className="font-medium">{formatDate(image.createdAt, locale)}</span>
              <span className="ml-2 text-xs text-stone-400 dark:text-stone-500">
                {formatRelativeTime(image.createdAt, locale)}
              </span>
            </dd>
          </dl>
        </div>
      </section>

      {/* Live Photo */}
      {image.isLivePhoto && image.livePhotoVideoPath && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-100 dark:bg-purple-900/30">
              <svg className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xs font-medium tracking-wider text-stone-500 uppercase dark:text-stone-400">Live Photo</h2>
          </div>
          <div className="rounded-lg bg-stone-50/80 p-3 dark:bg-stone-800/50">
            <p className="mb-3 text-xs text-stone-500 dark:text-stone-400">
              {locale === "zh"
                ? "此照片包含动态内容，悬停预览播放"
                : "Contains live content, hover to play"}
            </p>
            <a
              href={image.livePhotoVideoPath}
              download="live-photo-video.mov"
              className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-purple-700 hover:shadow active:scale-95"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {locale === "zh" ? "下载视频" : "Download Video"}
            </a>
          </div>
        </section>
      )}

      {/* Technical footer */}
      <footer className="border-t border-stone-200/60 pt-4 dark:border-stone-700/50">
        <p className="text-[11px] leading-relaxed text-stone-400 dark:text-stone-500">
          {locale === "zh" ? "元数据由 EXIF 自动提取" : "Metadata extracted from EXIF"}
          {hasLocation && (
            <span>
              {locale === "zh"
                ? "，位置通过 OSM 逆地理编码获取"
                : ", location via OSM geocoding"}
            </span>
          )}
          {" · "}
          <span className="font-mono">{image.storageType}</span>
        </p>
      </footer>
    </div>
  );
}

"use client";

import dynamic from "next/dynamic";
import type { GalleryImage } from "@/lib/gallery";

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), {
  ssr: false,
});
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), {
  ssr: false,
});
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });

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

export function PhotoMetadataPanel({ image, locale = "zh" }: PhotoMetadataPanelProps) {
  const hasLocation = image.latitude && image.longitude;
  const fileName = image.filePath.split("/").pop() || (locale === "zh" ? "未知" : "Unknown");

  return (
    <div className="space-y-6 p-6">
      {/* Title and description */}
      <div className="space-y-2">
        <h1 className="text-2xl leading-tight font-semibold text-stone-900 dark:text-stone-100">
          {image.title || (locale === "zh" ? "未命名照片" : "Untitled Photo")}
        </h1>
        {image.description && (
          <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-300">
            {image.description}
          </p>
        )}
      </div>

      {/* Location map */}
      {hasLocation && (
        <section className="space-y-3">
          <h2 className="text-xs font-medium tracking-wider text-stone-500 uppercase">
            {locale === "zh" ? "位置信息" : "Location"}
          </h2>
          <div className="overflow-hidden rounded-lg border border-stone-200 dark:border-stone-800">
            <div className="h-[200px] w-full">
              <MapContainer
                center={[image.latitude!, image.longitude!]}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
                zoomControl={false}
                attributionControl={false}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[image.latitude!, image.longitude!]} />
              </MapContainer>
            </div>
          </div>
          <div className="space-y-1 text-sm">
            {image.city && image.country && (
              <p className="text-stone-700 dark:text-stone-300">
                {image.city}, {image.country}
              </p>
            )}
            {image.locationName && (
              <p className="text-xs text-stone-500 dark:text-stone-500">{image.locationName}</p>
            )}
            <p className="font-mono text-xs text-stone-500 dark:text-stone-600">
              {image.latitude?.toFixed(6)}, {image.longitude?.toFixed(6)}
            </p>
          </div>
        </section>
      )}

      {/* File information */}
      <section className="space-y-3">
        <h2 className="text-xs font-medium tracking-wider text-stone-500 uppercase">
          {locale === "zh" ? "文件信息" : "File Info"}
        </h2>
        <dl className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-stone-500">{locale === "zh" ? "文件名" : "Filename"}</dt>
          <dd
            className="line-clamp-2 font-mono text-xs break-all text-stone-700 md:line-clamp-3 dark:text-stone-300"
            title={fileName}
          >
            {fileName}
          </dd>

          <dt className="text-stone-500">{locale === "zh" ? "文件大小" : "Size"}</dt>
          <dd className="text-stone-700 dark:text-stone-300">{formatFileSize(image.fileSize)}</dd>

          {image.width && image.height && (
            <>
              <dt className="text-stone-500">{locale === "zh" ? "分辨率" : "Resolution"}</dt>
              <dd className="text-stone-700 dark:text-stone-300">
                {image.width} × {image.height}
              </dd>
            </>
          )}

          {image.mimeType && (
            <>
              <dt className="text-stone-500">{locale === "zh" ? "格式" : "Format"}</dt>
              <dd className="font-mono text-xs text-stone-700 uppercase dark:text-stone-300">
                {image.mimeType.split("/")[1]}
              </dd>
            </>
          )}
        </dl>
      </section>

      {/* Temporal information */}
      <section className="space-y-3">
        <h2 className="text-xs font-medium tracking-wider text-stone-500 uppercase">
          {locale === "zh" ? "时间信息" : "Time"}
        </h2>
        <dl className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-2 text-sm">
          {image.capturedAt && (
            <>
              <dt className="text-stone-500">{locale === "zh" ? "拍摄时间" : "Captured"}</dt>
              <dd className="text-stone-700 dark:text-stone-300">
                {formatDate(image.capturedAt, locale)}
              </dd>
            </>
          )}
          <dt className="text-stone-500">{locale === "zh" ? "上传时间" : "Uploaded"}</dt>
          <dd className="text-stone-700 dark:text-stone-300">
            {formatDate(image.createdAt, locale)}
          </dd>
        </dl>
      </section>

      {/* Live Photo */}
      {image.isLivePhoto && image.livePhotoVideoPath && (
        <section className="space-y-3">
          <h2 className="text-xs font-medium tracking-wider text-stone-500 uppercase">Live Photo</h2>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            {locale === "zh"
              ? "此照片包含动态视频内容，鼠标悬停在图片上可播放。"
              : "This photo contains live video content, hover to play."}
          </p>
          <a
            href={image.livePhotoVideoPath}
            download="live-photo-video.mov"
            className="inline-flex items-center gap-2 rounded border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:border-stone-300 hover:text-stone-900 dark:border-stone-700 dark:text-stone-300 dark:hover:border-stone-500 dark:hover:text-stone-100"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            {locale === "zh" ? "下载视频" : "Download Video"}
          </a>
        </section>
      )}

      {/* Technical note */}
      <footer className="border-t border-stone-200 pt-4 text-xs text-stone-600 dark:border-stone-800">
        <p>
          <span className="text-stone-500 dark:text-stone-600">
            {locale === "zh" ? "元数据由 EXIF 自动提取" : "Metadata extracted from EXIF"}
          </span>
          {hasLocation && (
            <span className="text-stone-500 dark:text-stone-600">
              {locale === "zh"
                ? "，地理位置通过 OpenStreetMap 逆地理编码服务获取"
                : ", location via OpenStreetMap reverse geocoding"}
            </span>
          )}
          。
          <span className="text-stone-500 dark:text-stone-600">
            {locale === "zh"
              ? `存储方式：${image.storageType}。`
              : `Storage: ${image.storageType}.`}
          </span>
        </p>
      </footer>
    </div>
  );
}

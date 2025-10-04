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
};

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return "未知";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "未知";
  const date = new Date(dateString);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PhotoMetadataPanel({ image }: PhotoMetadataPanelProps) {
  const hasLocation = image.latitude && image.longitude;
  const fileName = image.filePath.split("/").pop() || "未知";

  return (
    <div className="space-y-6 p-6">
      {/* Title and description */}
      <div className="space-y-2">
        <h1 className="text-2xl leading-tight font-semibold text-zinc-100">
          {image.title || "未命名照片"}
        </h1>
        {image.description && (
          <p className="text-sm leading-relaxed text-zinc-300">{image.description}</p>
        )}
      </div>

      {/* Location map */}
      {hasLocation && (
        <section className="space-y-3">
          <h2 className="text-xs font-medium tracking-wider text-zinc-500 uppercase">位置信息</h2>
          <div className="overflow-hidden rounded-lg border border-zinc-800">
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
              <p className="text-zinc-300">
                {image.city}, {image.country}
              </p>
            )}
            {image.locationName && <p className="text-xs text-zinc-500">{image.locationName}</p>}
            <p className="font-mono text-xs text-zinc-600">
              {image.latitude?.toFixed(6)}, {image.longitude?.toFixed(6)}
            </p>
          </div>
        </section>
      )}

      {/* File information */}
      <section className="space-y-3">
        <h2 className="text-xs font-medium tracking-wider text-zinc-500 uppercase">文件信息</h2>
        <dl className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-zinc-500">文件名</dt>
          <dd
            className="line-clamp-2 font-mono text-xs break-all text-zinc-300 md:line-clamp-3"
            title={fileName}
          >
            {fileName}
          </dd>

          <dt className="text-zinc-500">文件大小</dt>
          <dd className="text-zinc-300">{formatFileSize(image.fileSize)}</dd>

          {image.width && image.height && (
            <>
              <dt className="text-zinc-500">分辨率</dt>
              <dd className="text-zinc-300">
                {image.width} × {image.height}
              </dd>
            </>
          )}

          {image.mimeType && (
            <>
              <dt className="text-zinc-500">格式</dt>
              <dd className="font-mono text-xs text-zinc-300 uppercase">
                {image.mimeType.split("/")[1]}
              </dd>
            </>
          )}
        </dl>
      </section>

      {/* Temporal information */}
      <section className="space-y-3">
        <h2 className="text-xs font-medium tracking-wider text-zinc-500 uppercase">时间信息</h2>
        <dl className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-2 text-sm">
          {image.capturedAt && (
            <>
              <dt className="text-zinc-500">拍摄时间</dt>
              <dd className="text-zinc-300">{formatDate(image.capturedAt)}</dd>
            </>
          )}
          <dt className="text-zinc-500">上传时间</dt>
          <dd className="text-zinc-300">{formatDate(image.createdAt)}</dd>
        </dl>
      </section>

      {/* Live Photo */}
      {image.isLivePhoto && image.livePhotoVideoPath && (
        <section className="space-y-3">
          <h2 className="text-xs font-medium tracking-wider text-zinc-500 uppercase">Live Photo</h2>
          <p className="text-sm text-zinc-400">此照片包含动态视频内容，鼠标悬停在图片上可播放。</p>
          <a
            href={image.livePhotoVideoPath}
            download="live-photo-video.mov"
            className="inline-flex items-center gap-2 rounded border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            下载视频
          </a>
        </section>
      )}

      {/* Technical note */}
      <footer className="border-t border-zinc-800 pt-4 text-xs text-zinc-600">
        <p>
          元数据由 EXIF 自动提取
          {hasLocation && "，地理位置通过 OpenStreetMap 逆地理编码服务获取"}。存储方式：
          {image.storageType}。
        </p>
      </footer>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  X,
  Camera,
  MapPin,
  Play,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  FileText,
  Clock,
  HardDrive,
} from "lucide-react";
import { getLocaleFromPathname } from "@/lib/i18n";
import L from "leaflet";

// Dynamic import for map components (avoid SSR issues)
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), {
  ssr: false,
});
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), {
  ssr: false,
});
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });

// Thumbnail dimensions
const THUMB_FULL_WIDTH = 120;
const THUMB_COLLAPSED_WIDTH = 35;
const THUMB_GAP = 2;
const THUMB_MARGIN = 2;

// Original image loading state
type OriginalLoadState = {
  status: "idle" | "loading" | "success" | "error";
  loadedBytes: number;
  totalBytes: number | null;
};

export interface LuminaGalleryItem {
  id: string;
  type: "image" | "video";
  url: string;
  thumbnail?: string;
  title: string;
  description?: string;
  date: string;
  location?: string;
  exif?: {
    camera?: string;
    lens?: string;
    aperture?: string;
    iso?: string;
    shutter?: string;
  };
  width?: number;
  height?: number;
  // Extended fields for enhanced lightbox
  mediumPath?: string;
  smallThumbPath?: string;
  microThumbPath?: string;
  fileSize?: number;
  mimeType?: string;
  capturedAt?: string;
  createdAt?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
  locationName?: string;
  isLivePhoto?: boolean;
  livePhotoVideoPath?: string;
  storageType?: string;
}

interface LuminaGalleryProps {
  items: LuminaGalleryItem[];
}

// Helper functions
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

function formatBytes(bytes: number): string {
  if (!bytes) return "0.00 MB";
  const mb = bytes / (1024 * 1024);
  if (mb >= 100) return `${mb.toFixed(0)} MB`;
  if (mb >= 10) return `${mb.toFixed(1)} MB`;
  return `${mb.toFixed(2)} MB`;
}

function formatProgress(loaded: number, total: number | null): string {
  if (!total || total <= 0) return "";
  const pct = Math.min(100, Math.round((loaded / total) * 100));
  return ` ${pct}%`;
}

export function LuminaGallery({ items }: LuminaGalleryProps) {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname) ?? "en";
  const [selectedItem, setSelectedItem] = useState<LuminaGalleryItem | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Original image loading state
  const [displaySrc, setDisplaySrc] = useState<string>("");
  const [originalState, setOriginalState] = useState<OriginalLoadState>({
    status: "idle",
    loadedBytes: 0,
    totalBytes: null,
  });
  const [showProgress, setShowProgress] = useState(true);
  const progressHideTimerRef = useRef<number | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  // Mobile drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Slide animation state
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(null);

  // Thumbnails ref for scrolling
  const thumbnailsRef = useRef<HTMLDivElement>(null);

  // Image container ref for wheel zoom
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      en: {
        Gallery: "Gallery",
        Type: "Type",
        Video: "Video",
        Location: "Location",
        Camera: "Camera",
        Lens: "Lens",
        Aperture: "Aperture",
        ISO: "ISO",
        Shutter: "Shutter",
        FileInfo: "File Info",
        TimeInfo: "Time",
        Filename: "Filename",
        Size: "Size",
        Resolution: "Resolution",
        Format: "Format",
        Captured: "Captured",
        Uploaded: "Uploaded",
        Loading: "Loading image",
        LivePhoto: "Live Photo",
        LivePhotoHint: "This photo contains live video content.",
      },
      zh: {
        Gallery: "相册",
        Type: "类型",
        Video: "视频",
        Location: "位置",
        Camera: "相机",
        Lens: "镜头",
        Aperture: "光圈",
        ISO: "感光度",
        Shutter: "快门",
        FileInfo: "文件信息",
        TimeInfo: "时间信息",
        Filename: "文件名",
        Size: "文件大小",
        Resolution: "分辨率",
        Format: "格式",
        Captured: "拍摄时间",
        Uploaded: "上传时间",
        Loading: "正在加载图片",
        LivePhoto: "实况照片",
        LivePhotoHint: "此照片包含动态视频内容。",
      },
    };
    return translations[locale]?.[key] || key;
  };

  const handleOpen = useCallback((item: LuminaGalleryItem) => {
    const idx = items.findIndex((i) => i.id === item.id);
    setSelectedItem(item);
    setCurrentIndex(idx >= 0 ? idx : 0);
    setZoomLevel(1);
    setDrawerOpen(false);
    setSlideDirection(null);
    if (typeof document !== "undefined") {
      document.body.style.overflow = "hidden";
    }
  }, [items]);

  const handleClose = useCallback(() => {
    setSelectedItem(null);
    setDrawerOpen(false);
    // Cleanup XHR
    xhrRef.current?.abort();
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (typeof document !== "undefined") {
      document.body.style.overflow = "unset";
    }
  }, []);

  const navigateTo = useCallback((targetIndex: number, direction: "left" | "right") => {
    const targetItem = items[targetIndex];
    if (!targetItem) return;
    setSlideDirection(direction);
    setSelectedItem(targetItem);
    setCurrentIndex(targetIndex);
    setZoomLevel(1);
    // Reset slide direction after animation
    setTimeout(() => setSlideDirection(null), 300);
  }, [items]);

  const handleNext = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!selectedItem) return;
    const nextIdx = (currentIndex + 1) % items.length;
    navigateTo(nextIdx, "left");
  }, [selectedItem, currentIndex, items.length, navigateTo]);

  const handlePrev = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!selectedItem) return;
    const prevIdx = (currentIndex - 1 + items.length) % items.length;
    navigateTo(prevIdx, "right");
  }, [selectedItem, currentIndex, items.length, navigateTo]);

  const handleThumbnailClick = useCallback((targetIndex: number) => {
    if (targetIndex === currentIndex) return;
    const direction = targetIndex > currentIndex ? "left" : "right";
    navigateTo(targetIndex, direction);
  }, [currentIndex, navigateTo]);

  // Scroll thumbnails to current index
  useEffect(() => {
    if (thumbnailsRef.current && selectedItem) {
      let scrollPosition = 0;
      for (let i = 0; i < currentIndex; i++) {
        scrollPosition += THUMB_COLLAPSED_WIDTH + THUMB_GAP;
      }
      scrollPosition += THUMB_MARGIN;
      const containerWidth = thumbnailsRef.current.offsetWidth;
      const centerOffset = containerWidth / 2 - THUMB_FULL_WIDTH / 2;
      scrollPosition -= centerOffset;
      thumbnailsRef.current.scrollTo({
        left: scrollPosition,
        behavior: "smooth",
      });
    }
  }, [currentIndex, selectedItem]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedItem) return;
      if (e.key === "Escape") handleClose();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedItem, handleClose, handleNext, handlePrev]);

  // Load original image with progress
  useEffect(() => {
    if (!selectedItem) return;

    // Abort previous request
    xhrRef.current?.abort();
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    // Start with medium or thumbnail
    const initialSrc = selectedItem.mediumPath || selectedItem.thumbnail || selectedItem.url;
    setDisplaySrc(initialSrc);

    // If we have medium path, load original in background
    if (selectedItem.mediumPath && selectedItem.mediumPath !== selectedItem.url) {
      if (typeof window === "undefined" || typeof window.XMLHttpRequest === "undefined") {
        setOriginalState({ status: "idle", loadedBytes: 0, totalBytes: null });
        return;
      }

      const xhr = new window.XMLHttpRequest();
      xhrRef.current = xhr;
      setOriginalState({ status: "loading", loadedBytes: 0, totalBytes: null });
      setShowProgress(true);

      xhr.open("GET", selectedItem.url, true);
      xhr.responseType = "blob";

      xhr.onprogress = (event) => {
        setOriginalState((prev) => ({
          status: "loading",
          loadedBytes: event.loaded,
          totalBytes: event.lengthComputable ? event.total : prev.totalBytes,
        }));
      };

      xhr.onerror = () => {
        setOriginalState({ status: "error", loadedBytes: 0, totalBytes: null });
        setDisplaySrc(selectedItem.url);
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300 && xhr.response instanceof Blob) {
          const blob = xhr.response;
          const url = URL.createObjectURL(blob);
          objectUrlRef.current = url;
          setDisplaySrc(url);
          setOriginalState({ status: "success", loadedBytes: blob.size, totalBytes: blob.size });
        } else {
          setOriginalState({ status: "error", loadedBytes: 0, totalBytes: null });
          setDisplaySrc(selectedItem.url);
        }
      };

      xhr.send();

      return () => {
        xhr.abort();
      };
    } else {
      setOriginalState({ status: "success", loadedBytes: 0, totalBytes: null });
      return undefined;
    }
  }, [selectedItem?.id, selectedItem?.url, selectedItem?.mediumPath, selectedItem?.thumbnail]);

  // Auto-hide progress indicator
  useEffect(() => {
    if (progressHideTimerRef.current) {
      window.clearTimeout(progressHideTimerRef.current);
      progressHideTimerRef.current = null;
    }
    if (originalState.status === "loading") {
      setShowProgress(true);
    }
    if (originalState.status === "success" && originalState.loadedBytes > 0) {
      progressHideTimerRef.current = window.setTimeout(() => {
        setShowProgress(false);
      }, 2000);
    }
    return () => {
      if (progressHideTimerRef.current) {
        window.clearTimeout(progressHideTimerRef.current);
      }
    };
  }, [originalState]);

  // Wheel zoom (center-based)
  useEffect(() => {
    const el = imageContainerRef.current;
    if (!el || !selectedItem) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY;
      const factor = delta > 0 ? 1.1 : 0.9;
      setZoomLevel((prev) => Math.max(1, Math.min(4, prev * factor)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [selectedItem]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      xhrRef.current?.abort();
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  // Fix Leaflet default marker icon issue
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  return (
    <div className="w-full">
      {/* Masonry Grid */}
      <div className="columns-1 gap-6 space-y-6 sm:columns-2 lg:columns-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="group relative cursor-pointer overflow-hidden rounded-lg bg-stone-200 break-inside-avoid dark:bg-stone-800"
            onClick={() => handleOpen(item)}
          >
            <div className="relative">
              <img
                src={item.type === "video" ? item.thumbnail || item.url : item.url}
                alt={item.title}
                className="h-auto w-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              {/* Video Indicator */}
              {item.type === "video" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/10">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white backdrop-blur-md">
                    <Play size={20} fill="currentColor" />
                  </div>
                </div>
              )}
              {/* Hover Overlay */}
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 via-transparent to-transparent p-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <h3 className="font-serif text-lg font-medium text-white">{item.title}</h3>
                <span className="text-xs text-stone-300">{item.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-[70] flex flex-col bg-black/95">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-[80] p-2 text-white/50 transition-colors hover:text-white"
          >
            <X size={32} />
          </button>

          {/* Navigation Arrows - Fixed position at modal level */}
          <button
            onClick={handlePrev}
            className="fixed left-4 top-1/2 z-[80] hidden -translate-y-1/2 p-4 text-white/30 transition-colors hover:text-white lg:block"
          >
            <ChevronLeft size={48} />
          </button>
          <button
            onClick={handleNext}
            className="fixed top-1/2 z-[80] hidden -translate-y-1/2 p-4 text-white/30 transition-colors hover:text-white lg:block lg:right-[calc(380px+1rem)] xl:right-[calc(420px+1rem)]"
          >
            <ChevronRight size={48} />
          </button>

          {/* Main Layout */}
          <div className="flex h-full flex-col lg:flex-row">
            {/* Main Content Area (Image/Video) */}
            <div
              ref={imageContainerRef}
              className="relative flex flex-1 items-center justify-center overflow-hidden bg-black pb-24 lg:pb-28"
              onClick={handleClose}
            >
              {/* Image with slide animation */}
              <motion.div
                key={selectedItem.id}
                initial={{ opacity: 0, x: slideDirection === "left" ? 100 : slideDirection === "right" ? -100 : 0 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {/* Zoom container - separate from motion to avoid transform conflict */}
                <div
                  className="relative transition-transform duration-300 ease-out"
                  style={{ transform: `scale(${zoomLevel})` }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {selectedItem.type === "video" ? (
                    <video
                      src={selectedItem.url}
                      controls
                      autoPlay
                      loop
                      className="max-h-[60vh] max-w-[90vw] shadow-2xl lg:max-h-[70vh] lg:max-w-[55vw]"
                    />
                  ) : (
                    <img
                      src={displaySrc || selectedItem.mediumPath || selectedItem.thumbnail || selectedItem.url}
                      alt={selectedItem.title}
                      className="max-h-[60vh] max-w-[90vw] select-none object-contain shadow-2xl lg:max-h-[70vh] lg:max-w-[55vw]"
                    />
                  )}
                </div>
              </motion.div>

              {/* Zoom Level Indicator - only show when zoomed */}
              {zoomLevel > 1 && (
                <div className="pointer-events-none absolute bottom-32 left-6 z-[75] rounded bg-black/60 px-2 py-1 text-xs font-medium text-white/80 backdrop-blur lg:bottom-36">
                  {Math.round(zoomLevel * 100)}%
                </div>
              )}

              {/* Loading Progress Indicator */}
              {originalState.status === "loading" && showProgress && (
                <div className="pointer-events-none absolute right-6 bottom-32 z-[75] flex items-center gap-3 rounded-xl bg-black/75 px-4 py-2 text-xs text-white shadow-lg backdrop-blur lg:bottom-36 lg:right-[calc(380px+2rem)] xl:right-[calc(420px+2rem)]">
                  <svg
                    className="h-4 w-4 animate-spin text-white/80"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-20"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                    <path
                      className="opacity-90"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"
                    />
                  </svg>
                  <div>
                    <div className="font-medium">
                      {t("Loading")}{formatProgress(originalState.loadedBytes, originalState.totalBytes)}
                    </div>
                    <div className="text-[11px] text-white/70">
                      {formatBytes(originalState.loadedBytes)}
                      {typeof originalState.totalBytes === "number"
                        ? ` / ${formatBytes(originalState.totalBytes)}`
                        : ""}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Sidebar Details Panel */}
            <aside className="hidden w-full flex-col overflow-y-auto border-l border-stone-800 bg-stone-900 lg:flex lg:max-w-[480px] lg:flex-none lg:basis-[380px] xl:basis-[420px]">
              <div className="flex-1 overflow-y-auto p-6">
                {/* Title and Description */}
                <div className="mb-6">
                  <h2 className="mb-2 font-serif text-2xl text-white">{selectedItem.title}</h2>
                  {selectedItem.description && (
                    <p className="text-sm leading-relaxed text-stone-400">
                      {selectedItem.description}
                    </p>
                  )}
                </div>

                {/* Location Map */}
                {selectedItem.latitude && selectedItem.longitude && (
                  <section className="mb-6">
                    <h3 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-stone-500">
                      <MapPin size={14} /> {t("Location")}
                    </h3>
                    <div className="overflow-hidden rounded-lg border border-stone-800">
                      <div className="h-[180px] w-full">
                        <MapContainer
                          center={[selectedItem.latitude, selectedItem.longitude]}
                          zoom={13}
                          style={{ height: "100%", width: "100%" }}
                          zoomControl={false}
                          attributionControl={false}
                        >
                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                          <Marker position={[selectedItem.latitude, selectedItem.longitude]} />
                        </MapContainer>
                      </div>
                    </div>
                    <div className="mt-2 space-y-1 text-sm">
                      {selectedItem.city && selectedItem.country && (
                        <p className="text-stone-300">{selectedItem.city}, {selectedItem.country}</p>
                      )}
                      {selectedItem.locationName && (
                        <p className="text-xs text-stone-500">{selectedItem.locationName}</p>
                      )}
                      <p className="font-mono text-xs text-stone-600">
                        {selectedItem.latitude.toFixed(6)}, {selectedItem.longitude.toFixed(6)}
                      </p>
                    </div>
                  </section>
                )}

                {/* File Info */}
                <section className="mb-6">
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-stone-500">
                    <FileText size={14} /> {t("FileInfo")}
                  </h3>
                  <dl className="grid grid-cols-[100px_1fr] gap-x-3 gap-y-2 text-sm">
                    {selectedItem.width && selectedItem.height && (
                      <>
                        <dt className="text-stone-500">{t("Resolution")}</dt>
                        <dd className="text-stone-300">{selectedItem.width} × {selectedItem.height}</dd>
                      </>
                    )}
                    {selectedItem.fileSize && (
                      <>
                        <dt className="text-stone-500">{t("Size")}</dt>
                        <dd className="text-stone-300">{formatFileSize(selectedItem.fileSize)}</dd>
                      </>
                    )}
                    {selectedItem.mimeType && (
                      <>
                        <dt className="text-stone-500">{t("Format")}</dt>
                        <dd className="font-mono text-xs uppercase text-stone-300">
                          {selectedItem.mimeType.split("/")[1]}
                        </dd>
                      </>
                    )}
                  </dl>
                </section>

                {/* Time Info */}
                <section className="mb-6">
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-stone-500">
                    <Clock size={14} /> {t("TimeInfo")}
                  </h3>
                  <dl className="grid grid-cols-[100px_1fr] gap-x-3 gap-y-2 text-sm">
                    {selectedItem.capturedAt && (
                      <>
                        <dt className="text-stone-500">{t("Captured")}</dt>
                        <dd className="text-stone-300">{formatDate(selectedItem.capturedAt, locale)}</dd>
                      </>
                    )}
                    {selectedItem.createdAt && (
                      <>
                        <dt className="text-stone-500">{t("Uploaded")}</dt>
                        <dd className="text-stone-300">{formatDate(selectedItem.createdAt, locale)}</dd>
                      </>
                    )}
                  </dl>
                </section>

                {/* EXIF Data */}
                {selectedItem.exif && (
                  <section className="mb-6">
                    <h3 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-stone-500">
                      <Camera size={14} /> EXIF
                    </h3>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
                      {selectedItem.exif.camera && (
                        <div>
                          <span className="block text-[10px] uppercase text-stone-600">{t("Camera")}</span>
                          <span className="text-stone-300">{selectedItem.exif.camera}</span>
                        </div>
                      )}
                      {selectedItem.exif.lens && (
                        <div>
                          <span className="block text-[10px] uppercase text-stone-600">{t("Lens")}</span>
                          <span className="text-stone-300">{selectedItem.exif.lens}</span>
                        </div>
                      )}
                      {selectedItem.exif.aperture && (
                        <div>
                          <span className="block text-[10px] uppercase text-stone-600">{t("Aperture")}</span>
                          <span className="text-stone-300">{selectedItem.exif.aperture}</span>
                        </div>
                      )}
                      {selectedItem.exif.iso && (
                        <div>
                          <span className="block text-[10px] uppercase text-stone-600">{t("ISO")}</span>
                          <span className="text-stone-300">{selectedItem.exif.iso}</span>
                        </div>
                      )}
                      {selectedItem.exif.shutter && (
                        <div>
                          <span className="block text-[10px] uppercase text-stone-600">{t("Shutter")}</span>
                          <span className="text-stone-300">{selectedItem.exif.shutter}</span>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* Live Photo */}
                {selectedItem.isLivePhoto && selectedItem.livePhotoVideoPath && (
                  <section className="mb-6">
                    <h3 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-stone-500">
                      <Play size={14} /> {t("LivePhoto")}
                    </h3>
                    <p className="mb-3 text-sm text-stone-400">{t("LivePhotoHint")}</p>
                    <a
                      href={selectedItem.livePhotoVideoPath}
                      download="live-photo-video.mov"
                      className="inline-flex items-center gap-2 rounded border border-stone-700 px-3 py-1.5 text-xs font-medium text-stone-300 transition-colors hover:border-stone-500 hover:text-white"
                    >
                      <HardDrive size={14} />
                      {locale === "zh" ? "下载视频" : "Download Video"}
                    </a>
                  </section>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-stone-800 px-6 py-4 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>{selectedItem.date}</span>
                  <span>{currentIndex + 1} / {items.length}</span>
                </div>
              </div>
            </aside>

            {/* Mobile Bottom Drawer */}
            <div
              className={`fixed inset-x-0 bottom-0 z-[75] transform transition-transform duration-300 ease-out lg:hidden ${
                drawerOpen ? "translate-y-0" : "translate-y-[calc(100%-120px)]"
              }`}
            >
              {/* Drawer Handle */}
              <button
                onClick={() => setDrawerOpen(!drawerOpen)}
                className="mx-auto flex w-full items-center justify-center border-t border-stone-800 bg-stone-900 py-2"
              >
                <ChevronUp
                  size={20}
                  className={`text-stone-500 transition-transform duration-300 ${drawerOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Drawer Content */}
              <div className="max-h-[70vh] overflow-y-auto bg-stone-900 px-4 pb-4">
                {/* Title Preview (always visible) */}
                <div className="mb-4">
                  <h2 className="font-serif text-xl text-white">{selectedItem.title}</h2>
                  <p className="text-xs text-stone-500">{selectedItem.date}</p>
                </div>

                {drawerOpen && (
                  <>
                    {selectedItem.description && (
                      <p className="mb-4 text-sm leading-relaxed text-stone-400">
                        {selectedItem.description}
                      </p>
                    )}

                    {/* Location Map (Mobile) */}
                    {selectedItem.latitude && selectedItem.longitude && (
                      <section className="mb-4">
                        <div className="overflow-hidden rounded-lg border border-stone-800">
                          <div className="h-[150px] w-full">
                            <MapContainer
                              center={[selectedItem.latitude, selectedItem.longitude]}
                              zoom={12}
                              style={{ height: "100%", width: "100%" }}
                              zoomControl={false}
                              attributionControl={false}
                            >
                              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                              <Marker position={[selectedItem.latitude, selectedItem.longitude]} />
                            </MapContainer>
                          </div>
                        </div>
                        {(selectedItem.city || selectedItem.locationName) && (
                          <p className="mt-2 text-sm text-stone-400">
                            {selectedItem.city && selectedItem.country
                              ? `${selectedItem.city}, ${selectedItem.country}`
                              : selectedItem.locationName}
                          </p>
                        )}
                      </section>
                    )}

                    {/* Quick Info Grid (Mobile) */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {selectedItem.width && selectedItem.height && (
                        <div className="rounded bg-stone-800/50 p-2">
                          <span className="block text-[10px] uppercase text-stone-500">{t("Resolution")}</span>
                          <span className="text-stone-300">{selectedItem.width} × {selectedItem.height}</span>
                        </div>
                      )}
                      {selectedItem.fileSize && (
                        <div className="rounded bg-stone-800/50 p-2">
                          <span className="block text-[10px] uppercase text-stone-500">{t("Size")}</span>
                          <span className="text-stone-300">{formatFileSize(selectedItem.fileSize)}</span>
                        </div>
                      )}
                      {selectedItem.capturedAt && (
                        <div className="col-span-2 rounded bg-stone-800/50 p-2">
                          <span className="block text-[10px] uppercase text-stone-500">{t("Captured")}</span>
                          <span className="text-stone-300">{formatDate(selectedItem.capturedAt, locale)}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Thumbnail Strip */}
          <div className="fixed inset-x-0 bottom-0 z-[72] border-t border-stone-800 bg-stone-900/90 backdrop-blur lg:right-[380px] xl:right-[420px]">
            <div
              ref={thumbnailsRef}
              className="overflow-x-auto px-4 py-3"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <style>{`
                .overflow-x-auto::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              <div className="flex h-16 gap-0.5" style={{ width: "fit-content" }}>
                {items.map((item, i) => (
                  <motion.button
                    key={item.id}
                    onClick={() => handleThumbnailClick(i)}
                    initial={false}
                    animate={i === currentIndex ? "active" : "inactive"}
                    variants={{
                      active: {
                        width: THUMB_FULL_WIDTH,
                        marginLeft: THUMB_MARGIN,
                        marginRight: THUMB_MARGIN,
                      },
                      inactive: {
                        width: THUMB_COLLAPSED_WIDTH,
                        marginLeft: 0,
                        marginRight: 0,
                      },
                    }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className={`relative h-full shrink-0 overflow-hidden rounded ${
                      i === currentIndex ? "ring-2 ring-white" : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={item.smallThumbPath || item.microThumbPath || item.thumbnail || item.url}
                      alt={item.title}
                      className="pointer-events-none h-full w-full select-none object-cover"
                      draggable={false}
                      loading="lazy"
                    />
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LuminaGallery;

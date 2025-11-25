"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Maximize2,
  X,
  Camera,
  MapPin,
  Play,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getLocaleFromPathname } from "@/lib/i18n";

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
}

interface LuminaGalleryProps {
  items: LuminaGalleryItem[];
}

export function LuminaGallery({ items }: LuminaGalleryProps) {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname) ?? "en";
  const [selectedItem, setSelectedItem] = useState<LuminaGalleryItem | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

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
      },
    };
    return translations[locale]?.[key] || key;
  };

  const handleOpen = (item: LuminaGalleryItem) => {
    setSelectedItem(item);
    setZoomLevel(1);
    if (typeof document !== "undefined") {
      document.body.style.overflow = "hidden";
    }
  };

  const handleClose = () => {
    setSelectedItem(null);
    if (typeof document !== "undefined") {
      document.body.style.overflow = "unset";
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedItem) return;
    const idx = items.findIndex((i) => i.id === selectedItem.id);
    const nextIdx = (idx + 1) % items.length;
    setSelectedItem(items[nextIdx] ?? null);
    setZoomLevel(1);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedItem) return;
    const idx = items.findIndex((i) => i.id === selectedItem.id);
    const prevIdx = (idx - 1 + items.length) % items.length;
    setSelectedItem(items[prevIdx] ?? null);
    setZoomLevel(1);
  };

  const toggleZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel((prev) => (prev === 1 ? 2 : 1));
  };

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedItem) return;
      if (e.key === "Escape") handleClose();
      if (e.key === "ArrowRight") {
        const idx = items.findIndex((i) => i.id === selectedItem.id);
        const nextIdx = (idx + 1) % items.length;
        setSelectedItem(items[nextIdx] ?? null);
        setZoomLevel(1);
      }
      if (e.key === "ArrowLeft") {
        const idx = items.findIndex((i) => i.id === selectedItem.id);
        const prevIdx = (idx - 1 + items.length) % items.length;
        setSelectedItem(items[prevIdx] ?? null);
        setZoomLevel(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedItem, items]);

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
        <div className="fixed inset-0 z-[70] flex flex-col bg-black/95 md:flex-row">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-20 p-2 text-white/50 transition-colors hover:text-white"
          >
            <X size={32} />
          </button>

          {/* Main Content Area (Image/Video) */}
          <div
            className="relative flex flex-1 cursor-grab items-center justify-center overflow-hidden bg-black active:cursor-grabbing"
            onClick={handleClose}
          >
            {/* Navigation Arrows */}
            <button
              onClick={handlePrev}
              className="absolute left-4 z-10 hidden p-4 text-white/30 transition-colors hover:text-white md:block"
            >
              <ChevronLeft size={48} />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 z-10 hidden p-4 text-white/30 transition-colors hover:text-white md:block"
            >
              <ChevronRight size={48} />
            </button>

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
                  className="max-h-[85vh] max-w-full shadow-2xl"
                />
              ) : (
                <img
                  src={selectedItem.url}
                  alt={selectedItem.title}
                  className="max-h-[90vh] max-w-full select-none object-contain shadow-2xl"
                />
              )}
            </div>

            {/* Zoom Controls (Image Only) */}
            {selectedItem.type === "image" && (
              <div
                className="absolute bottom-8 left-1/2 flex -translate-x-1/2 gap-4 rounded-full border border-white/10 bg-black/50 px-4 py-2 backdrop-blur-md"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={toggleZoom}
                  className="text-white transition-colors hover:text-sage-300"
                >
                  {zoomLevel === 1 ? <ZoomIn size={20} /> : <ZoomOut size={20} />}
                </button>
              </div>
            )}
          </div>

          {/* Sidebar Details Panel */}
          <div className="relative z-10 flex h-[40vh] w-full flex-col overflow-y-auto border-l border-stone-800 bg-stone-900 p-8 md:h-full md:w-96">
            <div className="mb-auto">
              <h2 className="mb-2 font-serif text-3xl text-white">{selectedItem.title}</h2>
              {selectedItem.description && (
                <p className="mb-6 font-light leading-relaxed text-stone-400">
                  {selectedItem.description}
                </p>
              )}

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-stone-300">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-800 text-stone-500">
                    <Maximize2 size={14} />
                  </div>
                  <div className="text-sm">
                    <span className="block text-[10px] uppercase tracking-widest text-stone-500">
                      {t("Type")}
                    </span>
                    {selectedItem.type === "video" ? t("Video") : "Photography"}
                  </div>
                </div>

                {selectedItem.location && (
                  <div className="flex items-center gap-3 text-stone-300">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-800 text-stone-500">
                      <MapPin size={14} />
                    </div>
                    <div className="text-sm">
                      <span className="block text-[10px] uppercase tracking-widest text-stone-500">
                        {t("Location")}
                      </span>
                      {selectedItem.location}
                    </div>
                  </div>
                )}

                {selectedItem.exif && (
                  <div className="mt-8 border-t border-stone-800 pt-6">
                    <h4 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-500">
                      <Camera size={14} /> EXIF Data
                    </h4>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-4 text-sm">
                      {selectedItem.exif.camera && (
                        <div>
                          <span className="block text-[10px] text-stone-600">{t("Camera")}</span>
                          <span className="text-stone-300">{selectedItem.exif.camera}</span>
                        </div>
                      )}
                      {selectedItem.exif.lens && (
                        <div>
                          <span className="block text-[10px] text-stone-600">{t("Lens")}</span>
                          <span className="text-stone-300">{selectedItem.exif.lens}</span>
                        </div>
                      )}
                      {selectedItem.exif.aperture && (
                        <div>
                          <span className="block text-[10px] text-stone-600">{t("Aperture")}</span>
                          <span className="text-stone-300">{selectedItem.exif.aperture}</span>
                        </div>
                      )}
                      {selectedItem.exif.iso && (
                        <div>
                          <span className="block text-[10px] text-stone-600">{t("ISO")}</span>
                          <span className="text-stone-300">{selectedItem.exif.iso}</span>
                        </div>
                      )}
                      {selectedItem.exif.shutter && (
                        <div>
                          <span className="block text-[10px] text-stone-600">{t("Shutter")}</span>
                          <span className="text-stone-300">{selectedItem.exif.shutter}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-between border-t border-stone-800 pt-6 text-xs text-stone-600">
              <span>{selectedItem.date}</span>
              <span>ID: {selectedItem.id}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LuminaGallery;

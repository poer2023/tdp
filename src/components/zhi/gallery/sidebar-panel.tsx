"use client";

import React from "react";
import { HardDrive, ChevronRight } from "lucide-react";
import type { ZhiGalleryItem } from "./types";
import { formatFileSize, formatDate, formatRelativeTime } from "./utils";
import { getGalleryTranslation, type GalleryTranslations } from "./translations";
import { LocationMap } from "./location-map";

interface SidebarPanelProps {
    item: ZhiGalleryItem;
    currentIndex: number;
    totalItems: number;
    isDark: boolean;
    locale: string;
    onCollapse?: () => void;
}

/**
 * Desktop sidebar panel for gallery lightbox
 * Displays photo metadata, location, EXIF, and other details
 */
export const SidebarPanel = React.memo(function SidebarPanel({
    item,
    currentIndex,
    totalItems,
    isDark,
    locale,
    onCollapse,
}: SidebarPanelProps) {
    const t = (key: string) => getGalleryTranslation(locale, key as keyof GalleryTranslations);

    return (
        <aside className={`relative hidden h-full w-full flex-col overflow-y-auto border-l lg:flex lg:max-w-[400px] lg:flex-none lg:basis-[360px] xl:basis-[400px] ${isDark ? 'border-[#27272a] bg-[#09090b]' : 'border-stone-200 bg-[#fafaf9]'}`}>
            {/* Noise Texture */}
            <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.15]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacit='1'/%3E%3C/svg%3E")` }} />

            <div className="relative z-10 flex-1 overflow-y-auto p-6">
                {/* Header with Title and Collapse Button */}
                <div className="mb-8 flex items-start justify-between gap-3">
                    <div className="flex-1">
                        <h2 className={`mb-3 font-serif text-2xl font-medium leading-tight ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>{item.title}</h2>
                        {item.description && (
                            <div className={`relative pl-4 text-sm leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                                <span className={`absolute left-0 top-0 h-full w-[2px] rounded-full ${isDark ? 'bg-stone-800' : 'bg-stone-300'}`} />
                                {item.description}
                            </div>
                        )}
                    </div>
                    {/* Collapse Button */}
                    {onCollapse && (
                        <button
                            onClick={onCollapse}
                            className={`flex-shrink-0 rounded-full p-2 transition-all duration-200 ${isDark ? 'text-stone-500 hover:text-white hover:bg-white/10' : 'text-stone-400 hover:text-stone-900 hover:bg-black/5'}`}
                            title={locale === "zh" ? "收起详情" : "Hide details"}
                        >
                            <ChevronRight size={20} />
                        </button>
                    )}
                </div>

                {/* Location Map */}
                {item.latitude && item.longitude && (
                    <section className="mb-8">
                        <h3 className={`mb-3 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                            {t("Location")}
                        </h3>

                        <div className="Zhi-map aspect-square w-full overflow-hidden rounded-xl grayscale-[0.2] transition-all duration-500 hover:grayscale-0">
                            <LocationMap
                                lat={item.latitude}
                                lng={item.longitude}
                                _isDark={isDark}
                                height="100%"
                                showZoomControl={true}
                            />
                        </div>

                        <div className="space-y-1">
                            {item.city && item.country && (
                                <p className={`text-sm font-medium ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
                                    {item.city}, {item.country}
                                </p>
                            )}
                            {(item.locationName || (!item.city && !item.country)) && (
                                <p className={`text-xs ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>
                                    {item.locationName || "Unknown Location"}
                                </p>
                            )}
                            <p className={`font-mono text-[10px] ${isDark ? 'text-stone-600' : 'text-stone-400'}`}>
                                {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
                            </p>
                        </div>
                    </section>
                )}

                {/* File Info */}
                <section className="mb-8">
                    <h3 className={`mb-3 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                        {t("FileInfo")}
                    </h3>
                    <div className="pl-1">
                        <dl className="grid grid-cols-[90px_1fr] gap-x-3 gap-y-3 text-sm">
                            {item.width && item.height && (
                                <>
                                    <dt className={isDark ? 'text-stone-500' : 'text-stone-500'}>{t("Resolution")}</dt>
                                    <dd className={`font-mono text-xs font-medium ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>{item.width} × {item.height}</dd>
                                </>
                            )}
                            {item.fileSize && (
                                <>
                                    <dt className={isDark ? 'text-stone-500' : 'text-stone-500'}>{t("Size")}</dt>
                                    <dd className={`font-mono text-xs font-medium ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>{formatFileSize(item.fileSize)}</dd>
                                </>
                            )}
                            {item.mimeType && (
                                <>
                                    <dt className={isDark ? 'text-stone-500' : 'text-stone-500'}>{t("Format")}</dt>
                                    <dd className={`font-mono text-xs font-medium uppercase ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                                        {item.mimeType.split("/")[1]}
                                    </dd>
                                </>
                            )}
                        </dl>
                    </div>
                </section>

                {/* Time Info */}
                <section className="mb-8">
                    <h3 className={`mb-3 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                        {t("TimeInfo")}
                    </h3>
                    <div className="pl-1">
                        <dl className="space-y-4 text-sm">
                            {item.capturedAt && (
                                <div className="relative border-l-2 border-stone-200 pl-3 dark:border-stone-800">
                                    <dt className={`text-xs ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>{t("Captured")}</dt>
                                    <dd className={`mt-0.5 ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                                        <span className="block font-medium">{formatDate(item.capturedAt, locale)}</span>
                                        <span className={`text-xs ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                                            {formatRelativeTime(item.capturedAt, locale)}
                                        </span>
                                    </dd>
                                </div>
                            )}
                            {item.createdAt && (
                                <div className="relative border-l-2 border-stone-200 pl-3 dark:border-stone-800">
                                    <dt className={`text-xs ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>{t("Uploaded")}</dt>
                                    <dd className={`mt-0.5 ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
                                        <span className="block font-medium">{formatDate(item.createdAt, locale)}</span>
                                        <span className={`text-xs ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                                            {formatRelativeTime(item.createdAt, locale)}
                                        </span>
                                    </dd>
                                </div>
                            )}
                        </dl>
                    </div>
                </section>

                {/* EXIF Data */}
                {item.exif && (
                    <section className="mb-8">
                        <h3 className={`mb-3 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                            EXIF
                        </h3>
                        <div className="grid grid-cols-2 gap-px bg-stone-100 p-px dark:bg-[#27272a]">
                            {item.exif.camera && (
                                <div className={`col-span-2 p-3 ${isDark ? 'bg-[#09090b]' : 'bg-[#fafaf9]'}`}>
                                    <span className={`block text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>{t("Camera")}</span>
                                    <span className={`${isDark ? 'text-stone-200' : 'text-stone-800'}`}>{item.exif.camera}</span>
                                </div>
                            )}
                            {item.exif.lens && (
                                <div className={`col-span-2 p-3 ${isDark ? 'bg-[#09090b]' : 'bg-[#fafaf9]'}`}>
                                    <span className={`block text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>{t("Lens")}</span>
                                    <span className={`${isDark ? 'text-stone-200' : 'text-stone-800'}`}>{item.exif.lens}</span>
                                </div>
                            )}
                            {item.exif.aperture && (
                                <div className={`p-3 ${isDark ? 'bg-[#09090b]' : 'bg-[#fafaf9]'}`}>
                                    <span className={`block text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>{t("Aperture")}</span>
                                    <span className={`font-mono ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>{item.exif.aperture}</span>
                                </div>
                            )}
                            {item.exif.iso && (
                                <div className={`p-3 ${isDark ? 'bg-[#09090b]' : 'bg-[#fafaf9]'}`}>
                                    <span className={`block text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>{t("ISO")}</span>
                                    <span className={`font-mono ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>{item.exif.iso}</span>
                                </div>
                            )}
                            {item.exif.shutter && (
                                <div className={`p-3 ${isDark ? 'bg-[#09090b]' : 'bg-[#fafaf9]'}`}>
                                    <span className={`block text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>{t("Shutter")}</span>
                                    <span className={`font-mono ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>{item.exif.shutter}</span>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* Live Photo - 只对图片类型显示，视频类型不需要这个区域 */}
                {item.type !== "video" && item.isLivePhoto && item.livePhotoVideoPath && (
                    <section className="mb-8">
                        <h3 className={`mb-3 text-xs font-bold uppercase tracking-wider ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                            {t("LivePhoto")}
                        </h3>
                        <div className="pl-1">
                            <p className={`mb-4 text-xs ${isDark ? 'text-stone-500' : 'text-stone-500'}`}>{t("LivePhotoHint")}</p>
                            <a
                                href={item.livePhotoVideoPath}
                                download="live-photo-video.mov"
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-purple-700 hover:shadow-md active:scale-95"
                            >
                                <HardDrive size={16} />
                                {locale === "zh" ? "下载视频" : "Download Video"}
                            </a>
                        </div>
                    </section>
                )}
            </div>

            {/* Footer */}
            <div className={`relative z-10 mt-auto px-6 py-4 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
                <div className="flex items-center justify-between">
                    <span>{item.date}</span>
                    <span className="font-mono">{currentIndex + 1} / {totalItems}</span>
                </div>
            </div>
        </aside>
    );
});

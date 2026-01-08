"use client";

import { ChevronUp } from "lucide-react";
import type { ZhiGalleryItem } from "./types";
import { formatFileSize, formatDate } from "./utils";
import { getGalleryTranslation, type GalleryTranslations } from "./translations";
import { LocationMap } from "./location-map";

interface MobileDrawerProps {
    item: ZhiGalleryItem;
    isOpen: boolean;
    onToggle: () => void;
    isDark: boolean;
    locale: string;
}

/**
 * Mobile bottom drawer for gallery lightbox
 * Provides a compact view of photo metadata on mobile devices
 */
export function MobileDrawer({
    item,
    isOpen,
    onToggle,
    isDark,
    locale,
}: MobileDrawerProps) {
    const t = (key: string) => getGalleryTranslation(locale, key as keyof GalleryTranslations);

    return (
        <div
            className={`fixed inset-x-0 bottom-0 z-[75] transform transition-transform duration-300 ease-out lg:hidden backdrop-blur-xl rounded-t-2xl overflow-hidden ${isOpen ? "translate-y-0" : "translate-y-[calc(100%-120px)]"} ${isDark ? 'bg-black/70' : 'bg-white/80'}`}
        >
            {/* Drawer Handle */}
            <button
                onClick={onToggle}
                className="mx-auto flex w-full items-center justify-center py-3"
            >
                <ChevronUp
                    size={20}
                    className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""} ${isDark ? 'text-stone-500' : 'text-stone-400'}`}
                />
            </button>

            {/* Drawer Content */}
            <div className="max-h-[70vh] overflow-y-auto px-4 pb-4">
                {/* Title Preview (always visible) */}
                <div className="mb-4">
                    <h2 className={`font-serif text-xl ${isDark ? 'text-white' : 'text-stone-900'}`}>{item.title}</h2>
                    <p className={`text-xs ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>{item.date}</p>
                </div>

                {isOpen && (
                    <>
                        {item.description && (
                            <p className="mb-4 text-sm leading-relaxed text-stone-400">
                                {item.description}
                            </p>
                        )}

                        {/* Location Map (Mobile) */}
                        {item.latitude && item.longitude && (
                            <section className="mb-4">
                                <div className="overflow-hidden rounded-xl border border-stone-700/50">
                                    <div className="Zhi-map aspect-square w-full">
                                        <LocationMap
                                            lat={item.latitude}
                                            lng={item.longitude}
                                            _isDark={true}
                                            height="100%"
                                            showZoomControl={false}
                                        />
                                    </div>
                                </div>
                                {(item.city || item.locationName) && (
                                    <p className="mt-2 text-sm text-stone-400">
                                        {item.city && item.country
                                            ? `${item.city}, ${item.country}`
                                            : item.locationName}
                                    </p>
                                )}
                            </section>
                        )}

                        {/* Quick Info Grid (Mobile) */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            {item.width && item.height && (
                                <div className="rounded bg-stone-800/50 p-2">
                                    <span className="block text-[10px] uppercase text-stone-500">{t("Resolution")}</span>
                                    <span className="text-stone-300">{item.width} × {item.height}</span>
                                </div>
                            )}
                            {item.fileSize && (
                                <div className="rounded bg-stone-800/50 p-2">
                                    <span className="block text-[10px] uppercase text-stone-500">{t("Size")}</span>
                                    <span className="text-stone-300">{formatFileSize(item.fileSize)}</span>
                                </div>
                            )}
                            {item.capturedAt && (
                                <div className="col-span-2 rounded bg-stone-800/50 p-2">
                                    <span className="block text-[10px] uppercase text-stone-500">{t("Captured")}</span>
                                    <span className="text-stone-300">{formatDate(item.capturedAt, locale)}</span>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

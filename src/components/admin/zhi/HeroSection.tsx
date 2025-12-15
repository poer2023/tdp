"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Link2, Loader2, Image as ImageIcon, FileText, Camera, Layers, Check, ChevronDown } from "lucide-react";
import { useData } from "./store";
import { AdminImage } from "../AdminImage";
import { useAdminLocale } from "./useAdminLocale";
import { HeroPreviewGrid } from "./HeroPreviewGrid";
import type { HeroImageItem } from "./HeroPreviewGrid";

// Tab configuration
type TabId = "all" | "gallery" | "posts" | "moments" | "url";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

const TABS: Tab[] = [
  { id: "all", label: "All", icon: Layers },
  { id: "gallery", label: "Gallery", icon: ImageIcon },
  { id: "posts", label: "Posts", icon: FileText },
  { id: "moments", label: "Moments", icon: Camera },
  { id: "url", label: "From URL", icon: Link2 },
];

// Pagination: 8 columns x 4 rows = 32 images per page
const IMAGES_PER_PAGE = 32;

// Source image type from API
type ImageSource = "gallery" | "post" | "moment";

interface SourceImage {
  id: string;
  url: string;
  originalUrl: string;
  source: ImageSource;
  sourceId: string;
  title?: string;
  createdAt: string;
  isSelected: boolean;
}

export const HeroSection: React.FC = () => {
  const { heroImages, addHeroImage, deleteHeroImage, updateHeroImage } = useData();
  const { t } = useAdminLocale();

  // State
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [sourceImages, setSourceImages] = useState<SourceImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [newHeroUrl, setNewHeroUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalImages, setTotalImages] = useState(0);

  // Reset pagination when tab changes
  useEffect(() => {
    setSourceImages([]);
    setCurrentPage(1);
    setHasMore(true);
  }, [activeTab]);

  // Fetch source images from API with pagination
  const fetchSourceImages = useCallback(async (source?: string, page = 1, append = false) => {
    if (page === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams();
      if (source && source !== "all") {
        const sourceMap: Record<string, string> = {
          gallery: "gallery",
          posts: "post",
          moments: "moment",
        };
        params.set("source", sourceMap[source] || source);
      }
      params.set("page", String(page));
      params.set("pageSize", String(IMAGES_PER_PAGE));

      const res = await fetch(`/api/admin/hero/sources?${params.toString()}`);
      const data = await res.json();

      if (res.ok && Array.isArray(data.images)) {
        if (append) {
          setSourceImages((prev) => [...prev, ...data.images]);
        } else {
          setSourceImages(data.images);
        }

        // Update pagination state
        if (data.pagination) {
          setTotalImages(data.pagination.total);
          setHasMore(page < data.pagination.totalPages);
        } else {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error("Failed to fetch source images:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Fetch on tab change
  useEffect(() => {
    if (activeTab !== "url") {
      fetchSourceImages(activeTab);
    }
  }, [activeTab, fetchSourceImages]);

  // Refresh source images when hero images change
  useEffect(() => {
    if (activeTab !== "url") {
      const heroUrls = new Set(heroImages.map((h) => h.url));
      setSourceImages((prev) =>
        prev.map((img) => ({
          ...img,
          isSelected: heroUrls.has(img.url) || heroUrls.has(img.originalUrl),
        }))
      );
    }
  }, [heroImages, activeTab]);

  // Toggle image selection
  const handleToggleImage = async (imageId: string) => {
    const image = sourceImages.find((img) => img.id === imageId);
    if (!image) return;

    if (image.isSelected) {
      const heroImage = heroImages.find(
        (h) => h.url === image.url || h.url === image.originalUrl
      );
      if (heroImage) {
        await deleteHeroImage(heroImage.id);
      }
    } else {
      await addHeroImage({
        url: image.url,
        sortOrder: heroImages.length,
        active: true,
      });
    }

    setSourceImages((prev) =>
      prev.map((img) =>
        img.id === imageId ? { ...img, isSelected: !img.isSelected } : img
      )
    );
  };

  // Add from URL
  const handleAddFromUrl = async () => {
    if (!newHeroUrl.trim()) return;
    setIsAdding(true);
    try {
      await addHeroImage({
        url: newHeroUrl.trim(),
        sortOrder: heroImages.length,
        active: true,
      });
      setNewHeroUrl("");
    } finally {
      setIsAdding(false);
    }
  };

  // Handle reorder from preview grid - optimistic update
  const handleReorder = async (newOrder: HeroImageItem[]) => {
    // Collect images that actually changed
    const updates: Array<{ id: string; sortOrder: number }> = [];
    for (const img of newOrder) {
      const existing = heroImages.find((h) => h.id === img.id);
      if (existing && existing.sortOrder !== img.sortOrder) {
        updates.push({ id: img.id, sortOrder: img.sortOrder });
      }
    }

    if (updates.length === 0) return;

    // Update all in parallel (fire-and-forget for smoother UX)
    // The store will update state on each response, but since we're updating 
    // sortOrder only, the visual order won't change
    await Promise.all(
      updates.map(({ id, sortOrder }) => {
        const existing = heroImages.find((h) => h.id === id);
        if (existing) {
          return updateHeroImage({ ...existing, sortOrder });
        }
        return Promise.resolve();
      })
    );
  };

  // Remove from hero grid
  const handleRemoveHeroImage = async (id: string) => {
    await deleteHeroImage(id);
  };

  // Select all in current tab
  const handleSelectAll = async () => {
    const unselected = sourceImages.filter((img) => !img.isSelected);
    for (const img of unselected) {
      await addHeroImage({
        url: img.url,
        sortOrder: heroImages.length,
        active: true,
      });
    }
    setSourceImages((prev) => prev.map((img) => ({ ...img, isSelected: true })));
  };

  // Deselect all
  const handleDeselectAll = async () => {
    for (const heroImg of heroImages) {
      await deleteHeroImage(heroImg.id);
    }
    setSourceImages((prev) => prev.map((img) => ({ ...img, isSelected: false })));
  };

  // Load more images - fetch next page from server
  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchSourceImages(activeTab, nextPage, true);
  };

  const selectedCount = heroImages.length;

  // Transform heroImages to HeroImageItem for preview grid
  const previewImages: HeroImageItem[] = heroImages
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((img) => ({
      id: img.id,
      url: img.url,
      sortOrder: img.sortOrder,
    }));

  // Calculate remaining count for load more button
  const remainingCount = totalImages - sourceImages.length;

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
            {t("heroShuffleGrid")}
          </h2>
        </div>
      </div>

      {/* Hero Preview Grid - Only show when there are selected images */}
      {selectedCount > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-stone-500 dark:text-stone-400">
              {t("heroPreview")} ({selectedCount})
            </h3>
            <button
              onClick={handleDeselectAll}
              className="px-3 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
            >
              {t("removeAll")}
            </button>
          </div>

          <div className="flex justify-center">
            <HeroPreviewGrid
              images={previewImages}
              onReorder={handleReorder}
              onRemove={handleRemoveHeroImage}
            />
          </div>

          <p className="text-xs text-stone-400 dark:text-stone-500 text-center mt-4">
            {t("dragToReorder")}
          </p>
        </div>
      )}

      {/* Tabs - Pill style matching overall design */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-stone-100 dark:bg-stone-800/50">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all
                  ${isActive
                    ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm"
                    : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300"
                  }
                `}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* URL Input (only for URL tab) */}
      {activeTab === "url" && (
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4">
          <div className="flex gap-2">
            <input
              className="flex-1 p-3 border rounded-lg bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-stone-600 transition-all"
              placeholder={t("pasteImageUrl")}
              value={newHeroUrl}
              onChange={(e) => setNewHeroUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddFromUrl();
              }}
            />
            <button
              onClick={handleAddFromUrl}
              disabled={!newHeroUrl.trim() || isAdding}
              className="bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 px-6 rounded-lg font-bold disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              {isAdding ? <Loader2 size={16} className="animate-spin" /> : null}
              {t("add")}
            </button>
          </div>
        </div>
      )}

      {/* Image Selection Grid (for non-URL tabs) */}
      {activeTab !== "url" && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-stone-500 dark:text-stone-400">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  {t("loadingImages")}
                </span>
              ) : (
                `${sourceImages.length} ${t("imagesAvailable")}`
              )}
            </p>
            <button
              onClick={handleSelectAll}
              disabled={loading || sourceImages.length === 0}
              className="px-3 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 disabled:opacity-50"
            >
              {t("selectAll")}
            </button>
          </div>

          {/* Image Grid - no scroll, paginated */}
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {loading ? (
              Array.from({ length: IMAGES_PER_PAGE }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-lg bg-stone-200 dark:bg-stone-800 animate-pulse"
                />
              ))
            ) : sourceImages.length === 0 ? (
              <div className="col-span-full py-12 text-center text-stone-400 dark:text-stone-500">
                <ImageIcon size={48} className="mx-auto mb-3 opacity-50" />
                <p>{t("noImagesFound")}</p>
              </div>
            ) : (
              sourceImages.map((img, index) => {
                const isSelected = img.isSelected;
                const isPriority = index < 8; // First row loads with priority for better LCP
                return (
                  <button
                    key={img.id}
                    onClick={() => handleToggleImage(img.id)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${isSelected
                      ? "border-emerald-500 ring-2 ring-emerald-500/30"
                      : "border-transparent hover:border-stone-300 dark:hover:border-stone-600"
                      }`}
                  >
                    <AdminImage
                      src={img.url}
                      alt={img.title || ""}
                      className="w-full h-full"
                      containerClassName="w-full h-full"
                      priority={isPriority}
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                        <div className="bg-emerald-500 rounded-full p-1">
                          <Check size={12} className="text-white" />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Load More Button */}
          {hasMore && !loading && (
            <div className="mt-6 text-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors disabled:opacity-50"
              >
                {loadingMore ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ChevronDown size={16} />
                )}
                {loadingMore ? t("loadingImages") : `${t("loadMore")} (${remainingCount})`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HeroSection;

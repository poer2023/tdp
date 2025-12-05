"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Link2, Loader2, Image as ImageIcon, FileText, Camera, Layers, X, Check } from "lucide-react";
import { useData } from "./store";
import { AdminImage } from "../AdminImage";
import { useAdminLocale } from "./useAdminLocale";

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
  const { heroImages, addHeroImage, deleteHeroImage } = useData();
  const { t } = useAdminLocale();

  // State
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [sourceImages, setSourceImages] = useState<SourceImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [newHeroUrl, setNewHeroUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Fetch source images from API
  const fetchSourceImages = useCallback(async (source?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (source && source !== "all") {
        // Map tab ID to source filter
        const sourceMap: Record<string, string> = {
          gallery: "gallery",
          posts: "post",
          moments: "moment",
        };
        params.set("source", sourceMap[source] || source);
      }

      const res = await fetch(`/api/admin/hero/sources?${params.toString()}`);
      const data = await res.json();

      if (res.ok && Array.isArray(data.images)) {
        setSourceImages(data.images);
      }
    } catch (error) {
      console.error("Failed to fetch source images:", error);
    } finally {
      setLoading(false);
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
      // Update selection status based on current hero images
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
      // Find and remove from hero images
      const heroImage = heroImages.find(
        (h) => h.url === image.url || h.url === image.originalUrl
      );
      if (heroImage) {
        await deleteHeroImage(heroImage.id);
      }
    } else {
      // Add to hero images
      await addHeroImage({
        url: image.url,
        sortOrder: heroImages.length,
        active: true,
      });
    }

    // Update local state
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

  const selectedCount = heroImages.length;

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
            {t("heroShuffleGrid")}
          </h2>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-1 min-w-max border-b border-stone-200 dark:border-stone-700">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 text-sm font-medium
                  border-b-2 transition-colors
                  ${
                    isActive
                      ? "border-stone-900 text-stone-900 dark:border-stone-100 dark:text-stone-100"
                      : "border-transparent text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-300"
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
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4 mb-6">
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
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4 mb-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-stone-500 dark:text-stone-400">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  Loading images...
                </span>
              ) : (
                `${sourceImages.length} images available`
              )}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleSelectAll}
                disabled={loading || sourceImages.length === 0}
                className="px-3 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 disabled:opacity-50"
              >
                Select All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-64 overflow-y-auto p-1">
            {loading ? (
              // Loading skeleton
              Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-lg bg-stone-200 dark:bg-stone-800 animate-pulse"
                />
              ))
            ) : sourceImages.length === 0 ? (
              <div className="col-span-full py-12 text-center text-stone-400 dark:text-stone-500">
                <ImageIcon size={48} className="mx-auto mb-3 opacity-50" />
                <p>No images found in this category</p>
              </div>
            ) : (
              sourceImages.map((img) => {
                const isSelected = img.isSelected;
                return (
                  <button
                    key={img.id}
                    onClick={() => handleToggleImage(img.id)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      isSelected
                        ? "border-emerald-500 ring-2 ring-emerald-500/30"
                        : "border-transparent hover:border-stone-300 dark:hover:border-stone-600"
                    }`}
                  >
                    <AdminImage
                      src={img.url}
                      alt={img.title || ""}
                      className="w-full h-full"
                      containerClassName="w-full h-full"
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
        </div>
      )}

      {/* Current Hero Images */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-stone-500 dark:text-stone-400">
            Current Hero Images ({selectedCount})
          </h3>
          {selectedCount > 0 && (
            <button
              onClick={handleDeselectAll}
              className="px-3 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
            >
              Remove All
            </button>
          )}
        </div>

        {selectedCount === 0 ? (
          <div className="text-center py-12 text-stone-500">
            <ImageIcon size={48} className="mx-auto mb-3 opacity-30" />
            <p>No hero images yet</p>
            <p className="text-sm mt-1">Select images from the tabs above</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {heroImages.map((img) => (
              <div
                key={img.id}
                className="relative group rounded-lg overflow-hidden aspect-square bg-stone-200 dark:bg-stone-800"
              >
                <AdminImage
                  src={img.url}
                  alt=""
                  className="w-full h-full"
                  containerClassName="w-full h-full"
                />
                <button
                  onClick={() => handleRemoveHeroImage(img.id)}
                  className="absolute top-2 right-2 p-1.5 bg-rose-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600"
                >
                  <X size={14} />
                </button>
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-white/80 truncate block">
                    #{img.sortOrder + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroSection;

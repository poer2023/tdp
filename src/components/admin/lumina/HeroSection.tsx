"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Link2, Loader2, Image as ImageIcon, FileText, Camera, Layers } from "lucide-react";
import { useData } from "./store";
import { SectionContainer } from "./AdminComponents";
import { SelectableImage, type ImageSource } from "./SelectableImage";
import { AdaptiveHeroGrid } from "@/components/shared/AdaptiveHeroGrid";

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
  const { heroImages, addHeroImage, deleteHeroImage, refreshHeroImages } = useData();

  // State
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [sourceImages, setSourceImages] = useState<SourceImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [newHeroUrl, setNewHeroUrl] = useState("");

  // Fetch source images
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

    await addHeroImage({
      url: newHeroUrl.trim(),
      sortOrder: heroImages.length,
      active: true,
    });
    setNewHeroUrl("");
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
    <SectionContainer title="Hero Shuffle Grid" onAdd={() => {}}>
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
        <div className="mb-6 flex gap-2">
          <input
            className="flex-1 p-3 border rounded-lg bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 outline-none focus:ring-2 focus:ring-stone-300 dark:focus:ring-stone-600"
            placeholder="Paste image URL here..."
            value={newHeroUrl}
            onChange={(e) => setNewHeroUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddFromUrl();
            }}
          />
          <button
            onClick={handleAddFromUrl}
            disabled={!newHeroUrl.trim()}
            className="bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 px-6 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors"
          >
            Add
          </button>
        </div>
      )}

      {/* Batch Actions (for non-URL tabs) */}
      {activeTab !== "url" && (
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
      )}

      {/* Image Grid (for non-URL tabs) */}
      {activeTab !== "url" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-[400px] overflow-y-auto p-1">
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
            sourceImages.map((img) => (
              <SelectableImage
                key={img.id}
                id={img.id}
                url={img.url}
                source={img.source}
                title={img.title}
                isSelected={img.isSelected}
                onToggle={handleToggleImage}
              />
            ))
          )}
        </div>
      )}

      {/* Current Hero Images Section */}
      <div className="mt-8 pt-6 border-t border-stone-200 dark:border-stone-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
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

        {/* Adaptive Grid Preview with Shuffle Animation */}
        <AdaptiveHeroGrid
          images={heroImages.map((h) => ({ id: h.id, url: h.url }))}
          height="300px"
          animated
          showRemoveButton
          onImageClick={handleRemoveHeroImage}
          className="rounded-xl"
        />

        {selectedCount === 0 && (
          <p className="mt-4 text-center text-sm text-stone-400 dark:text-stone-500">
            Select images from the gallery above to add them to the hero grid
          </p>
        )}

        {/* Layout Info */}
        {selectedCount > 0 && (
          <p className="mt-3 text-xs text-stone-400 dark:text-stone-500 text-center">
            {selectedCount >= 16
              ? "4×4 Grid"
              : selectedCount >= 12
                ? "4×3 Grid"
                : selectedCount >= 9
                  ? "3×3 Grid"
                  : selectedCount >= 6
                    ? "3×2 Grid"
                    : selectedCount >= 4
                      ? "2×2 Grid"
                      : selectedCount >= 2
                        ? "Featured Layout"
                        : "Single Hero"}
            {" "}• Auto-adapts to image count
          </p>
        )}
      </div>

      {/* Mobile Action Bar */}
      <MobileActionBar
        selectedCount={selectedCount}
        onRemoveAll={handleDeselectAll}
      />
    </SectionContainer>
  );
};

// Mobile Action Bar Component
interface MobileActionBarProps {
  selectedCount: number;
  onRemoveAll: () => void;
}

function MobileActionBar({ selectedCount, onRemoveAll }: MobileActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-700 p-4 z-50">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        <span className="text-sm font-medium text-stone-600 dark:text-stone-400">
          {selectedCount} image{selectedCount !== 1 ? "s" : ""} selected
        </span>
        <button
          onClick={onRemoveAll}
          className="px-4 py-2 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
        >
          Clear All
        </button>
      </div>
    </div>
  );
}

export default HeroSection;

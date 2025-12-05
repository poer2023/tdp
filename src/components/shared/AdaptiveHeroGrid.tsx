"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

export interface HeroGridImage {
  id: string;
  url: string;
}

export interface AdaptiveHeroGridProps {
  images: HeroGridImage[];
  /** Enable shuffle animation (for frontend display) */
  animated?: boolean;
  /** Height of the grid container */
  height?: string;
  /** Custom class name for container */
  className?: string;
  /** Callback when image is clicked (for admin removal) */
  onImageClick?: (id: string) => void;
  /** Show remove button on hover */
  showRemoveButton?: boolean;
}

type LayoutType = "grid" | "featured" | "hero";

interface GridLayout {
  cols: number;
  rows: number;
  layout: LayoutType;
}

/**
 * Calculate optimal grid layout based on image count
 */
function getGridLayout(count: number): GridLayout {
  if (count >= 16) return { cols: 4, rows: 4, layout: "grid" };
  if (count >= 12) return { cols: 4, rows: 3, layout: "grid" };
  if (count >= 9) return { cols: 3, rows: 3, layout: "grid" };
  if (count >= 6) return { cols: 3, rows: 2, layout: "grid" };
  if (count >= 4) return { cols: 2, rows: 2, layout: "grid" };
  if (count >= 2) return { cols: 2, rows: 1, layout: "featured" };
  return { cols: 1, rows: 1, layout: "hero" };
}

/**
 * Fisher-Yates shuffle algorithm
 */
function shuffle<T>(array: T[]): T[] {
  const newArray = [...array];
  let currentIndex = newArray.length;

  while (currentIndex !== 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    const temp = newArray[currentIndex]!;
    newArray[currentIndex] = newArray[randomIndex]!;
    newArray[randomIndex] = temp;
  }

  return newArray;
}

/**
 * Adaptive Hero Grid Component
 * Automatically adjusts layout based on number of images
 */
export const AdaptiveHeroGrid: React.FC<AdaptiveHeroGridProps> = ({
  images,
  animated = false,
  height = "400px",
  className = "",
  onImageClick,
  showRemoveButton = false,
}) => {
  const layout = useMemo(() => getGridLayout(images.length), [images.length]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Limit images to what the grid can display
  const maxImages = layout.cols * layout.rows;

  // Initialize display images
  const initialImages = useMemo(() => {
    return images.slice(0, maxImages);
  }, [images, maxImages]);

  const [displayImages, setDisplayImages] = useState(initialImages);

  // Update display images when source images change
  useEffect(() => {
    setDisplayImages(images.slice(0, maxImages));
  }, [images, maxImages]);

  // Shuffle animation (only for grid layouts with 4+ images and when animated)
  useEffect(() => {
    if (!animated || layout.layout !== "grid" || displayImages.length < 4) return;

    const shuffleImages = () => {
      setDisplayImages((prev) => shuffle(prev));
      timeoutRef.current = setTimeout(shuffleImages, 3000);
    };

    // Start shuffle cycle
    timeoutRef.current = setTimeout(shuffleImages, 3000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [animated, layout.layout, displayImages.length]);

  // Handle empty state
  if (displayImages.length === 0) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl bg-stone-100 dark:bg-stone-800 ${className}`}
        style={{ height }}
      >
        <div className="text-center text-stone-400 dark:text-stone-500">
          <div className="text-4xl mb-2">📷</div>
          <p className="text-sm">No images selected</p>
        </div>
      </div>
    );
  }

  // Single hero image layout
  if (layout.layout === "hero") {
    const img = displayImages[0];
    if (!img) return null;

    return (
      <div className={`relative rounded-xl overflow-hidden ${className}`} style={{ height }}>
        <Image
          src={img.url}
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
          quality={85}
        />
        {showRemoveButton && onImageClick && (
          <RemoveButton onClick={() => onImageClick(img.id)} />
        )}
      </div>
    );
  }

  // Featured layout (2-3 images): 1 large + smaller ones
  if (layout.layout === "featured") {
    return (
      <div className={`grid grid-cols-3 grid-rows-2 gap-2 ${className}`} style={{ height }}>
        {/* Large image (spans 2 cols, 2 rows) */}
        <div className="relative col-span-2 row-span-2 rounded-xl overflow-hidden bg-stone-200 dark:bg-stone-800 group">
          {displayImages[0] && (
            <>
              <ImageCell image={displayImages[0]} animated={animated} />
              {showRemoveButton && onImageClick && (
                <RemoveButton onClick={() => onImageClick(displayImages[0]!.id)} />
              )}
            </>
          )}
        </div>
        {/* Smaller images */}
        {displayImages.slice(1, 3).map((img) => (
          <div
            key={img.id}
            className="relative rounded-xl overflow-hidden bg-stone-200 dark:bg-stone-800 group"
          >
            <ImageCell image={img} animated={animated} />
            {showRemoveButton && onImageClick && (
              <RemoveButton onClick={() => onImageClick(img.id)} />
            )}
          </div>
        ))}
      </div>
    );
  }

  // Regular grid layout with shuffle animation
  const gridTemplateColumns = `repeat(${layout.cols}, 1fr)`;
  const gridTemplateRows = `repeat(${layout.rows}, 1fr)`;

  return (
    <div
      className={`grid gap-2 ${className}`}
      style={{
        height,
        gridTemplateColumns,
        gridTemplateRows,
      }}
    >
      {displayImages.map((img) => (
        <motion.div
          key={img.id}
          layout={animated}
          transition={animated ? { duration: 1.5, type: "spring", stiffness: 45, damping: 15 } : undefined}
          className="relative rounded-xl overflow-hidden bg-stone-200 dark:bg-stone-800 group"
        >
          <ImageCell image={img} animated={animated} />
          {showRemoveButton && onImageClick && (
            <RemoveButton onClick={() => onImageClick(img.id)} />
          )}
        </motion.div>
      ))}
    </div>
  );
};

/**
 * Individual image cell with optional animation
 */
function ImageCell({
  image,
  animated: _animated,
}: {
  image: HeroGridImage;
  animated: boolean;
}) {
  return (
    <>
      <Image
        src={image.url}
        alt=""
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        className="object-cover"
        quality={85}
      />
      <div className="absolute inset-0 bg-stone-900/0 transition-colors duration-300 hover:bg-stone-900/10" />
    </>
  );
}

/**
 * Remove button overlay for admin mode
 */
function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="
        absolute top-2 right-2 w-6 h-6
        flex items-center justify-center
        bg-rose-500 text-white rounded-full
        opacity-0 group-hover:opacity-100
        transition-opacity duration-200
        hover:bg-rose-600
      "
      aria-label="Remove image"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  );
}

export default AdaptiveHeroGrid;

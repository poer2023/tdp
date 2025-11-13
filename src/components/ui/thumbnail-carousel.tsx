"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import Link from "next/link";
import { localePath } from "@/lib/locale-path";

const FULL_WIDTH_PX = 120;
const COLLAPSED_WIDTH_PX = 35;
const GAP_PX = 2;
const MARGIN_PX = 2;

interface ThumbnailImage {
  id: string;
  filePath: string;
  smallThumbPath?: string | null;
  microThumbPath?: string | null;
  mediumPath?: string | null;
  title?: string | null;
}

interface ThumbnailCarouselProps {
  images: ThumbnailImage[];
  currentId: string;
  locale?: "zh" | "en";
  onImageClick?: (id: string) => void;
}

export function Thumbnails({
  images,
  index,
  setIndex,
  currentId,
  locale = "zh",
  onImageClick,
}: {
  images: ThumbnailImage[];
  index: number;
  setIndex: (index: number) => void;
  currentId: string;
  locale?: "zh" | "en";
  onImageClick?: (id: string) => void;
}) {
  const thumbnailsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (thumbnailsRef.current) {
      let scrollPosition = 0;
      for (let i = 0; i < index; i++) {
        scrollPosition += COLLAPSED_WIDTH_PX + GAP_PX;
      }

      scrollPosition += MARGIN_PX;

      const containerWidth = thumbnailsRef.current.offsetWidth;
      const centerOffset = containerWidth / 2 - FULL_WIDTH_PX / 2;
      scrollPosition -= centerOffset;

      thumbnailsRef.current.scrollTo?.({
        left: scrollPosition,
        behavior: "smooth",
      });
    }
  }, [index]);

  return (
    <div
      ref={thumbnailsRef}
      className="overflow-x-auto"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      <style>{`
        .overflow-x-auto::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div className="flex gap-0.5 h-20 pb-2" style={{ width: "fit-content" }}>
        {images.map((item, i) => (
          <motion.div
            key={item.id}
            initial={false}
            animate={i === index ? "active" : "inactive"}
            variants={{
              active: {
                width: FULL_WIDTH_PX,
                marginLeft: MARGIN_PX,
                marginRight: MARGIN_PX,
              },
              inactive: {
                width: COLLAPSED_WIDTH_PX,
                marginLeft: 0,
                marginRight: 0,
              },
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative shrink-0 h-full overflow-hidden rounded"
          >
            <Link
              href={localePath(locale, `/gallery/${item.id}`)}
              className="block w-full h-full"
              onClick={(e) => {
                if (onImageClick) {
                  onImageClick(item.id);
                }
              }}
            >
              <img
                src={
                  item.smallThumbPath ??
                  item.microThumbPath ??
                  item.mediumPath ??
                  item.filePath
                }
                alt={item.title || ""}
                className="w-full h-full object-cover pointer-events-none select-none"
                draggable={false}
                loading="lazy"
                decoding="async"
              />
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function ThumbnailCarousel({
  images,
  currentId,
  locale = "zh",
  onImageClick,
}: ThumbnailCarouselProps) {
  // Calculate initial index from currentId
  const initialIndex = images.findIndex((img) => img.id === currentId);
  const [index, setIndex] = useState(initialIndex !== -1 ? initialIndex : 0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);

  useEffect(() => {
    if (!isDragging && containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth || 1;
      const targetX = -index * containerWidth;

      animate(x, targetX, {
        type: "spring",
        stiffness: 300,
        damping: 30,
      });
    }
  }, [index, x, isDragging]);

  const handleImageClick = (imageId: string) => {
    if (onImageClick) {
      onImageClick(imageId);
    }
  };

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3">
        {/* Main Carousel */}
        <div
          className="relative overflow-hidden rounded-lg bg-gray-100 dark:bg-zinc-800"
          ref={containerRef}
        >
          <motion.div
            className="flex"
            drag="x"
            dragElastic={0.2}
            dragMomentum={false}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={(e, info) => {
              setIsDragging(false);
              const containerWidth = containerRef.current?.offsetWidth || 1;
              const offset = info.offset.x;
              const velocity = info.velocity.x;

              let newIndex = index;

              // If fast swipe, use velocity
              if (Math.abs(velocity) > 500) {
                newIndex = velocity > 0 ? index - 1 : index + 1;
              }
              // Otherwise use offset threshold (30% of container width)
              else if (Math.abs(offset) > containerWidth * 0.3) {
                newIndex = offset > 0 ? index - 1 : index + 1;
              }

              // Clamp index
              newIndex = Math.max(0, Math.min(images.length - 1, newIndex));
              setIndex(newIndex);

              // Navigate to the new image
              const targetImage = images[newIndex];
              if (newIndex !== index && targetImage) {
                handleImageClick(targetImage.id);
              }
            }}
            style={{ x }}
          >
            {images.map((item) => (
              <div key={item.id} className="shrink-0 w-full h-[400px]">
                <img
                  src={
                    item.mediumPath ??
                    item.smallThumbPath ??
                    item.microThumbPath ??
                    item.filePath
                  }
                  alt={item.title || ""}
                  className="w-full h-full object-cover rounded-lg select-none pointer-events-none"
                  draggable={false}
                />
              </div>
            ))}
          </motion.div>

          {/* Previous Button */}
          <motion.button
            disabled={index === 0}
            onClick={() => {
              const newIndex = Math.max(0, index - 1);
              setIndex(newIndex);
              if (images[newIndex]) {
                handleImageClick(images[newIndex].id);
              }
            }}
            className={`absolute left-4 text-black dark:text-white top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform z-10
              ${
                index === 0
                  ? "opacity-40 cursor-not-allowed"
                  : "bg-white dark:bg-zinc-700 hover:scale-110 hover:opacity-100 opacity-70"
              }`}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </motion.button>

          {/* Next Button */}
          <motion.button
            disabled={index === images.length - 1}
            onClick={() => {
              const newIndex = Math.min(images.length - 1, index + 1);
              setIndex(newIndex);
              if (images[newIndex]) {
                handleImageClick(images[newIndex].id);
              }
            }}
            className={`absolute text-black dark:text-white right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform z-10
              ${
                index === images.length - 1
                  ? "opacity-40 cursor-not-allowed"
                  : "bg-white dark:bg-zinc-700 hover:scale-110 hover:opacity-100 opacity-70"
              }`}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </motion.button>

          {/* Image Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            {index + 1} / {images.length}
          </div>
        </div>

        <Thumbnails
          images={images}
          index={index}
          setIndex={setIndex}
          currentId={currentId}
          locale={locale}
          onImageClick={onImageClick}
        />
      </div>
    </div>
  );
}

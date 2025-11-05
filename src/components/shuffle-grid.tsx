"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import type { RecentActivity } from "@/lib/posts";
import type { GalleryImage } from "@/lib/gallery";
import type { SiteStatistics } from "@/lib/statistics";
import type { PublicLocale } from "@/lib/locale-path";
import { localePath } from "@/lib/locale-path";
import { ShuffleGridStats } from "@/components/shuffle-grid-stats";

type ShuffleGridProps = {
  activities: RecentActivity[];
  galleryPhotos: GalleryImage[];
  statistics: SiteStatistics;
  locale: PublicLocale;
};

type GridItem = {
  id: string;
  image: string;
  title: string;
  type: "post" | "gallery";
  href: string;
};

function buildOptimizedUrl(src: string, width: number): string {
  if (!src || !src.startsWith("/")) {
    return src;
  }

  // Skip if already a generated thumbnail (micro/small/medium) or query params exist
  if (/\b_(micro|small|medium)\b/.test(src) || /\.webp($|\?)/.test(src)) {
    return src;
  }

  try {
    const url = new URL(src, "http://localhost");
    url.searchParams.set("w", String(width));
    url.searchParams.set("format", "webp");
    url.searchParams.set("q", url.searchParams.get("q") ?? "75");
    const query = url.searchParams.toString();
    return `${url.pathname}${query ? `?${query}` : ""}`;
  } catch {
    return src;
  }
}

// Official shuffle algorithm
const shuffle = <T,>(array: T[]): T[] => {
  const result = [...array];
  let currentIndex = result.length;

  while (currentIndex !== 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    const currentItem = result[currentIndex];
    const randomItem = result[randomIndex];

    if (currentItem === undefined || randomItem === undefined) {
      continue;
    }

    result[currentIndex] = randomItem;
    result[randomIndex] = currentItem;
  }

  return result;
};

function ShuffleGrid({ activities, galleryPhotos, statistics, locale }: ShuffleGridProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mix activities and gallery photos, avoiding duplicates
  const allItems = useMemo(() => {
    const activityItems: GridItem[] = activities.map((a) => ({
      id: a.id,
      image: buildOptimizedUrl(a.image, 560),
      title: a.title,
      type: a.type,
      href:
        a.type === "post" && a.slug
          ? localePath(locale, `/posts/${a.slug}`)
          : localePath(locale, "/gallery"),
    }));

    const photoItems: GridItem[] = galleryPhotos
      .filter((p) => !activities.some((a) => a.id === p.id))
      .map((p) => ({
        id: p.id,
        image: buildOptimizedUrl(p.smallThumbPath || p.microThumbPath || p.filePath || "", 480),
        title: p.title || (locale === "zh" ? "相册照片" : "Gallery photo"),
        type: "gallery" as const,
        href: localePath(locale, "/gallery"),
      }));

    return [...activityItems, ...photoItems];
  }, [activities, galleryPhotos, locale]);

  // Generate squares using official pattern - useCallback for stable function reference
  const generateSquares = useCallback(() => {
    return shuffle([...allItems])
      .slice(0, 12)
      .map((item) => (
        <motion.div
          key={item.id}
          layout
          transition={{ duration: 1.5, type: "spring" }}
          whileHover={{ scale: 1.05 }}
          className="relative h-full w-full cursor-pointer overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800"
          onClick={() => (window.location.href = item.href)}
          style={{
            backgroundImage: `url(${item.image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          aria-label={item.title}
        />
      ));
  }, [allItems]);

  // Lazy initialization - only runs once on initial render (React best practice)
  // Initialize with empty array for SSR, will be populated in useEffect
  const [squares, setSquares] = useState<React.ReactElement[]>([]);

  // useEffect for side effects (timers and initial square generation)
  useEffect(() => {
    // Initialize squares on mount
    setSquares(generateSquares());

    const shuffleSquares = () => {
      setSquares(generateSquares());
      timeoutRef.current = setTimeout(shuffleSquares, 3000);
    };

    timeoutRef.current = setTimeout(shuffleSquares, 3000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
    // Run only when component mounts or when generateSquares changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="relative w-full py-12 sm:py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 md:items-center md:gap-12 lg:gap-16">
          {/* Left: Statistics */}
          <div className="flex items-center">
            <ShuffleGridStats statistics={statistics} locale={locale} />
          </div>

          {/* Right: Animated Grid */}
          <div className="grid h-[450px] grid-cols-3 grid-rows-4 gap-1">
            {squares.length === 0
              ? Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={`skeleton-${i}`}
                    className="h-full w-full animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800"
                  />
                ))
              : squares.map((sq) => sq)}
          </div>
        </div>
      </div>
    </section>
  );
}

export { ShuffleGrid };

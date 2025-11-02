"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
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

function ShuffleGrid({ activities, galleryPhotos, statistics, locale }: ShuffleGridProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mix activities and gallery photos, avoiding duplicates
  const allItems = useMemo(() => {
    const activityItems: GridItem[] = activities.map((a) => ({
      id: a.id,
      image: a.image,
      title: a.title,
      type: a.type,
      href: a.type === "post" && a.slug
        ? localePath(locale, `/posts/${a.slug}`)
        : localePath(locale, "/gallery"),
    }));

    const photoItems: GridItem[] = galleryPhotos
      .filter((p) => !activities.some((a) => a.id === p.id)) // Avoid duplicates
      .map((p) => ({
        id: p.id,
        image: p.smallThumbPath || p.microThumbPath || p.filePath,
        title: p.title || (locale === "zh" ? "相册照片" : "Gallery photo"),
        type: "gallery" as const,
        href: localePath(locale, "/gallery"),
      }));

    return [...activityItems, ...photoItems];
  }, [activities, galleryPhotos, locale]);

  // Shuffle and take 12 items
  const shuffle = (array: GridItem[]): GridItem[] => {
    const shuffled = [...array];
    let currentIndex = shuffled.length;

    while (currentIndex !== 0) {
      const randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      // Safe array swap with proper null checks
      const temp = shuffled[currentIndex];
      const randomItem = shuffled[randomIndex];
      if (temp && randomItem) {
        shuffled[currentIndex] = randomItem;
        shuffled[randomIndex] = temp;
      }
    }

    return shuffled;
  };

  const generateSquares = () => {
    return shuffle(allItems).slice(0, 12);
  };

  const [squares, setSquares] = useState<GridItem[]>([]);

  useEffect(() => {
    // Initialize on client side only
    setSquares(generateSquares());

    const shuffleSquares = () => {
      setSquares(generateSquares());
      timeoutRef.current = setTimeout(shuffleSquares, 3000);
    };

    shuffleSquares();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [allItems]);

  return (
    <section className="relative w-full py-12 sm:py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 md:gap-12 lg:gap-16">
          {/* Left: Statistics */}
          <div className="flex items-center">
            <ShuffleGridStats statistics={statistics} locale={locale} />
          </div>

          {/* Right: Animated Grid */}
          <div className="grid grid-cols-3 grid-rows-4 gap-2 sm:gap-3 md:h-[450px]">
            {squares.map((item, index) => (
              <motion.div
                key={`${item.id}-${index}`}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.05,
                  type: "spring",
                  stiffness: 100,
                }}
                whileHover={{ scale: 1.05 }}
                className="relative overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800"
              >
                <Link href={item.href} className="block h-full w-full">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 15vw"
                    className="object-cover"
                    loading="lazy"
                  />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export { ShuffleGrid };

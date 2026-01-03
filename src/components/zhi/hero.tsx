"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { MapPin, Briefcase, Aperture, Cpu } from "lucide-react";
import { getLocaleFromPathname } from "@/lib/i18n";
import Image from "next/image";

// Default hero images - can be replaced with actual data
const DEFAULT_HERO_IMAGES: HeroImageItem[] = [
  { src: "https://picsum.photos/800/800?random=101", href: "/gallery", type: "gallery" },
  { src: "https://picsum.photos/800/800?random=102", href: "/gallery", type: "gallery" },
  { src: "https://picsum.photos/800/800?random=103", href: "/gallery", type: "gallery" },
  { src: "https://picsum.photos/800/800?random=104", href: "/gallery", type: "gallery" },
];

// Hero image item with source info for navigation
export interface HeroImageItem {
  src: string;
  href: string;
  type: "gallery" | "moment" | "post";
}

interface ZhiHeroProps {
  heroImages?: HeroImageItem[];
}

export function ZhiHero({ heroImages = DEFAULT_HERO_IMAGES }: ZhiHeroProps) {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname) ?? "en";

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      en: {
        "Better every day": "Better every day",
        "Let's change": "Let's change",
        "it up a bit": "it up a bit",
        "Welcome to my digital garden...":
          "Welcome to my digital garden. I'm a Product Manager capturing light, exploring tech, and sharing the small data of my daily life.",
        "Product Manager": "Product Manager",
        Photographer: "Photographer",
        "Tech Enthusiast": "Tech Enthusiast",
      },
      zh: {
        "Better every day": "日日精进",
        "Let's change": "尝试一些",
        "it up a bit": "新鲜事物",
        "Welcome to my digital garden...":
          "欢迎来到我的数字花园。我是产品经理,在这里捕捉光影、探索科技,并分享我日常生活中的小数据。",
        "Product Manager": "产品经理",
        Photographer: "独立摄影",
        "Tech Enthusiast": "数码玩家",
      },
    };
    return translations[locale]?.[key] || key;
  };

  return (
    <section className="relative w-full overflow-hidden py-6 sm:py-12 md:py-24">
      <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 sm:gap-10 sm:px-6 lg:flex-row lg:gap-16 lg:px-8">
        {/* Content Column */}
        <div className="order-2 flex w-full max-w-2xl flex-1 flex-col space-y-0 text-center sm:space-y-10 lg:order-1 lg:max-w-none lg:text-left">
          <div className="space-y-4 sm:space-y-6">
            {/* Decorative Label */}
            <div className="flex items-center justify-center gap-3 lg:justify-start">
              <span className="h-[2px] w-8 rounded-full bg-sage-500 opacity-60"></span>
              <span className="inline-block text-sm font-bold uppercase tracking-[0.2em] text-sage-600 dark:text-sage-400">
                {t("Better every day")}
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="font-serif text-4xl font-medium leading-[1.05] tracking-tight text-stone-900 sm:text-5xl md:text-6xl lg:text-7xl dark:text-stone-100">
              {t("Let's change")} <br className="hidden sm:block" />
              <span className="relative inline-block font-serif font-light italic text-stone-400 dark:text-stone-500">
                {t("it up a bit")}
                {/* Subtle underline decoration */}
                <svg
                  className="absolute -bottom-1 left-0 -z-10 h-3 w-full text-sage-300 dark:text-sage-800"
                  viewBox="0 0 100 10"
                  preserveAspectRatio="none"
                >
                  <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              </span>
            </h1>

            {/* Description */}
            <p className="mx-auto max-w-2xl text-base font-light leading-relaxed text-stone-500 sm:text-lg md:text-xl lg:mx-0 dark:text-stone-400">
              {t("Welcome to my digital garden...")}
            </p>
          </div>

          {/* Info Grid - 2x2 Layout (hidden on mobile to show content faster) */}
          <div className="mx-auto hidden w-full max-w-sm border-t border-stone-200 pt-6 sm:block lg:mx-0 dark:border-[#27272a]">
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <InfoItem icon={<Briefcase size={16} />} label={t("Product Manager")} />
              <InfoItem icon={<Aperture size={16} />} label={t("Photographer")} />
              <InfoItem icon={<Cpu size={16} />} label={t("Tech Enthusiast")} />
              <InfoItem icon={<MapPin size={16} />} label="Shanghai, CN" />
            </div>
          </div>
        </div>

        {/* Shuffle Grid Column */}
        <div className="order-1 w-full lg:order-2 lg:w-1/2">
          <ShuffleGrid heroImages={heroImages} />
        </div>
      </div>
    </section>
  );
}

// Subcomponent for Info Grid Items
function InfoItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="group flex cursor-default items-center gap-3 text-stone-600 dark:text-stone-400">
      <div className="shrink-0 rounded-lg bg-stone-100 p-2 text-stone-500 transition-colors group-hover:bg-sage-50 group-hover:text-sage-600 dark:bg-[#1f1f23] dark:group-hover:bg-sage-900/20 dark:group-hover:text-sage-400">
        {icon}
      </div>
      <span className="whitespace-nowrap text-sm font-medium">{label}</span>
    </div>
  );
}

// Shuffle Algorithm (Fisher-Yates)
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

// Layout calculation - determines grid dimensions based on image count
interface GridLayout {
  cols: number;
  rows: number;
  gap: string;
}

function getGridLayout(count: number): GridLayout {
  if (count >= 13) return { cols: 4, rows: 4, gap: "gap-1" };
  if (count >= 10) return { cols: 4, rows: 3, gap: "gap-1.5" };
  if (count >= 7) return { cols: 3, rows: 3, gap: "gap-1.5" };
  if (count >= 5) return { cols: 3, rows: 2, gap: "gap-2" };
  if (count >= 4) return { cols: 2, rows: 2, gap: "gap-2" };
  if (count >= 2) return { cols: 2, rows: 1, gap: "gap-2" };
  return { cols: 1, rows: 1, gap: "gap-0" };
}

// Get image quality based on grid size - optimized for performance
function getImageQuality(cols: number): number {
  // Balanced quality for performance while maintaining good visuals
  if (cols === 1) return 85;
  if (cols === 2) return 80;
  return 75;
}

// Get image sizes for responsive loading - request larger images for Retina displays
function getImageSizes(cols: number): string {
  // Request 2x the display size to ensure sharp images on Retina displays
  // WebP compression keeps file sizes reasonable even at larger dimensions
  if (cols === 1) return "(max-width: 640px) 100vw, (max-width: 1024px) 70vw, 800px";
  if (cols === 2) return "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px";
  if (cols === 3) return "(max-width: 640px) 50vw, (max-width: 1024px) 40vw, 450px";
  return "(max-width: 640px) 50vw, (max-width: 1024px) 35vw, 400px";
}

// Shuffle Grid Component - unified layout for 1-16 images
function ShuffleGrid({ heroImages }: { heroImages: HeroImageItem[] }) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const imageCount = heroImages.length;
  const layout = useMemo(() => getGridLayout(imageCount), [imageCount]);

  // Calculate how many images to display (capped by grid capacity)
  const maxImages = layout.cols * layout.rows;

  const initialSquares = useMemo(() => {
    const needed = Math.min(maxImages, imageCount);
    const result: { id: number; src: string; href: string }[] = [];
    for (let i = 0; i < needed; i++) {
      const item = heroImages[i % heroImages.length];
      if (item) {
        result.push({ id: i, src: item.src, href: item.href });
      }
    }
    return result;
  }, [heroImages, imageCount, maxImages]);

  const [squares, setSquares] = useState(initialSquares);

  // Sync squares when initialSquares changes (e.g., when heroImages prop updates)
  useEffect(() => {
    setSquares(initialSquares);
  }, [initialSquares]);

  // Shuffle animation (only for layouts with 4+ images)
  useEffect(() => {
    // Check length inside effect to avoid dependency on changing value
    if (initialSquares.length < 4) return;

    const shuffleSquares = () => {
      setSquares((prev) => shuffle(prev));
      timeoutRef.current = setTimeout(shuffleSquares, 3000);
    };

    // Start shuffle after initial delay
    timeoutRef.current = setTimeout(shuffleSquares, 3000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [initialSquares.length]);

  // Handle empty state
  if (squares.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-stone-100 dark:bg-[#1f1f23]">
        <p className="text-stone-400 dark:text-stone-500">No images</p>
      </div>
    );
  }

  const imageQuality = getImageQuality(layout.cols);
  const imageSizes = getImageSizes(layout.cols);

  // Unified grid layout - all sizes use the same structure
  return (
    <div
      className={`grid w-full ${layout.gap}`}
      style={{
        gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
        gridTemplateRows: `repeat(${layout.rows}, 1fr)`,
        aspectRatio: `${layout.cols} / ${layout.rows}`,
      }}
    >
      {squares.map((sq) => (
        <motion.a
          key={sq.id}
          href={sq.href}
          layout
          transition={{ duration: 1.5, type: "spring", stiffness: 45, damping: 15 }}
          className="relative cursor-pointer overflow-hidden rounded-xl bg-stone-200 shadow-sm dark:bg-[#1f1f23]"
          style={{ aspectRatio: "1 / 1" }}
        >
          <Image
            src={sq.src}
            alt=""
            fill
            sizes={imageSizes}
            className="object-cover transition-transform duration-300 hover:scale-105"
            quality={imageQuality}
            priority={sq.id < 4}
            loading={sq.id < 4 ? "eager" : "lazy"}
          />
          <div className="absolute inset-0 bg-stone-900/0 transition-colors duration-300 hover:bg-stone-900/10" />
        </motion.a>
      ))}
    </div>
  );
}

export default ZhiHero;

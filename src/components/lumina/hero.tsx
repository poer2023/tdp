"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { MapPin, Briefcase, Aperture, Cpu } from "lucide-react";
import { getLocaleFromPathname } from "@/lib/i18n";
import Image from "next/image";

// Default hero images - can be replaced with actual data
const DEFAULT_HERO_IMAGES: HeroImageItem[] = [
  { src: "https://picsum.photos/400/400?random=101", href: "/gallery", type: "gallery" },
  { src: "https://picsum.photos/400/400?random=102", href: "/gallery", type: "gallery" },
  { src: "https://picsum.photos/400/400?random=103", href: "/gallery", type: "gallery" },
  { src: "https://picsum.photos/400/400?random=104", href: "/gallery", type: "gallery" },
  { src: "https://picsum.photos/400/400?random=105", href: "/gallery", type: "gallery" },
  { src: "https://picsum.photos/400/400?random=106", href: "/gallery", type: "gallery" },
  { src: "https://picsum.photos/400/400?random=107", href: "/gallery", type: "gallery" },
  { src: "https://picsum.photos/400/400?random=108", href: "/gallery", type: "gallery" },
  { src: "https://picsum.photos/400/400?random=109", href: "/gallery", type: "gallery" },
  { src: "https://picsum.photos/400/400?random=110", href: "/gallery", type: "gallery" },
  { src: "https://picsum.photos/400/400?random=111", href: "/gallery", type: "gallery" },
  { src: "https://picsum.photos/400/400?random=112", href: "/gallery", type: "gallery" },
];

// Hero image item with source info for navigation
export interface HeroImageItem {
  src: string;
  href: string;
  type: "gallery" | "moment" | "post";
}

interface LuminaHeroProps {
  heroImages?: HeroImageItem[];
}

export function LuminaHero({ heroImages = DEFAULT_HERO_IMAGES }: LuminaHeroProps) {
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
    <section className="relative w-full overflow-hidden py-12 sm:py-16 md:py-24">
      <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-10 px-4 sm:px-6 lg:flex-row lg:gap-16 lg:px-8">
        {/* Content Column */}
        <div className="order-2 flex w-full max-w-2xl flex-1 flex-col space-y-10 text-center lg:order-1 lg:max-w-none lg:text-left">
          <div className="space-y-6">
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

          {/* New Info Grid */}
          <div className="mx-auto w-full max-w-md border-t border-stone-200 pt-6 lg:mx-0 dark:border-[#27272a]">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-5">
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
      <div className="rounded-lg bg-stone-100 p-2 text-stone-500 transition-colors group-hover:bg-sage-50 group-hover:text-sage-600 dark:bg-[#1f1f23] dark:group-hover:bg-sage-900/20 dark:group-hover:text-sage-400">
        {icon}
      </div>
      <span className="text-sm font-medium tracking-wide">{label}</span>
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

// Layout calculation
interface GridLayout {
  cols: number;
  rows: number;
  type: "grid" | "featured" | "hero";
}

function getGridLayout(count: number): GridLayout {
  if (count >= 16) return { cols: 4, rows: 4, type: "grid" };
  if (count >= 12) return { cols: 4, rows: 3, type: "grid" };
  if (count >= 9) return { cols: 3, rows: 3, type: "grid" };
  if (count >= 6) return { cols: 3, rows: 2, type: "grid" };
  if (count >= 4) return { cols: 2, rows: 2, type: "grid" };
  if (count >= 2) return { cols: 2, rows: 1, type: "featured" };
  return { cols: 1, rows: 1, type: "hero" };
}

// Shuffle Grid Component
function ShuffleGrid({ heroImages }: { heroImages: HeroImageItem[] }) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const imageCount = heroImages.length;
  const layout = useMemo(() => getGridLayout(imageCount), [imageCount]);

  // Calculate how many images to display
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

  // Update squares when heroImages change
  useEffect(() => {
    const needed = Math.min(maxImages, imageCount);
    const result: { id: number; src: string; href: string }[] = [];
    for (let i = 0; i < needed; i++) {
      const item = heroImages[i % heroImages.length];
      if (item) {
        result.push({ id: i, src: item.src, href: item.href });
      }
    }
    setSquares(result);
  }, [heroImages, imageCount, maxImages]);

  // Shuffle animation (only for grid layouts with 4+ images)
  useEffect(() => {
    if (layout.type !== "grid" || squares.length < 4) return;

    const shuffleSquares = () => {
      setSquares((prev) => shuffle(prev));
      timeoutRef.current = setTimeout(shuffleSquares, 3000);
    };

    shuffleSquares();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [layout.type, squares.length]);

  // Handle empty state
  if (squares.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-xl bg-stone-100 dark:bg-[#1f1f23] sm:h-[340px] md:h-[420px]">
        <p className="text-stone-400 dark:text-stone-500">No images</p>
      </div>
    );
  }

  // Single hero image layout
  if (layout.type === "hero" && squares[0]) {
    return (
      <motion.a
        href={squares[0].href}
        className="relative block h-[280px] overflow-hidden rounded-xl bg-stone-200 shadow-sm dark:bg-[#1f1f23] sm:h-[340px] md:h-[420px]"
      >
        <Image
          src={squares[0].src}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
          className="object-cover transition-transform duration-300 hover:scale-105"
          quality={90}
        />
        <div className="absolute inset-0 bg-stone-900/0 transition-colors duration-300 hover:bg-stone-900/10" />
      </motion.a>
    );
  }

  // Featured layout (2-3 images)
  if (layout.type === "featured") {
    return (
      <div className="grid h-[280px] grid-cols-3 grid-rows-2 gap-1.5 sm:h-[340px] sm:gap-2 md:h-[420px]">
        {/* Large featured image */}
        {squares[0] && (
          <motion.a
            href={squares[0].href}
            layout
            transition={{ duration: 1.5, type: "spring", stiffness: 45, damping: 15 }}
            className="relative col-span-2 row-span-2 overflow-hidden rounded-xl bg-stone-200 shadow-sm dark:bg-[#1f1f23]"
          >
            <Image
              src={squares[0].src}
              alt=""
              fill
              sizes="(max-width: 640px) 66vw, (max-width: 1024px) 40vw, 400px"
              className="object-cover transition-transform duration-300 hover:scale-105"
              quality={85}
            />
            <div className="absolute inset-0 bg-stone-900/0 transition-colors duration-300 hover:bg-stone-900/10" />
          </motion.a>
        )}
        {/* Smaller images */}
        {squares.slice(1, 3).map((sq) => (
          <motion.a
            key={sq.id}
            href={sq.href}
            layout
            transition={{ duration: 1.5, type: "spring", stiffness: 45, damping: 15 }}
            className="relative overflow-hidden rounded-xl bg-stone-200 shadow-sm dark:bg-[#1f1f23]"
          >
            <Image
              src={sq.src}
              alt=""
              fill
              sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 200px"
              className="object-cover transition-transform duration-300 hover:scale-105"
              quality={85}
            />
            <div className="absolute inset-0 bg-stone-900/0 transition-colors duration-300 hover:bg-stone-900/10" />
          </motion.a>
        ))}
      </div>
    );
  }

  // Standard grid layout with shuffle animation
  return (
    <div className="grid h-[280px] grid-cols-3 grid-rows-4 gap-1.5 sm:h-[340px] sm:grid-cols-4 sm:gap-2 md:h-[420px]">
      {squares.map((sq) => (
        <motion.a
          key={sq.id}
          href={sq.href}
          layout
          transition={{ duration: 1.5, type: "spring", stiffness: 45, damping: 15 }}
          className="relative h-full w-full cursor-pointer overflow-hidden rounded-xl bg-stone-200 shadow-sm dark:bg-[#1f1f23]"
        >
          <Image
            src={sq.src}
            alt=""
            fill
            sizes="(max-width: 640px) 25vw, (max-width: 1024px) 12.5vw, 120px"
            className="object-cover transition-transform duration-300 hover:scale-105"
            quality={75}
          />
          <div className="absolute inset-0 bg-stone-900/0 transition-colors duration-300 hover:bg-stone-900/10" />
        </motion.a>
      ))}
    </div>
  );
}

export default LuminaHero;

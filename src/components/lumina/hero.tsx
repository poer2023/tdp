"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { MapPin, Briefcase, Aperture, Cpu } from "lucide-react";
import { getLocaleFromPathname } from "@/lib/i18n";
import Image from "next/image";

// Default hero images - used as fallback
const DEFAULT_HERO_IMAGES = [
  "https://picsum.photos/400/400?random=101",
  "https://picsum.photos/400/400?random=102",
  "https://picsum.photos/400/400?random=103",
  "https://picsum.photos/400/400?random=104",
  "https://picsum.photos/400/400?random=105",
  "https://picsum.photos/400/400?random=106",
  "https://picsum.photos/400/400?random=107",
  "https://picsum.photos/400/400?random=108",
  "https://picsum.photos/400/400?random=109",
  "https://picsum.photos/400/400?random=110",
  "https://picsum.photos/400/400?random=111",
  "https://picsum.photos/400/400?random=112",
];

interface LuminaHeroProps {
  heroImages?: string[];
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
          "欢迎来到我的数字花园。我是产品经理，在这里捕捉光影、探索科技，并分享我日常生活中的小数据。",
        "Product Manager": "产品经理",
        Photographer: "独立摄影",
        "Tech Enthusiast": "数码玩家",
      },
    };
    return translations[locale]?.[key] || key;
  };

  return (
    <section className="relative w-full overflow-hidden py-16 md:py-24">
      <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-12 px-4 sm:px-6 lg:flex-row lg:gap-20 lg:px-8">
        {/* Content Column */}
        <div className="order-2 flex max-w-2xl flex-1 flex-col space-y-10 text-center lg:order-1 lg:max-w-none lg:text-left">
          <div className="space-y-6">
            {/* Decorative Label */}
            <div className="flex items-center justify-center gap-3 lg:justify-start">
              <span className="h-[2px] w-8 rounded-full bg-sage-500 opacity-60"></span>
              <span className="inline-block text-sm font-bold uppercase tracking-[0.2em] text-sage-600 dark:text-sage-400">
                {t("Better every day")}
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="font-serif text-5xl font-medium leading-[1.05] tracking-tight text-stone-900 md:text-6xl lg:text-7xl dark:text-stone-100">
              {t("Let's change")} <br className="hidden md:block" />
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
            <p className="mx-auto max-w-lg text-lg font-light leading-relaxed text-stone-500 md:text-xl lg:mx-0 dark:text-stone-400">
              {t("Welcome to my digital garden...")}
            </p>
          </div>

          {/* New Info Grid */}
          <div className="mx-auto w-full max-w-md border-t border-stone-200 pt-6 lg:mx-0 dark:border-[#27272a]">
            <div className="grid grid-cols-2 gap-4">
              <InfoItem icon={<Briefcase size={16} />} label={t("Product Manager")} />
              <InfoItem icon={<Aperture size={16} />} label={t("Photographer")} />
              <InfoItem icon={<Cpu size={16} />} label={t("Tech Enthusiast")} />
              <InfoItem icon={<MapPin size={16} />} label="Shanghai, CN" />
            </div>
          </div>
        </div>

        {/* Shuffle Grid Column - Now Adaptive */}
        <div className="order-1 w-full lg:order-2 lg:w-1/2">
          <AdaptiveShuffleGrid heroImages={heroImages} />
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

// Adaptive Shuffle Grid Component
function AdaptiveShuffleGrid({ heroImages }: { heroImages: string[] }) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const imageCount = heroImages.length;
  const layout = useMemo(() => getGridLayout(imageCount), [imageCount]);

  // Calculate how many images to display
  const maxImages = layout.cols * layout.rows;

  const initialSquares = useMemo(() => {
    const needed = Math.min(maxImages, imageCount);
    const result: { id: number; src: string }[] = [];
    for (let i = 0; i < needed; i++) {
      const src = heroImages[i % heroImages.length];
      if (src) {
        result.push({ id: i, src });
      }
    }
    return result;
  }, [heroImages, imageCount, maxImages]);

  const [squares, setSquares] = useState(initialSquares);

  // Update squares when heroImages change
  useEffect(() => {
    const needed = Math.min(maxImages, imageCount);
    const result: { id: number; src: string }[] = [];
    for (let i = 0; i < needed; i++) {
      const src = heroImages[i % heroImages.length];
      if (src) {
        result.push({ id: i, src });
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
      <div className="flex h-[400px] items-center justify-center rounded-xl bg-stone-100 dark:bg-[#1f1f23] sm:h-[450px]">
        <p className="text-stone-400 dark:text-stone-500">No images</p>
      </div>
    );
  }

  // Single hero image layout
  if (layout.type === "hero" && squares[0]) {
    return (
      <div className="relative h-[400px] overflow-hidden rounded-xl bg-stone-200 shadow-sm dark:bg-[#1f1f23] sm:h-[450px]">
        <Image
          src={squares[0].src}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
          className="object-cover"
          quality={90}
        />
        <div className="absolute inset-0 bg-stone-900/0 transition-colors duration-300 hover:bg-stone-900/10" />
      </div>
    );
  }

  // Featured layout (2-3 images)
  if (layout.type === "featured") {
    return (
      <div className="grid h-[400px] grid-cols-3 grid-rows-2 gap-2 sm:h-[450px]">
        {/* Large featured image */}
        {squares[0] && (
          <motion.div
            layout
            transition={{ duration: 1.5, type: "spring", stiffness: 45, damping: 15 }}
            className="relative col-span-2 row-span-2 overflow-hidden rounded-xl bg-stone-200 shadow-sm dark:bg-[#1f1f23]"
          >
            <Image
              src={squares[0].src}
              alt=""
              fill
              sizes="(max-width: 640px) 66vw, (max-width: 1024px) 40vw, 400px"
              className="object-cover"
              quality={85}
            />
            <div className="absolute inset-0 bg-stone-900/0 transition-colors duration-300 hover:bg-stone-900/10" />
          </motion.div>
        )}
        {/* Smaller images */}
        {squares.slice(1, 3).map((sq) => (
          <motion.div
            key={sq.id}
            layout
            transition={{ duration: 1.5, type: "spring", stiffness: 45, damping: 15 }}
            className="relative overflow-hidden rounded-xl bg-stone-200 shadow-sm dark:bg-[#1f1f23]"
          >
            <Image
              src={sq.src}
              alt=""
              fill
              sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 200px"
              className="object-cover"
              quality={85}
            />
            <div className="absolute inset-0 bg-stone-900/0 transition-colors duration-300 hover:bg-stone-900/10" />
          </motion.div>
        ))}
      </div>
    );
  }

  // Standard grid layout with shuffle animation
  const gridTemplateColumns = `repeat(${layout.cols}, 1fr)`;
  const gridTemplateRows = `repeat(${layout.rows}, 1fr)`;

  return (
    <div
      className="h-[400px] gap-2 sm:h-[450px]"
      style={{
        display: "grid",
        gridTemplateColumns,
        gridTemplateRows,
      }}
    >
      {squares.map((sq) => (
        <motion.div
          key={sq.id}
          layout
          transition={{ duration: 1.5, type: "spring", stiffness: 45, damping: 15 }}
          className="relative h-full w-full overflow-hidden rounded-xl bg-stone-200 shadow-sm dark:bg-[#1f1f23]"
        >
          <Image
            src={sq.src}
            alt=""
            fill
            sizes={`(max-width: 640px) ${Math.round(100 / layout.cols)}vw, (max-width: 1024px) ${Math.round(50 / layout.cols)}vw, ${Math.round(600 / layout.cols)}px`}
            className="object-cover"
            quality={85}
          />
          <div className="absolute inset-0 bg-stone-900/0 transition-colors duration-300 hover:bg-stone-900/10" />
        </motion.div>
      ))}
    </div>
  );
}

export default LuminaHero;

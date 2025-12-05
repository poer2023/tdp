"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { MapPin, Briefcase, Aperture, Cpu } from "lucide-react";
import { getLocaleFromPathname } from "@/lib/i18n";
import Image from "next/image";

// Default hero images - can be replaced with actual data
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

// Shuffle Algorithm
function shuffle<T>(array: T[]): T[] {
  const newArray = [...array];
  let currentIndex = newArray.length;

  while (currentIndex !== 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    // Swap elements using temporary variable to avoid TypeScript issues
    const temp = newArray[currentIndex]!;
    newArray[currentIndex] = newArray[randomIndex]!;
    newArray[randomIndex] = temp;
  }

  return newArray;
}

// Shuffle Grid Component
function ShuffleGrid({ heroImages }: { heroImages: string[] }) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initialSquares = useMemo(() => {
    const needed = 16;
    const result: { id: number; src: string }[] = [];
    for (let i = 0; i < needed; i++) {
      const src = heroImages[i % heroImages.length];
      if (src) {
        result.push({ id: i, src });
      }
    }
    return result;
  }, [heroImages]);

  const [squares, setSquares] = useState(initialSquares);

  useEffect(() => {
    const shuffleSquares = () => {
      setSquares((prev) => shuffle(prev));
      timeoutRef.current = setTimeout(shuffleSquares, 3000);
    };

    shuffleSquares();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="grid h-[280px] grid-cols-3 grid-rows-4 gap-1.5 sm:h-[340px] sm:grid-cols-4 sm:gap-2 md:h-[420px]">
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
            sizes="(max-width: 640px) 25vw, (max-width: 1024px) 12.5vw, 120px"
            className="object-cover"
            quality={75}
          />
          <div className="absolute inset-0 bg-stone-900/0 transition-colors duration-300 hover:bg-stone-900/10" />
        </motion.div>
      ))}
    </div>
  );
}

export default LuminaHero;

"use client";

import Link from "next/link";
import { localePath } from "@/lib/locale-path";
import type { GalleryCategory } from "@/lib/gallery";

type Props = {
  locale: "zh" | "en";
  currentCategory?: GalleryCategory | null;
};

type CategoryTab = {
  value: GalleryCategory | null;
  label: { zh: string; en: string };
};

const categories: CategoryTab[] = [
  { value: null, label: { zh: "全部", en: "All" } },
  { value: "REPOST", label: { zh: "转发", en: "Repost" } },
  { value: "ORIGINAL", label: { zh: "拍照", en: "Original" } },
  { value: "AI", label: { zh: "AI", en: "AI" } },
];

export function GalleryCategoryTabs({ locale, currentCategory }: Props) {
  return (
    <nav
      className="flex items-center gap-6 border-b border-zinc-200 pb-3 dark:border-zinc-800"
      role="navigation"
      aria-label={locale === "zh" ? "相册分类" : "Gallery categories"}
    >
      {categories.map((cat) => {
        const isActive = currentCategory === cat.value;
        const href =
          cat.value === null
            ? localePath(locale, "/gallery")
            : localePath(locale, `/gallery?category=${cat.value}`);

        return (
          <Link
            key={cat.value ?? "all"}
            href={href}
            className={`text-sm font-medium transition-colors ${
              isActive
                ? "text-zinc-900 underline decoration-zinc-400 decoration-2 underline-offset-4 dark:text-zinc-50"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            {cat.label[locale]}
          </Link>
        );
      })}
    </nav>
  );
}

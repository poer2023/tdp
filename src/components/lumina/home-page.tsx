"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { LuminaHero } from "./hero";
import { LuminaFeed } from "./feed";
import type { FeedItem, FeedPost } from "./feed";
import { ProfileWidget, CompactStatusWidget } from "./side-widgets";
import { getLocaleFromPathname } from "@/lib/i18n";
import { localePath } from "@/lib/locale-path";

interface LuminaHomePageProps {
  feedItems: FeedItem[];
  heroImages?: string[];
  profileData?: {
    avatarUrl?: string;
    name?: string;
    title?: string;
    bio?: string;
  };
}

export function LuminaHomePage({ feedItems, heroImages, profileData }: LuminaHomePageProps) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = getLocaleFromPathname(pathname) ?? "en";

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      en: {
        "Designed with": "Designed with",
      },
      zh: {
        "Designed with": "用心设计",
      },
    };
    return translations[locale]?.[key] || key;
  };

  const handlePostClick = (post: FeedPost) => {
    // Navigate to post detail page
    router.push(localePath(locale, `/posts/${post.slug}`));
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-[#0a0a0b]">
      {/* Hero Section */}
      <LuminaHero heroImages={heroImages} />

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-12 lg:px-8">
        <div className="flex flex-col gap-12 lg:flex-row">
          {/* Left Column: Feed (2/3 width) */}
          <div className="w-full lg:w-2/3">
            <LuminaFeed
              initialItems={feedItems}
              onPostClick={handlePostClick}
            />
          </div>

          {/* Right Column: Widgets (1/3 width) - Sticky */}
          <div className="w-full lg:w-1/3">
            <div className="sticky top-24 space-y-6">
              {/* Profile Widget */}
              <ProfileWidget {...profileData} />

              {/* Compact Status Widget */}
              <CompactStatusWidget />

              {/* Footer Note */}
              <div className="border-t border-stone-200 pt-8 text-center text-xs text-stone-400 lg:text-left dark:border-[#27272a]">
                <p>{t("Designed with")} ❤️ & ☕</p>
                <p className="mt-1">© {new Date().getFullYear()} Zhi</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LuminaHomePage;

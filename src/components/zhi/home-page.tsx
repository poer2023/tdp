import React from "react";
import { ZhiHero, type HeroImageItem } from "./hero";
import { ZhiFeedWrapper } from "./feed-wrapper";
import type { FeedItem } from "./feed";
import { ProfileWidget, CompactStatusWidget } from "./side-widgets";
import type { PublicLocale } from "@/lib/locale-path";

interface StatusItem {
  label: string;
  value: string;
  icon: "zap" | "film" | "gamepad2" | "book" | "music" | "code";
  url?: string;
}

interface ZhiHomePageProps {
  feedItems: FeedItem[];
  heroImages?: HeroImageItem[];
  profileData?: {
    avatarUrl?: string;
    name?: string;
    title?: string;
    bio?: string;
  };
  statusData?: {
    items: StatusItem[];
    updatedAt: string;
  };
  locale: PublicLocale;
}

/**
 * Server Component: ZhiHomePage
 * Renders the homepage layout with Hero, Feed, and Widgets
 * Interactive parts are delegated to client components
 */
export function ZhiHomePage({
  feedItems,
  heroImages,
  profileData,
  statusData,
  locale
}: ZhiHomePageProps) {
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

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-[#0a0a0b]">
      {/* Hero Section */}
      <ZhiHero heroImages={heroImages} />

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-12 lg:px-8">
        <div className="flex flex-col gap-12 lg:flex-row">
          {/* Left Column: Feed (2/3 width) */}
          <div className="w-full lg:w-2/3">
            <ZhiFeedWrapper
              feedItems={feedItems}
              locale={locale}
            />
          </div>

          {/* Right Column: Widgets (1/3 width) - Sticky */}
          <div className="w-full lg:w-1/3">
            <div className="sticky top-24 space-y-6">
              {/* Profile Widget */}
              <ProfileWidget {...profileData} locale={locale} />

              {/* Compact Status Widget */}
              <CompactStatusWidget
                items={statusData?.items}
                updatedAt={statusData?.updatedAt}
                locale={locale}
              />

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

export default ZhiHomePage;

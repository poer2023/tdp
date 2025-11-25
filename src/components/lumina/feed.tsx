"use client";

import React, { useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import { Loader2, ArrowDown } from "lucide-react";
import { LuminaPostCard } from "./post-card";
import { LuminaMomentCard } from "./moment-card";
import { getLocaleFromPathname } from "@/lib/i18n";

export type FeedFilter = "All" | "Articles" | "Moments";

// Unified feed item types
export interface FeedPost {
  id: string;
  type: "article";
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  imageUrl?: string;
  tags: string[];
  likes: number;
  slug: string;
}

export interface FeedMoment {
  id: string;
  type: "moment";
  content: string;
  images?: string[];
  date: string;
  tags: string[];
  likes: number;
}

export type FeedItem = FeedPost | FeedMoment;

interface LuminaFeedProps {
  initialItems: FeedItem[];
  onPostClick?: (post: FeedPost) => void;
  onMomentClick?: (moment: FeedMoment) => void;
}

const ITEMS_PER_PAGE = 12;

export function LuminaFeed({ initialItems, onPostClick, onMomentClick }: LuminaFeedProps) {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname) ?? "en";

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      en: {
        All: "All",
        Articles: "Articles",
        Moments: "Moments",
        "Mixed Feed": "Mixed Feed",
        "No content found here yet.": "No content found here yet.",
        "Read More": "Read More",
      },
      zh: {
        All: "全部",
        Articles: "文章",
        Moments: "动态",
        "Mixed Feed": "综合内容",
        "No content found here yet.": "暂无内容",
        "Read More": "加载更多",
      },
    };
    return translations[locale]?.[key] || key;
  };

  const [feedFilter, setFeedFilter] = useState<FeedFilter>("All");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Filter items based on current filter
  const filteredItems = useMemo(() => {
    if (feedFilter === "All") return initialItems;
    if (feedFilter === "Articles") return initialItems.filter((item) => item.type === "article");
    if (feedFilter === "Moments") return initialItems.filter((item) => item.type === "moment");
    return initialItems;
  }, [feedFilter, initialItems]);

  // Get visible items for pagination
  const visibleItems = useMemo(() => {
    return filteredItems.slice(0, visibleCount);
  }, [filteredItems, visibleCount]);

  const hasMore = visibleCount < filteredItems.length;

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
      setIsLoadingMore(false);
    }, 600);
  };

  // Reset pagination when filter changes
  React.useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [feedFilter]);

  return (
    <div className="w-full">
      {/* Sticky Filter Bar */}
      <div className="sticky top-16 z-30 -mx-4 mb-8 bg-stone-50/95 px-4 py-4 backdrop-blur-sm transition-colors md:mx-0 md:px-0 dark:bg-stone-950/95">
        <div className="flex items-center justify-between">
          {/* Filter Pills */}
          <div className="flex max-w-full overflow-x-auto rounded-full border border-stone-200 bg-white p-1 shadow-sm dark:border-stone-800 dark:bg-stone-900">
            {(["All", "Articles", "Moments"] as FeedFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setFeedFilter(filter)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  feedFilter === filter
                    ? "bg-stone-800 text-white shadow-md dark:bg-stone-100 dark:text-stone-900"
                    : "text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
                }`}
              >
                {t(filter)}
              </button>
            ))}
          </div>
          <span className="hidden border-b border-stone-200 pb-1 text-xs font-bold uppercase tracking-widest text-stone-400 sm:block dark:border-stone-800">
            {t(feedFilter === "All" ? "Mixed Feed" : feedFilter)}
          </span>
        </div>
      </div>

      {/* Feed Content - Masonry Layout */}
      <div className="mb-12 columns-1 gap-8 space-y-8 md:columns-2">
        {visibleItems.map((item) => (
          <React.Fragment key={item.id}>
            {item.type === "article" ? (
              <LuminaPostCard
                post={{
                  id: item.id,
                  title: item.title,
                  excerpt: item.excerpt,
                  category: item.category,
                  date: item.date,
                  readTime: item.readTime,
                  imageUrl: item.imageUrl,
                  tags: item.tags,
                  likes: item.likes,
                }}
                onClick={() => onPostClick?.(item)}
              />
            ) : (
              <LuminaMomentCard
                moment={{
                  id: item.id,
                  content: item.content,
                  images: item.images,
                  date: item.date,
                  tags: item.tags,
                  likes: item.likes,
                }}
                onClick={() => onMomentClick?.(item)}
              />
            )}
          </React.Fragment>
        ))}

        {visibleItems.length === 0 && (
          <div className="col-span-full break-inside-avoid rounded-xl border border-dashed border-stone-200 bg-white py-20 text-center transition-colors dark:border-stone-800 dark:bg-stone-900">
            <p className="text-stone-400">{t("No content found here yet.")}</p>
          </div>
        )}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center pb-8">
          <button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="group flex items-center gap-2 rounded-full border border-stone-200 bg-white px-8 py-3 font-medium text-stone-600 shadow-sm transition-all hover:border-sage-400 hover:text-sage-600 hover:shadow-md disabled:opacity-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 dark:hover:text-sage-400"
          >
            {isLoadingMore ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <ArrowDown size={18} className="transition-transform group-hover:translate-y-1" />
            )}
            {isLoadingMore ? "Loading..." : t("Read More")}
          </button>
        </div>
      )}
    </div>
  );
}

export default LuminaFeed;

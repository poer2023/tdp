"use client";

import React, { useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import { Loader2, ArrowDown } from "lucide-react";
import { LuminaPostCard } from "./post-card";
import { LuminaMomentCard } from "./moment-card";
import { LuminaMomentDetail } from "./moment-detail";
import { LuminaShareCard } from "./share-card";
import { getLocaleFromPathname } from "@/lib/i18n";

export type FeedFilter = "All" | "Articles" | "Moments" | "Curated";

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
  sortKey?: number;
}

export interface FeedMoment {
  id: string;
  type: "moment";
  content: string;
  images?: string[];
  date: string;
  tags: string[];
  likes: number;
  liked?: boolean;
  author?: { name: string | null; image: string | null };
  sortKey?: number;
}

export interface FeedCurated {
  id: string;
  type: "curated";
  title: string;
  description: string;
  url: string;
  domain: string;
  imageUrl?: string;
  date: string;
  tags: string[];
  likes: number;
  sortKey?: number;
}

export type FeedItem = FeedPost | FeedMoment | FeedCurated;

interface LuminaFeedProps {
  initialItems: FeedItem[];
  onPostClick?: (post: FeedPost) => void;
  onMomentLike?: (id: string) => Promise<void> | void;
}

const ITEMS_PER_PAGE = 12;

export function LuminaFeed({ initialItems, onPostClick, onMomentLike }: LuminaFeedProps) {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname) ?? "en";

  // Modal state for moment detail
  const [selectedMoment, setSelectedMoment] = useState<FeedMoment | null>(null);
  const [items, setItems] = useState<FeedItem[]>(initialItems);

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      en: {
        All: "All",
        Articles: "Articles",
        Moments: "Moments",
        Curated: "Curated",
        "Mixed Feed": "Mixed Feed",
        "No content found here yet.": "No content found here yet.",
        "Read More": "Read More",
      },
      zh: {
        All: "全部",
        Articles: "文章",
        Moments: "动态",
        Curated: "精选",
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

  // Keep items in sync if server data changes
  React.useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  // Filter items based on current filter
  const filteredItems = useMemo(() => {
    if (feedFilter === "All") return items;
    if (feedFilter === "Articles") return items.filter((item) => item.type === "article");
    if (feedFilter === "Moments") return items.filter((item) => item.type === "moment");
    if (feedFilter === "Curated") return items.filter((item) => item.type === "curated");
    return items;
  }, [feedFilter, items]);

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

  // Handle moment like with server API + local state sync
  const handleMomentLike = async (id: string) => {
    try {
      const res = await fetch(`/api/moments/${id}/likes`, { method: "POST" });
      if (!res.ok) throw new Error(`Failed to toggle like: ${res.status}`);
      const data = await res.json();

      setItems((prev) =>
        prev.map((item) =>
          item.type === "moment" && item.id === id
            ? { ...item, likes: data.likeCount ?? item.likes, liked: data.liked ?? item.liked }
            : item
        )
      );

      setSelectedMoment((prev) =>
        prev && prev.id === id
          ? { ...prev, likes: data.likeCount ?? prev.likes, liked: data.liked ?? prev.liked }
          : prev
      );

      await onMomentLike?.(id);
      return data;
    } catch (error) {
      console.error("[Moment like] error", error);
    }
  };

  // Handle article like with server API + optimistic update
  const handlePostLike = async (id: string) => {
    // Find the post to get its slug
    const post = items.find((item) => item.type === "article" && item.id === id) as FeedPost | undefined;
    if (!post) return;

    // Optimistic update
    setItems((prev) =>
      prev.map((item) =>
        item.type === "article" && item.id === id
          ? { ...item, likes: item.likes + 1 }
          : item
      )
    );

    try {
      const res = await fetch(`/api/posts/${post.slug}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: locale.toUpperCase() }),
      });

      if (!res.ok) {
        // Rollback on error
        setItems((prev) =>
          prev.map((item) =>
            item.type === "article" && item.id === id
              ? { ...item, likes: item.likes - 1 }
              : item
          )
        );
        throw new Error(`Failed to like post: ${res.status}`);
      }

      const data = await res.json();

      // Update with actual server count
      setItems((prev) =>
        prev.map((item) =>
          item.type === "article" && item.id === id
            ? { ...item, likes: data.likeCount ?? item.likes }
            : item
        )
      );
    } catch (error) {
      console.error("[Post like] error", error);
    }
  };

  return (
    <>
      {/* Moment Detail Modal */}
      {selectedMoment && (
        <LuminaMomentDetail
          moment={selectedMoment}
          onClose={() => setSelectedMoment(null)}
          onLike={handleMomentLike}
        />
      )}

      <div className="w-full">
        {/* Sticky Filter Bar */}
        <div className="sticky top-[calc(4rem+env(safe-area-inset-top))] z-30 -mx-4 mb-8 px-4 py-4 md:top-16 md:mx-0 md:px-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Filter Pills */}
            <div className="flex w-full max-w-full overflow-x-auto rounded-full border border-stone-200 bg-white p-1 shadow-sm dark:border-[#2a2a2e] dark:bg-[#18181b] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)] sm:w-auto">
              {(["All", "Articles", "Moments", "Curated"] as FeedFilter[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setFeedFilter(filter)}
                  className={`cursor-pointer whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all ${feedFilter === filter
                    ? "bg-stone-800 text-white shadow-md dark:bg-[#3f3f46] dark:text-stone-100"
                    : "text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
                    }`}
                >
                  {t(filter)}
                </button>
              ))}
            </div>
            <span className="hidden border-b border-stone-200 pb-1 text-xs font-bold uppercase tracking-widest text-stone-400 sm:block dark:border-[#2a2a2e]">
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
                  onLike={handlePostLike}
                />
              ) : item.type === "moment" ? (
                <LuminaMomentCard
                  moment={{
                    id: item.id,
                    content: item.content,
                    images: item.images,
                    date: item.date,
                    tags: item.tags,
                    likes: item.likes,
                    liked: item.liked,
                  }}
                  onClick={() => setSelectedMoment(item)}
                  onLike={() => handleMomentLike(item.id)}
                />
              ) : (
                <LuminaShareCard
                  item={{
                    id: item.id,
                    title: item.title,
                    description: item.description,
                    url: item.url,
                    domain: item.domain,
                    imageUrl: item.imageUrl,
                    date: item.date,
                    tags: item.tags,
                    likes: item.likes,
                  }}
                />
              )}
            </React.Fragment>
          ))}

          {visibleItems.length === 0 && (
            <div className="col-span-full break-inside-avoid rounded-xl border border-dashed border-stone-200 bg-white py-20 text-center transition-colors dark:border-[#27272a] dark:bg-[#141416]">
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
              className="group flex cursor-pointer items-center gap-2 rounded-full border border-stone-200 bg-white px-8 py-3 font-medium text-stone-600 shadow-sm transition-all hover:border-sage-400 hover:text-sage-600 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#27272a] dark:bg-[#141416] dark:text-stone-300 dark:hover:border-sage-700 dark:hover:text-sage-400"
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
    </>
  );
}

export default LuminaFeed;

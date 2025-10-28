"use client";

import { useState } from "react";
import type { Friend } from "@prisma/client";
import { MomentCard } from "@/components/moments/moment-card";
import type { MomentImage } from "@/lib/moments";
import { VisibilityBadge } from "./VisibilityBadge";

export interface FriendMoment {
  id: string;
  content: string;
  images: unknown | null;
  friendVisibility: "PUBLIC" | "FRIEND_ONLY" | "PRIVATE";
  happenedAt: string | null;
  createdAt: string;
  location: unknown | null;
  tags: string[];
  author: {
    id: string;
    name: string | null;
  };
}

interface FriendMomentTimelineProps {
  friend: Pick<Friend, "id" | "name" | "slug">;
  locale: "en" | "zh";
  initialMoments: FriendMoment[];
  nextCursor: string | null;
  hasMore: boolean;
}

function mapImages(images: unknown): MomentImage[] {
  if (!images || !Array.isArray(images)) return [];
  return images as MomentImage[];
}

function getLocationName(location: unknown): string | null {
  if (!location || typeof location !== "object") return null;
  const maybe = location as { name?: string };
  return typeof maybe.name === "string" ? maybe.name : null;
}

export function FriendMomentTimeline({
  friend,
  locale,
  initialMoments,
  nextCursor,
  hasMore,
}: FriendMomentTimelineProps) {
  const [moments, setMoments] = useState<FriendMoment[]>(initialMoments);
  const [cursor, setCursor] = useState<string | null>(nextCursor);
  const [more, setMore] = useState<boolean>(hasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMore = async () => {
    if (!more || loading || !cursor) return;
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("cursor", cursor);
      params.set("limit", "10");
      params.set("locale", locale);

      const res = await fetch(`/api/friends/${friend.slug}/moments?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to load moments: ${res.status}`);
      }
      const data = (await res.json()) as {
        moments: FriendMoment[];
        nextCursor: string | null;
        hasMore: boolean;
      };

      setMoments((prev) => [...prev, ...data.moments]);
      setCursor(data.nextCursor);
      setMore(data.hasMore);
    } catch (err) {
      console.error("加载更多朋友故事失败", err);
      setError(locale === "zh" ? "加载失败，请稍后再试。" : "Failed to load more stories.");
    } finally {
      setLoading(false);
    }
  };

  if (moments.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-zinc-200/70 bg-white/60 px-6 py-12 text-center text-sm text-zinc-500 dark:border-zinc-800/60 dark:bg-zinc-900/60">
        {locale === "zh" ? "还没有故事呢，稍后再来看看。" : "No stories yet. Come back soon."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {moments.map((moment) => {
        const locationName = getLocationName(moment.location);
        return (
          <div key={moment.id} className="relative" data-testid="friend-moment-card">
            <div className="absolute top-4 right-4 z-10">
              <VisibilityBadge visibility={moment.friendVisibility} locale={locale} />
            </div>
            <MomentCard
              id={moment.id}
              slug={null}
              content={moment.content}
              images={mapImages(moment.images)}
              createdAt={moment.happenedAt ?? moment.createdAt}
              visibility="PUBLIC"
              tags={moment.tags}
              locationName={locationName}
              locale={locale}
            />
          </div>
        );
      })}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {more ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="rounded-full bg-blue-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? locale === "zh"
                ? "加载中..."
                : "Loading..."
              : locale === "zh"
                ? "加载更多故事"
                : "Load more stories"}
          </button>
        </div>
      ) : (
        <p className="py-6 text-center text-xs text-zinc-400">
          {locale === "zh" ? "已经到底了" : "You reached the end."}
        </p>
      )}
    </div>
  );
}

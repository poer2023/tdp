"use client";

import Image from "next/image";
import { Star, Clock, TrendingUp } from "lucide-react";
import type { JellyfinItem } from "@/types/live-data";

interface MoviePosterCardProps {
  item: JellyfinItem;
}

export function MoviePosterCard({ item }: MoviePosterCardProps) {
  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  };

  // Determine if the item has a valid URL
  const hasUrl = item.url && item.url !== "#";

  const CardWrapper = hasUrl ? "a" : "div";
  const wrapperProps = hasUrl
    ? {
        href: item.url,
        target: "_blank",
        rel: "noopener noreferrer",
      }
    : {};

  return (
    <CardWrapper
      className="group relative block overflow-hidden rounded-xl bg-neutral-100 transition-transform hover:scale-[1.02] dark:bg-neutral-900"
      {...wrapperProps}
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] overflow-hidden bg-neutral-200 dark:bg-neutral-800">
        {item.poster ? (
          <Image
            src={item.poster}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl">
            {item.type === "movie" ? "🎬" : "📺"}
          </div>
        )}
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      {/* Info */}
      <div className="absolute right-0 bottom-0 left-0 translate-y-6 p-4 transition-transform group-hover:translate-y-0">
        <h3 className="mb-2 font-semibold text-white drop-shadow-lg">{item.title}</h3>

        <div className="flex items-center gap-3 text-sm text-neutral-300">
          {/* Rating */}
          {item.rating && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
              <span>
                {"★".repeat(item.rating)}
                {"☆".repeat(5 - item.rating)}
              </span>
            </div>
          )}

          {/* Date */}
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{formatDate(item.watchedAt)}</span>
          </div>
        </div>

        {/* Series progress */}
        {item.type === "series" && item.progress !== undefined && (
          <div className="mt-2">
            <div className="flex items-center gap-2 text-xs text-neutral-300">
              <TrendingUp className="h-3 w-3" />
              <span>
                S{item.season?.toString().padStart(2, "0")}E
                {item.episode?.toString().padStart(2, "0")} • {item.progress}%
              </span>
            </div>
            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-neutral-700">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${item.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </CardWrapper>
  );
}

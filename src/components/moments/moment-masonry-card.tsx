"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, MapPin, Tag, Eye, EyeOff } from "lucide-react";
import type { MomentListItem, MomentImage } from "@/lib/moments";

type MomentWithMasonryData = MomentListItem & {
  isPublic: boolean;
  location: string | null;
};

interface MomentMasonryCardProps {
  moment: MomentWithMasonryData;
  locale: "zh" | "en";
  onDelete?: (id: string) => void;
  isAdmin?: boolean;
}

function formatMomentDate(date: Date, locale: "zh" | "en"): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (locale === "zh") {
    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } else {
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
}

export function MomentMasonryCard({
  moment,
  locale,
  onDelete,
  isAdmin = false,
}: MomentMasonryCardProps) {
  const hasImages = moment.images && moment.images.length > 0;
  const firstImage = hasImages ? moment.images[0] : null;
  const hasContent = moment.content && moment.content.trim().length > 50;

  // Determine card type
  const cardType = hasImages ? (hasContent ? "image-text" : "image-only") : "text-only";

  const cardLink = moment.slug
    ? `/${locale}/m/${moment.slug}`
    : `/${locale}/m#${moment.id}`;

  // Image-only card: pure image with minimal overlay
  if (cardType === "image-only" && firstImage) {
    return (
      <Link
        href={cardLink}
        className="group relative block overflow-hidden rounded-lg bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 dark:bg-zinc-900"
      >
        <div className="relative aspect-[4/3]">
          <Image
            src={firstImage.previewUrl || firstImage.url}
            alt={moment.content?.slice(0, 50) || "Moment image"}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />

          {/* Overlay with meta info */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
              <div className="flex items-center gap-2 text-xs">
                <Clock className="h-3 w-3" />
                <span>{formatMomentDate(moment.createdAt, locale)}</span>
              </div>
            </div>
          </div>

          {/* Visibility indicator */}
          {!moment.isPublic && (
            <div className="absolute top-2 right-2 rounded-full bg-black/50 p-1.5 backdrop-blur-sm">
              <EyeOff className="h-3 w-3 text-white" />
            </div>
          )}
        </div>
      </Link>
    );
  }

  // Image + Text card: image on top, content below
  if (cardType === "image-text" && firstImage) {
    return (
      <div className="group relative overflow-hidden rounded-lg bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 dark:bg-zinc-900">
        <Link href={cardLink} className="block">
          <div className="relative aspect-[4/3]">
            <Image
              src={firstImage.previewUrl || firstImage.url}
              alt={moment.content?.slice(0, 50) || "Moment image"}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>

          <div className="p-4">
            <p className="mb-3 line-clamp-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {moment.content}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatMomentDate(moment.createdAt, locale)}</span>
              </div>

              {moment.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{moment.location}</span>
                </div>
              )}

              {!moment.isPublic && (
                <div className="flex items-center gap-1">
                  <EyeOff className="h-3 w-3" />
                  <span>{locale === "zh" ? "私密" : "Private"}</span>
                </div>
              )}
            </div>

            {moment.tags && moment.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {moment.tags.slice(0, 3).map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                  >
                    <Tag className="h-2.5 w-2.5" />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Link>
      </div>
    );
  }

  // Text-only card: colored background with text content
  return (
    <Link
      href={cardLink}
      className="group block overflow-hidden rounded-lg shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 dark:from-blue-900/20 dark:to-purple-900/20">
        <p className="mb-4 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          {moment.content}
        </p>

        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formatMomentDate(moment.createdAt, locale)}</span>
          </div>

          {moment.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{moment.location}</span>
            </div>
          )}

          {!moment.isPublic && (
            <div className="flex items-center gap-1">
              <EyeOff className="h-3 w-3" />
              <span>{locale === "zh" ? "私密" : "Private"}</span>
            </div>
          )}
        </div>

        {moment.tags && moment.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {moment.tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-full bg-white/60 px-2 py-0.5 text-xs text-zinc-700 backdrop-blur-sm dark:bg-zinc-800/60 dark:text-zinc-300"
              >
                <Tag className="h-2.5 w-2.5" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

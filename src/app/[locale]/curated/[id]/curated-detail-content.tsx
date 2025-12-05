"use client";

/* eslint-disable @next/next/no-img-element */

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Heart,
  Link2,
  Calendar,
  Share2,
  Copy,
  Check,
} from "lucide-react";
import { localePath } from "@/lib/locale-path";

interface CuratedItem {
  id: string;
  title: string;
  description: string;
  url: string;
  domain: string;
  imageUrl?: string;
  tags: string[];
  likes: number;
  createdAt: string;
}

interface CuratedDetailContentProps {
  item: CuratedItem;
  relatedItems: CuratedItem[];
  locale: "en" | "zh";
}

export default function CuratedDetailContent({
  item,
  relatedItems,
  locale,
}: CuratedDetailContentProps) {
  const router = useRouter();
  const [copied, setCopied] = React.useState(false);
  const [liked, setLiked] = React.useState(false);
  const [likeCount, setLikeCount] = React.useState(item.likes);

  const t = {
    back: locale === "zh" ? "返回" : "Back",
    visitSite: locale === "zh" ? "访问原站" : "Visit Site",
    share: locale === "zh" ? "分享" : "Share",
    copyLink: locale === "zh" ? "复制链接" : "Copy Link",
    copied: locale === "zh" ? "已复制" : "Copied",
    relatedPicks: locale === "zh" ? "相关精选" : "Related Picks",
    noRelated: locale === "zh" ? "暂无相关内容" : "No related content",
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error("Failed to copy link");
    }
  };

  const handleLike = async () => {
    // Optimistic update
    setLiked(!liked);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));

    // TODO: Implement actual like API
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="group mb-8 flex cursor-pointer items-center gap-2 text-sm text-stone-500 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
      >
        <ArrowLeft
          size={16}
          className="transition-transform group-hover:-translate-x-1"
        />
        {t.back}
      </button>

      {/* Main Content Card */}
      <article className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900">
        {/* Hero Image */}
        {item.imageUrl ? (
          <div className="relative h-64 w-full overflow-hidden sm:h-80">
            <img
              src={item.imageUrl}
              alt={item.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 font-mono text-xs text-stone-700 backdrop-blur-sm dark:bg-black/70 dark:text-stone-300">
                <Link2 size={12} />
                {item.domain}
              </div>
            </div>
          </div>
        ) : (
          <div className="relative flex h-48 items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-900">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(#888 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />
            <ExternalLink
              className="text-stone-300 dark:text-stone-600"
              size={64}
            />
            <div className="absolute bottom-4 left-4 flex items-center gap-1 rounded-full border border-stone-300 bg-white/80 px-3 py-1.5 font-mono text-xs text-stone-600 backdrop-blur-sm dark:border-stone-600 dark:bg-black/50 dark:text-stone-400">
              <Link2 size={12} />
              {item.domain}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 sm:p-8">
          {/* Title */}
          <h1 className="mb-4 text-2xl font-bold leading-tight text-stone-900 sm:text-3xl dark:text-stone-100">
            {item.title}
          </h1>

          {/* Meta Info */}
          <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-stone-500 dark:text-stone-400">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} />
              {formatDate(item.createdAt)}
            </div>
            <div className="flex items-center gap-1.5">
              <Heart size={14} className={likeCount > 0 ? "text-rose-500" : ""} />
              {likeCount} {locale === "zh" ? "喜欢" : "likes"}
            </div>
          </div>

          {/* Description */}
          <div className="mb-8 text-base leading-relaxed text-stone-600 dark:text-stone-300">
            <p className="whitespace-pre-wrap">{item.description}</p>
          </div>

          {/* Tags */}
          {item.tags.length > 0 && (
            <div className="mb-8 flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-stone-100 px-3 py-1 text-sm text-stone-600 dark:bg-stone-800 dark:text-stone-400"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 border-t border-stone-100 pt-6 dark:border-stone-800">
            {/* Visit Site Button */}
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex cursor-pointer items-center gap-2 rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
              >
                <ExternalLink size={16} />
                {t.visitSite}
              </a>
            )}

            {/* Like Button */}
            <button
              onClick={handleLike}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                liked
                  ? "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-400"
                  : "border-stone-200 bg-white text-stone-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:border-rose-800 dark:hover:bg-rose-900/30 dark:hover:text-rose-400"
              }`}
            >
              <Heart size={16} className={liked ? "fill-current" : ""} />
              {liked ? (locale === "zh" ? "已喜欢" : "Liked") : (locale === "zh" ? "喜欢" : "Like")}
            </button>

            {/* Copy Link Button */}
            <button
              onClick={handleCopyLink}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-600 transition-all hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
            >
              {copied ? (
                <>
                  <Check size={16} className="text-emerald-500" />
                  {t.copied}
                </>
              ) : (
                <>
                  <Copy size={16} />
                  {t.copyLink}
                </>
              )}
            </button>

            {/* Native Share Button (if supported) */}
            {typeof navigator !== "undefined" && navigator.share && (
              <button
                onClick={() => {
                  navigator.share({
                    title: item.title,
                    text: item.description,
                    url: window.location.href,
                  });
                }}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-600 transition-all hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
              >
                <Share2 size={16} />
                {t.share}
              </button>
            )}
          </div>
        </div>
      </article>

      {/* Related Items */}
      {relatedItems.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-6 text-xl font-bold text-stone-900 dark:text-stone-100">
            {t.relatedPicks}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {relatedItems.map((relItem) => (
              <Link
                key={relItem.id}
                href={localePath(locale, `/curated/${relItem.id}`)}
                className="group cursor-pointer overflow-hidden rounded-xl border border-stone-200 bg-white transition-all hover:shadow-md dark:border-stone-800 dark:bg-stone-900"
              >
                <div className="flex">
                  {/* Thumbnail */}
                  {relItem.imageUrl ? (
                    <div className="h-24 w-24 flex-shrink-0 overflow-hidden">
                      <img
                        src={relItem.imageUrl}
                        alt={relItem.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center bg-stone-100 dark:bg-stone-800">
                      <Link2 className="text-stone-400" size={20} />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex flex-1 flex-col justify-center p-4">
                    <h3 className="mb-1 line-clamp-1 font-semibold text-stone-800 transition-colors group-hover:text-sage-600 dark:text-stone-200 dark:group-hover:text-sage-400">
                      {relItem.title}
                    </h3>
                    <p className="line-clamp-1 text-sm text-stone-500 dark:text-stone-400">
                      {relItem.description}
                    </p>
                    <div className="mt-2 flex items-center gap-1 text-xs text-stone-400">
                      <Link2 size={10} />
                      {relItem.domain}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}


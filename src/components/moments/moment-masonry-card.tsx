"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, MapPin, Tag, Eye, EyeOff } from "lucide-react";
import type { MomentListItem, MomentImage } from "@/lib/moments";
import { MultiImageGrid } from "./multi-image-grid";

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

// ==================== 工具函数 ====================

/**
 * 简单哈希函数：将字符串转换为数字
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * 智能图片比例计算
 * 支持常见比例，对极端比例进行裁剪
 */
function getImageAspectRatio(image: MomentImage): string {
  const width = image.w || 1;
  const height = image.h || 1;
  const ratio = width / height;

  // 极端宽图裁剪为 16:9
  if (ratio > 2) return "aspect-[16/9]";

  // 极端高图裁剪为 3:4
  if (ratio < 0.5) return "aspect-[3/4]";

  // 常见比例检测 (允许 10% 误差)
  if (Math.abs(ratio - 1) < 0.1) return "aspect-square";
  if (Math.abs(ratio - 4 / 3) < 0.1) return "aspect-[4/3]";
  if (Math.abs(ratio - 3 / 4) < 0.1) return "aspect-[3/4]";
  if (Math.abs(ratio - 16 / 9) < 0.1) return "aspect-[16/9]";
  if (Math.abs(ratio - 9 / 16) < 0.1) return "aspect-[9/16]";

  // 保持原始比例
  return `aspect-[${width}/${height}]`;
}

/**
 * 设计系统常量
 */
const CARD_SHADOW = "shadow-[0_4px_10px_rgba(0,0,0,0.1)]";
const CARD_SHADOW_HOVER = "hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)]";
const CARD_HOVER_TRANSFORM = "hover:-translate-y-0.5 hover:scale-[1.02]";
const CARD_CLICK_STATE = "active:scale-[0.98]";
const CARD_TRANSITION = "transition-all duration-300";

/**
 * 颜色方案定义
 */
type ColorScheme = {
  bg: string;
  text: string;
  border?: string;
};

const COLOR_SCHEMES: Record<string, ColorScheme> = {
  white: {
    bg: "bg-white dark:bg-zinc-900",
    text: "text-zinc-900 dark:text-zinc-100",
    border: "border border-zinc-200 dark:border-zinc-800",
  },
  blue: {
    bg: "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30",
    text: "text-zinc-800 dark:text-zinc-200",
  },
  purple: {
    bg: "bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30",
    text: "text-zinc-800 dark:text-zinc-200",
  },
  green: {
    bg: "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30",
    text: "text-zinc-800 dark:text-zinc-200",
  },
  orange: {
    bg: "bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30",
    text: "text-zinc-800 dark:text-zinc-200",
  },
  pink: {
    bg: "bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30",
    text: "text-zinc-800 dark:text-zinc-200",
  },
  cyan: {
    bg: "bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-cyan-950/30 dark:to-sky-950/30",
    text: "text-zinc-800 dark:text-zinc-200",
  },
  yellow: {
    bg: "bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30",
    text: "text-zinc-800 dark:text-zinc-200",
  },
  gray: {
    bg: "bg-gradient-to-br from-zinc-50 to-slate-50 dark:from-zinc-900/30 dark:to-slate-900/30",
    text: "text-zinc-800 dark:text-zinc-200",
  },
};

const COLOR_SCHEME_KEYS = Object.keys(COLOR_SCHEMES);

/**
 * 根据 moment.id 选择颜色方案
 */
function getColorScheme(momentId: string): ColorScheme {
  const hash = hashString(momentId);
  const index = hash % COLOR_SCHEME_KEYS.length;
  const key = COLOR_SCHEME_KEYS[index]!;
  return COLOR_SCHEMES[key]!;
}

/**
 * 格式化日期
 */
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

// ==================== 主组件 ====================

export function MomentMasonryCard({
  moment,
  locale,
  onDelete,
  isAdmin = false,
}: MomentMasonryCardProps) {
  const hasImages = moment.images && moment.images.length > 0;
  const firstImage = hasImages ? moment.images[0] : null;
  const hasContent = moment.content && moment.content.trim().length > 0;
  const imageCount = moment.images?.length || 0;

  // Determine card type: distinguish single-image vs multi-image
  const cardType = hasImages
    ? imageCount === 1
      ? hasContent
        ? "image-text"
        : "image-only"
      : hasContent
      ? "multi-image-text"
      : "multi-image-only"
    : "text-only";

  const cardLink = moment.slug
    ? `/${locale}/m/${moment.slug}`
    : `/${locale}/m#${moment.id}`;

  // ==================== 纯图片卡片 ====================
  if (cardType === "image-only" && firstImage) {
    const aspectRatio = getImageAspectRatio(firstImage);

    return (
      <Link
        href={cardLink}
        onClick={(e) => {
          e.preventDefault();
          // Open lightbox for image preview
          window.dispatchEvent(new CustomEvent('open-moment-lightbox', {
            detail: { images: moment.images, initialIndex: 0 }
          }));
        }}
        className={`group relative block overflow-hidden rounded-[10px] ${CARD_SHADOW} ${CARD_SHADOW_HOVER} ${CARD_TRANSITION} ${CARD_HOVER_TRANSFORM} ${CARD_CLICK_STATE}`}
      >
        <div className={`relative ${aspectRatio}`}>
          <Image
            src={firstImage.previewUrl || firstImage.url}
            alt={moment.content?.slice(0, 50) || "Moment image"}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          {/* Overlay with meta info - 悬停时显示 */}
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

  // ==================== 纯多图卡片 ====================
  if (cardType === "multi-image-only" && moment.images) {
    return (
      <div className={`group relative overflow-hidden rounded-[10px] ${CARD_SHADOW} ${CARD_SHADOW_HOVER} ${CARD_TRANSITION} ${CARD_HOVER_TRANSFORM} ${CARD_CLICK_STATE}`}>
        <MultiImageGrid
          images={moment.images}
          onImageClick={(index) => {
            window.dispatchEvent(new CustomEvent('open-moment-lightbox', {
              detail: { images: moment.images, initialIndex: index }
            }));
          }}
        />

        {/* Visibility indicator */}
        {!moment.isPublic && (
          <div className="absolute top-2 right-2 rounded-full bg-black/50 p-1.5 backdrop-blur-sm">
            <EyeOff className="h-3 w-3 text-white" />
          </div>
        )}
      </div>
    );
  }

  // ==================== 多图文混合卡片 ====================
  if (cardType === "multi-image-text" && moment.images) {
    return (
      <div className={`group relative overflow-hidden rounded-[10px] bg-white dark:bg-zinc-900 ${CARD_SHADOW} ${CARD_SHADOW_HOVER} ${CARD_TRANSITION} ${CARD_HOVER_TRANSFORM} ${CARD_CLICK_STATE}`}>
        {/* 多图网格区域 - 无内边距 */}
        <MultiImageGrid
          images={moment.images}
          onImageClick={(index) => {
            window.dispatchEvent(new CustomEvent('open-moment-lightbox', {
              detail: { images: moment.images, initialIndex: index }
            }));
          }}
        />

        <Link href={cardLink} className="block">
          {/* 文字区域 - 16px mobile / 24px desktop 内边距 */}
          <div className="p-4 md:p-6">
            <p className="mb-3 line-clamp-3 text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
              {moment.content}
            </p>

            {/* 元数据 */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>{formatMomentDate(moment.createdAt, locale)}</span>
              </div>

              {moment.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate">{moment.location}</span>
                </div>
              )}

              {!moment.isPublic && (
                <div className="flex items-center gap-1">
                  <EyeOff className="h-3.5 w-3.5" />
                  <span>{locale === "zh" ? "私密" : "Private"}</span>
                </div>
              )}
            </div>

            {/* 标签 */}
            {moment.tags && moment.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {moment.tags.slice(0, 3).map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
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

  // ==================== 图文混合卡片 ====================
  if (cardType === "image-text" && firstImage) {
    const aspectRatio = getImageAspectRatio(firstImage);

    return (
      <div className={`group relative overflow-hidden rounded-[10px] bg-white dark:bg-zinc-900 ${CARD_SHADOW} ${CARD_SHADOW_HOVER} ${CARD_TRANSITION} ${CARD_HOVER_TRANSFORM} ${CARD_CLICK_STATE}`}>
        {/* 图片区域 - 无内边距 */}
        <div
          className={`relative ${aspectRatio} cursor-pointer`}
          onClick={(e) => {
            e.stopPropagation();
            // Open lightbox for image preview
            window.dispatchEvent(new CustomEvent('open-moment-lightbox', {
              detail: { images: moment.images, initialIndex: 0 }
            }));
          }}
        >
          <Image
            src={firstImage.previewUrl || firstImage.url}
            alt={moment.content?.slice(0, 50) || "Moment image"}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </div>

        <Link href={cardLink} className="block">

          {/* 文字区域 - 16px mobile / 24px desktop 内边距 */}
          <div className="p-4 md:p-6">
            <p className="mb-3 line-clamp-3 text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
              {moment.content}
            </p>

            {/* 元数据 */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>{formatMomentDate(moment.createdAt, locale)}</span>
              </div>

              {moment.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate">{moment.location}</span>
                </div>
              )}

              {!moment.isPublic && (
                <div className="flex items-center gap-1">
                  <EyeOff className="h-3.5 w-3.5" />
                  <span>{locale === "zh" ? "私密" : "Private"}</span>
                </div>
              )}
            </div>

            {/* 标签 */}
            {moment.tags && moment.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {moment.tags.slice(0, 3).map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
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

  // ==================== 纯文字卡片 ====================
  const colorScheme = getColorScheme(moment.id);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        // Open text lightbox instead of navigating
        window.dispatchEvent(new CustomEvent('open-text-lightbox', {
          detail: { text: moment.content }
        }));
      }}
      className={`group block cursor-pointer overflow-hidden rounded-[10px] ${CARD_SHADOW} ${CARD_SHADOW_HOVER} ${CARD_TRANSITION} ${CARD_HOVER_TRANSFORM} ${CARD_CLICK_STATE}`}
    >
      <div className={`p-4 md:p-5 ${colorScheme.bg} ${colorScheme.border || ""}`}>
        <p className={`mb-4 text-base leading-relaxed ${colorScheme.text}`}>
          {moment.content}
        </p>

        {/* 元数据 */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatMomentDate(moment.createdAt, locale)}</span>
          </div>

          {moment.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate">{moment.location}</span>
            </div>
          )}

          {!moment.isPublic && (
            <div className="flex items-center gap-1">
              <EyeOff className="h-3.5 w-3.5" />
              <span>{locale === "zh" ? "私密" : "Private"}</span>
            </div>
          )}
        </div>

        {/* 标签 */}
        {moment.tags && moment.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {moment.tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-full bg-white/60 px-2.5 py-0.5 text-xs text-zinc-700 backdrop-blur-sm dark:bg-zinc-800/60 dark:text-zinc-300"
              >
                <Tag className="h-2.5 w-2.5" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

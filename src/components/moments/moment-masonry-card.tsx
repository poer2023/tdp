"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, Heart, Sparkles } from "lucide-react";
import type { MomentListItem } from "@/lib/moments";
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
  onDelete: _onDelete,
  isAdmin: _isAdmin = false,
}: MomentMasonryCardProps) {
  const hasImages = moment.images && moment.images.length > 0;
  const firstImage = hasImages ? moment.images[0] : null;
  const hasContent = moment.content && moment.content.trim().length > 0;
  const imageCount = moment.images?.length || 0;

  // Determine card type
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

  // ==================== 纯图片卡片 (Image-only) ====================
  if (cardType === "image-only" && firstImage) {
    return (
      <div
        onClick={(e) => {
          e.preventDefault();
          window.dispatchEvent(
            new CustomEvent("open-moment-lightbox", {
              detail: { images: moment.images, initialIndex: 0 },
            })
          );
        }}
        className="group relative block cursor-pointer overflow-hidden rounded-[24px] bg-white shadow-[0_25px_50px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-[0_35px_70px_rgba(15,23,42,0.12)] active:scale-[0.99] dark:bg-[#111827] dark:shadow-[0_25px_50px_rgba(0,0,0,0.35)]"
      >
        <div className="relative aspect-auto">
          <Image
            src={firstImage.previewUrl || firstImage.url}
            alt={moment.content?.slice(0, 50) || "Moment image"}
            width={firstImage.w || 800}
            height={firstImage.h || 600}
            className="h-auto w-full rounded-[24px] object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />

          {/* Eye + Heart icons overlay - 右上角 */}
          <div className="absolute right-3 top-3 flex items-center gap-1.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(15,23,42,0.45)]"
              aria-hidden="true"
              title="View count"
            >
              <Eye className="h-[18px] w-[18px] text-white/85" />
            </div>
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(15,23,42,0.45)]"
              aria-hidden="true"
              title="Like"
            >
              <Heart className="h-[18px] w-[18px] text-white/85" />
            </div>
          </div>

          {/* 底部元数据 */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-3 sm:p-4">
            {/* 左下角: Private pill */}
            {!moment.isPublic && (
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-[#F87171]" />
                <span className="text-[11px] text-[#9CA3AF]">
                  {locale === "zh" ? "私密" : "Private"}
                </span>
              </div>
            )}
            <div className="flex-1" />
            {/* 右下角: 时间 */}
            <span className="text-[11px] text-[#9CA3AF]">
              {formatMomentDate(moment.createdAt, locale)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ==================== 纯多图卡片 (Multi-image-only) ====================
  if (cardType === "multi-image-only" && moment.images) {
    return (
      <div className="group relative overflow-hidden rounded-[24px] bg-white shadow-[0_25px_50px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-[0_35px_70px_rgba(15,23,42,0.12)] active:scale-[0.99] dark:bg-[#111827] dark:shadow-[0_25px_50px_rgba(0,0,0,0.35)]">
        <MultiImageGrid
          images={moment.images}
          onImageClick={(index) => {
            window.dispatchEvent(
              new CustomEvent("open-moment-lightbox", {
                detail: { images: moment.images, initialIndex: index },
              })
            );
          }}
        />

        {/* 底部元数据 */}
        <div className="flex items-center justify-between p-3 sm:p-4">
          {!moment.isPublic && (
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-[#F87171]" />
              <span className="text-[11px] text-[#9CA3AF]">
                {locale === "zh" ? "私密" : "Private"}
              </span>
            </div>
          )}
          <div className="flex-1" />
          <span className="text-[11px] text-[#9CA3AF]">
            {formatMomentDate(moment.createdAt, locale)}
          </span>
        </div>
      </div>
    );
  }

  // ==================== 多图文混合卡片 (Multi-image-text) ====================
  if (cardType === "multi-image-text" && moment.images) {
    return (
      <div className="group relative overflow-hidden rounded-[24px] bg-white shadow-[0_25px_50px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-[0_35px_70px_rgba(15,23,42,0.12)] active:scale-[0.99] dark:bg-[#111827] dark:shadow-[0_25px_50px_rgba(0,0,0,0.35)]">
        {/* 多图网格区域 */}
        <MultiImageGrid
          images={moment.images}
          onImageClick={(index) => {
            window.dispatchEvent(
              new CustomEvent("open-moment-lightbox", {
                detail: { images: moment.images, initialIndex: index },
              })
            );
          }}
        />

        <Link href={cardLink} className="block">
          {/* 文字区域 */}
          <div className="p-5 sm:p-6">
            <p className="mb-5 line-clamp-2 text-base leading-[26px] text-[#111827] dark:text-[#F8FAFC]">
              {moment.content}
            </p>

            {/* 底部元数据 */}
            <div className="flex items-center justify-between">
              {!moment.isPublic && (
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-[#F87171]" />
                  <span className="text-[11px] text-[#9CA3AF]">
                    {locale === "zh" ? "私密" : "Private"}
                  </span>
                </div>
              )}
              <div className="flex-1" />
              <span className="text-[11px] text-[#9CA3AF]">
                {formatMomentDate(moment.createdAt, locale)}
              </span>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  // ==================== 图文混合卡片 (Image-text) ====================
  if (cardType === "image-text" && firstImage) {
    return (
      <div className="group relative overflow-hidden rounded-[24px] bg-white shadow-[0_25px_50px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-[0_35px_70px_rgba(15,23,42,0.12)] active:scale-[0.99] dark:bg-[#111827] dark:shadow-[0_25px_50px_rgba(0,0,0,0.35)]">
        {/* 图片区域 */}
        <div
          className="relative cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            window.dispatchEvent(
              new CustomEvent("open-moment-lightbox", {
                detail: { images: moment.images, initialIndex: 0 },
              })
            );
          }}
        >
          <Image
            src={firstImage.previewUrl || firstImage.url}
            alt={moment.content?.slice(0, 50) || "Moment image"}
            width={firstImage.w || 800}
            height={firstImage.h || 600}
            className="h-auto w-full rounded-t-[24px] object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        </div>

        <Link href={cardLink} className="block">
          {/* 文字区域 */}
          <div className="p-5 sm:p-6">
            <p className="mb-5 line-clamp-2 text-base leading-[26px] text-[#111827] dark:text-[#F8FAFC]">
              {moment.content}
            </p>

            {/* 底部元数据 */}
            <div className="flex items-center justify-between">
              {!moment.isPublic && (
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-[#F87171]" />
                  <span className="text-[11px] text-[#9CA3AF]">
                    {locale === "zh" ? "私密" : "Private"}
                  </span>
                </div>
              )}
              <div className="flex-1" />
              <span className="text-[11px] text-[#9CA3AF]">
                {formatMomentDate(moment.createdAt, locale)}
              </span>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  // ==================== 纯文字卡片 (Text-only) ====================
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        window.dispatchEvent(
          new CustomEvent("open-text-lightbox", {
            detail: { text: moment.content },
          })
        );
      }}
      className="group block cursor-pointer overflow-hidden rounded-[24px] bg-[#F7F8FB] shadow-[0_25px_50px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-[0_35px_70px_rgba(15,23,42,0.12)] active:scale-[0.99] dark:bg-[#1E2433] dark:shadow-[0_25px_50px_rgba(0,0,0,0.35)]"
      aria-label={locale === "zh" ? "打开文字瞬间" : "Open text moment"}
    >
      <div className="p-5 sm:p-6">
        <p className="mb-5 line-clamp-3 text-[22px] leading-8 text-[#111827] dark:text-[#F8FAFC]">
          {moment.content}
        </p>

        {/* 底部信息条 */}
        <div className="flex h-8 items-center justify-between rounded-full bg-white/80 px-3 dark:bg-white/5">
          {/* 左侧: Icon + Tag/Notes */}
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-[#94A3B8]" aria-hidden="true" />
            <span className="text-xs text-[#94A3B8]">
              {moment.tags && moment.tags.length > 0
                ? moment.tags[0]
                : locale === "zh"
                ? "随记"
                : "Notes"}
            </span>
          </div>

          {/* 右侧: 时间 */}
          <span className="text-xs text-[#94A3B8]">
            {formatMomentDate(moment.createdAt, locale)}
          </span>
        </div>
      </div>
    </div>
  );
}

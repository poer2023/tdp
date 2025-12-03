"use client";

import React from "react";
import type { MomentListItem } from "@/lib/moments";
import { useLightbox } from "@/contexts/lightbox-context";
import { ImageOnlyCard } from "./cards/image-only-card";
import { MultiImageOnlyCard } from "./cards/multi-image-only-card";
import { ImageTextCard } from "./cards/image-text-card";
import { MultiImageTextCard } from "./cards/multi-image-text-card";
import { TextOnlyCard } from "./cards/text-only-card";
import { DeleteIcon } from "@/components/moments/delete-icon";
import { localePath } from "@/lib/locale-path";

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

type CardType = "image-only" | "multi-image-only" | "image-text" | "multi-image-text" | "text-only";

/**
 * 确定卡片类型
 */
function getCardType(moment: MomentWithMasonryData): CardType {
  const hasImages = moment.images && moment.images.length > 0;
  const hasContent = moment.content && moment.content.trim().length > 0;
  const imageCount = moment.images?.length || 0;

  if (!hasImages) return "text-only";

  if (imageCount === 1) {
    return hasContent ? "image-text" : "image-only";
  }

  return hasContent ? "multi-image-text" : "multi-image-only";
}

/**
 * 路由组件 - 根据内容类型渲染对应的卡片组件
 *
 * 这个组件负责：
 * 1. 分析 moment 的内容类型
 * 2. 选择合适的卡片组件
 * 3. 处理 lightbox 事件分发
 */
export function MomentMasonryCard({
  moment,
  locale,
  onDelete: _onDelete,
  isAdmin: _isAdmin = false,
}: MomentMasonryCardProps) {
  const { openLightbox, openTextLightbox } = useLightbox();
  const cardType = getCardType(moment);
  const cardLink = moment.slug
    ? localePath(locale, `/m/${moment.slug}`)
    : localePath(locale, `/m#${moment.id}`);

  // Lightbox 事件处理（使用类型安全的 Context）
  const handleImageClick = (initialIndex = 0) => {
    if (moment.images) {
      openLightbox(moment.images, initialIndex);
    }
  };

  const handleTextClick = () => {
    if (moment.content) {
      openTextLightbox(moment.content);
    }
  };

  // 根据卡片类型渲染对应组件
  const renderCard = () => {
    switch (cardType) {
      case "image-only":
        return (
          <ImageOnlyCard
            moment={moment}
            locale={locale}
            onImageClick={() => handleImageClick(0)}
          />
        );

      case "multi-image-only":
        return <MultiImageOnlyCard moment={moment} locale={locale} onImageClick={handleImageClick} />;

      case "image-text":
        return (
          <ImageTextCard
            moment={moment}
            locale={locale}
            cardLink={cardLink}
            onImageClick={() => handleImageClick(0)}
          />
        );

      case "multi-image-text":
        return (
          <MultiImageTextCard
            moment={moment}
            locale={locale}
            cardLink={cardLink}
            onImageClick={handleImageClick}
          />
        );

      case "text-only":
        return <TextOnlyCard moment={moment} locale={locale} onTextClick={handleTextClick} />;

      default:
        return null;
    }
  };

  return (
    <div className="relative">
      {renderCard()}
      {_isAdmin && <DeleteIcon id={moment.id} />}
    </div>
  );
}

import React from "react";
import type { MomentListItem } from "@/lib/moments";
import { MultiImageGrid } from "../multi-image-grid";
import { MomentCardFooter } from "../moment-card-footer";

interface MultiImageOnlyCardProps {
  moment: MomentListItem & { isPublic: boolean };
  locale: "zh" | "en";
  onImageClick: (index: number) => void;
}

/**
 * 纯多图卡片 - 显示多张图片，无文字内容
 */
export function MultiImageOnlyCard({ moment, locale, onImageClick }: MultiImageOnlyCardProps) {
  if (!moment.images || moment.images.length === 0) return null;

  return (
    <div className="group relative overflow-hidden rounded-[24px] bg-white shadow-[0_25px_50px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-[0_35px_70px_rgba(15,23,42,0.12)] active:scale-[0.99] dark:bg-[#111827] dark:shadow-[0_25px_50px_rgba(0,0,0,0.35)]">
      <MultiImageGrid images={moment.images} onImageClick={onImageClick} />

      {/* 底部元数据 */}
      <div className="p-3 sm:p-4">
        <MomentCardFooter
          isPublic={moment.isPublic}
          createdAt={moment.createdAt}
          locale={locale}
        />
      </div>
    </div>
  );
}

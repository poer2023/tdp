import React from "react";
import Link from "next/link";
import type { MomentListItem } from "@/lib/moments";
import { MultiImageGrid } from "../multi-image-grid";
import { MomentCardFooter } from "../moment-card-footer";

interface MultiImageTextCardProps {
  moment: MomentListItem & { isPublic: boolean };
  locale: "zh" | "en";
  cardLink: string;
  onImageClick: (index: number) => void;
}

/**
 * 多图文混合卡片 - 多张图片 + 文字内容
 */
export function MultiImageTextCard({
  moment,
  locale,
  cardLink,
  onImageClick,
}: MultiImageTextCardProps) {
  if (!moment.images || moment.images.length === 0) return null;

  return (
    <div className="group relative overflow-hidden rounded-[24px] bg-white shadow-[0_25px_50px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-[0_35px_70px_rgba(15,23,42,0.12)] active:scale-[0.99] dark:bg-[#111827] dark:shadow-[0_25px_50px_rgba(0,0,0,0.35)]">
      {/* 多图网格区域 */}
      <MultiImageGrid images={moment.images} onImageClick={onImageClick} />

      <Link href={cardLink} className="block">
        {/* 文字区域 */}
        <div className="p-5 sm:p-6">
          <p className="mb-5 line-clamp-2 text-base leading-[26px] text-[#111827] dark:text-[#F8FAFC]">
            {moment.content}
          </p>

          {/* 底部元数据 */}
          <MomentCardFooter
            isPublic={moment.isPublic}
            createdAt={moment.createdAt}
            locale={locale}
          />
        </div>
      </Link>
    </div>
  );
}

import React from "react";
import Image from "next/image";
import { Eye, Heart } from "lucide-react";
import type { MomentListItem } from "@/lib/moments";
import { getMomentImageUrl } from "@/lib/moment-images";
import { MomentCardFooter } from "../moment-card-footer";

interface ImageOnlyCardProps {
  moment: MomentListItem & { isPublic: boolean };
  locale: "zh" | "en";
  onImageClick: () => void;
}

/**
 * 纯图片卡片 - 仅显示单张图片，无文字内容
 */
export function ImageOnlyCard({ moment, locale, onImageClick }: ImageOnlyCardProps) {
  const firstImage = moment.images?.[0];

  if (!firstImage) return null;
  const displayUrl = getMomentImageUrl(firstImage, "medium");

  return (
    <div
      onClick={(e) => {
        e.preventDefault();
        onImageClick();
      }}
      className="group relative block cursor-pointer overflow-hidden rounded-[24px] bg-white shadow-[0_25px_50px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-[0_35px_70px_rgba(15,23,42,0.12)] active:scale-[0.99] dark:bg-[#111827] dark:shadow-[0_25px_50px_rgba(0,0,0,0.35)]"
    >
      <div className="relative aspect-auto">
        <Image
          src={displayUrl}
          alt={moment.content?.slice(0, 50) || "Moment image"}
          width={firstImage.w || 800}
          height={firstImage.h || 600}
          className="h-auto w-full rounded-[24px] object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
          loading="lazy"
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
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
          <MomentCardFooter
            isPublic={moment.isPublic}
            createdAt={moment.createdAt}
            locale={locale}
          />
        </div>
      </div>
    </div>
  );
}

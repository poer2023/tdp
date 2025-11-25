import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { MomentListItem } from "@/lib/moments";
import { MomentCardFooter } from "../moment-card-footer";

interface ImageTextCardProps {
  moment: MomentListItem & { isPublic: boolean };
  locale: "zh" | "en";
  cardLink: string;
  onImageClick: () => void;
}

/**
 * 图文混合卡片 - 单张图片 + 文字内容
 */
export function ImageTextCard({ moment, locale, cardLink, onImageClick }: ImageTextCardProps) {
  const firstImage = moment.images?.[0];

  if (!firstImage) return null;

  return (
    <div className="group relative overflow-hidden rounded-[24px] bg-white shadow-[0_25px_50px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-[0_35px_70px_rgba(15,23,42,0.12)] active:scale-[0.99] dark:bg-[#111827] dark:shadow-[0_25px_50px_rgba(0,0,0,0.35)]">
      {/* 图片区域 */}
      <div
        className="relative cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onImageClick();
        }}
      >
        <Image
          src={firstImage.previewUrl || firstImage.url}
          alt={moment.content?.slice(0, 50) || "Moment image"}
          width={firstImage.w || 800}
          height={firstImage.h || 600}
          className="h-auto w-full rounded-t-[24px] object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
          loading="lazy"
        />
      </div>

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

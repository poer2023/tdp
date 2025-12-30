"use client";

import Image from "next/image";
import type { MomentImage } from "@/lib/moments";
import { getMomentImageUrl } from "@/lib/moment-images";

interface MultiImageGridProps {
  images: MomentImage[];
  onImageClick: (index: number) => void;
}

export function MultiImageGrid({ images, onImageClick }: MultiImageGridProps) {
  const count = images.length;

  // 2图布局: 上下排列的纵向2列布局
  if (count === 2) {
    return (
      <div className="grid grid-rows-2 gap-1.5">
        {images.map((img, idx) => (
          <div
            key={idx}
            className="relative aspect-square cursor-pointer overflow-hidden rounded-[18px]"
            onClick={(e) => {
              e.stopPropagation();
              onImageClick(idx);
            }}
          >
            <Image
              src={getMomentImageUrl(img, "small")}
              alt={img.alt || `Image ${idx + 1}`}
              fill
              className="object-cover transition-transform duration-200 hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 25vw, (max-width: 1024px) 16.6vw, 12.5vw"
            />
          </div>
        ))}
      </div>
    );
  }

  // 3图布局: 左侧一张竖直占满 (比例 2:3), 右侧两张上下 (高度等分)
  if (count === 3) {
    return (
      <div className="grid grid-cols-2 gap-1.5">
        {/* 第一张大图 - 占据左侧全高, 比例 2:3 */}
        <div
          className="relative row-span-2 cursor-pointer overflow-hidden rounded-[18px]"
          style={{ aspectRatio: "2 / 3" }}
          onClick={(e) => {
            e.stopPropagation();
            onImageClick(0);
          }}
        >
          <Image
            src={getMomentImageUrl(images[0]!, "medium")}
            alt={images[0]!.alt || "Image 1"}
            fill
            className="object-cover transition-transform duration-200 hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 25vw, (max-width: 1024px) 16.6vw, 12.5vw"
          />
        </div>

        {/* 右侧两张小图 - 高度等分 */}
        {images.slice(1).map((img, idx) => (
          <div
            key={idx + 1}
            className="relative aspect-square cursor-pointer overflow-hidden rounded-[18px]"
            onClick={(e) => {
              e.stopPropagation();
              onImageClick(idx + 1);
            }}
          >
            <Image
              src={getMomentImageUrl(img, "small")}
              alt={img.alt || `Image ${idx + 2}`}
              fill
              className="object-cover transition-transform duration-200 hover:scale-105"
              sizes="(max-width: 640px) 25vw, (max-width: 768px) 12.5vw, (max-width: 1024px) 8.3vw, 6.25vw"
            />
          </div>
        ))}
      </div>
    );
  }

  // 4图及以上布局: 2×2 网格
  if (count >= 4) {
    return (
      <div className="grid grid-cols-2 gap-1.5">
        {images.slice(0, 4).map((img, idx) => (
          <div
            key={idx}
            className="relative aspect-square cursor-pointer overflow-hidden rounded-[18px]"
            onClick={(e) => {
              e.stopPropagation();
              onImageClick(idx);
            }}
          >
            <Image
              src={getMomentImageUrl(img, "small")}
              alt={img.alt || `Image ${idx + 1}`}
              fill
              className="object-cover transition-transform duration-200 hover:scale-105"
              sizes="(max-width: 640px) 25vw, (max-width: 768px) 12.5vw, (max-width: 1024px) 8.3vw, 6.25vw"
            />
            {/* 如果超过4张图,在第4张上显示 "+N" 标识 */}
            {idx === 3 && count > 4 && (
              <div className="absolute inset-0 flex items-center justify-center rounded-[18px] bg-[rgba(15,23,42,0.8)]">
                <span className="text-[22px] font-bold text-white">
                  +{count - 4}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // 单图fallback (理论上不会走到这里)
  return null;
}

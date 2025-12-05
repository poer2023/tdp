"use client";

import Image, { type ImageProps } from "next/image";
import { useCallback, useState } from "react";

type AutoAspectImageProps = Omit<ImageProps, "fill"> & {
  /** 包裹容器的类名 */
  containerClassName?: string;
  /** 默认的占位宽高比，图片加载后会被真实宽高比覆盖 */
  defaultAspect?: string;
  /** 是否使用 cover 填充（默认为 cover） */
  objectFit?: "cover" | "contain";
  /** 是否使用 fill 模式，默认 true */
  fill?: boolean;
};

/**
 * AutoAspectImage
 * - 根据图片原始宽高比自动调整容器 aspect-ratio，避免竖图被压成横图
 * - 默认使用 fill + object-cover，可通过 objectFit 自定义
 */
export function AutoAspectImage(props: AutoAspectImageProps) {
  const {
    containerClassName = "",
    defaultAspect = "3/4",
    objectFit = "cover",
    className = "",
    onLoadingComplete,
    fill = true,
    alt: altProp,
    ...imageProps
  } = props;
  const [aspectRatio, setAspectRatio] = useState<string | undefined>(undefined);
  const resolvedAlt = altProp ?? "";

  const handleLoadingComplete = useCallback(
    (img: HTMLImageElement) => {
      if (img?.naturalWidth && img?.naturalHeight) {
        setAspectRatio(`${img.naturalWidth}/${img.naturalHeight}`);
      }
      onLoadingComplete?.(img);
    },
    [onLoadingComplete]
  );

  return (
    <div
      className={`relative overflow-hidden ${containerClassName}`}
      style={{ aspectRatio: aspectRatio ?? defaultAspect }}
    >
      <Image
        {...imageProps}
        alt={resolvedAlt}
        fill={fill}
        className={`${className} ${objectFit === "contain" ? "object-contain" : "object-cover"} h-full w-full`}
        onLoadingComplete={handleLoadingComplete}
      />
    </div>
  );
}

export default AutoAspectImage;


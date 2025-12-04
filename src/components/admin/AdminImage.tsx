"use client";

import Image from "next/image";
import { useState, useCallback } from "react";

/**
 * AdminImage - 优化的管理后台图片组件
 *
 * 特点：
 * - 使用 Next.js Image 组件自动优化图片格式（webp/avif）
 * - 懒加载支持
 * - 图片加载失败时显示占位符
 * - 支持本地上传图片和远程图片
 */

interface AdminImageProps {
  src: string | undefined | null;
  alt?: string;
  className?: string;
  /** 容器类名，用于设置尺寸 */
  containerClassName?: string;
  /** 是否填充父容器 */
  fill?: boolean;
  /** 固定宽度（当 fill=false 时使用） */
  width?: number;
  /** 固定高度（当 fill=false 时使用） */
  height?: number;
  /** 图片加载优先级 */
  priority?: boolean;
  /** object-fit 样式 */
  objectFit?: "cover" | "contain" | "fill" | "none";
  /** 点击事件 */
  onClick?: () => void;
}

export function AdminImage({
  src,
  alt = "",
  className = "",
  containerClassName = "",
  fill = true,
  width,
  height,
  priority = false,
  objectFit = "cover",
  onClick,
}: AdminImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  // 如果没有 src 或加载失败，显示占位符
  if (!src || hasError) {
    return (
      <div
        className={`bg-stone-200 dark:bg-stone-800 flex items-center justify-center ${containerClassName}`}
        onClick={onClick}
      >
        <svg
          className="w-8 h-8 text-stone-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  // 检查是否为 blob URL 或 data URL（预览图片）
  const isPreviewUrl = src.startsWith("blob:") || src.startsWith("data:");

  // 对于预览图片，使用原生 img 标签
  if (isPreviewUrl) {
    return (
      <div className={`relative ${containerClassName}`} onClick={onClick}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className={`${className} ${objectFit === "cover" ? "object-cover" : objectFit === "contain" ? "object-contain" : ""}`}
          onError={handleError}
        />
      </div>
    );
  }

  // 检查是否为外部 URL 且不在已知域名列表中
  const isKnownDomain = (url: string) => {
    const knownDomains = [
      "avatars.githubusercontent.com",
      "lh3.googleusercontent.com",
      "i0.hdslb.com",
      "i1.hdslb.com",
      "i2.hdslb.com",
      "img1.doubanio.com",
      "img2.doubanio.com",
      "img3.doubanio.com",
      "img9.doubanio.com",
    ];
    try {
      const urlObj = new URL(url);
      return knownDomains.includes(urlObj.hostname);
    } catch {
      return false;
    }
  };

  const isExternalUrl = src.startsWith("http://") || src.startsWith("https://");
  const shouldOptimize = !isExternalUrl || isKnownDomain(src);

  // 使用 fill 模式
  if (fill) {
    return (
      <div className={`relative ${containerClassName}`} onClick={onClick}>
        {isLoading && (
          <div className="absolute inset-0 bg-stone-200 dark:bg-stone-800 animate-pulse" />
        )}
        <Image
          src={src}
          alt={alt}
          fill
          className={`${className} ${objectFit === "cover" ? "object-cover" : objectFit === "contain" ? "object-contain" : ""}`}
          onError={handleError}
          onLoad={handleLoad}
          priority={priority}
          unoptimized={!shouldOptimize}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
    );
  }

  // 使用固定尺寸模式
  return (
    <div className={containerClassName} onClick={onClick}>
      {isLoading && (
        <div
          className="bg-stone-200 dark:bg-stone-800 animate-pulse"
          style={{ width: width || "100%", height: height || "100%" }}
        />
      )}
      <Image
        src={src}
        alt={alt}
        width={width || 100}
        height={height || 100}
        className={className}
        onError={handleError}
        onLoad={handleLoad}
        priority={priority}
        unoptimized={!shouldOptimize}
      />
    </div>
  );
}

/**
 * AdminAvatar - 头像专用组件
 */
interface AdminAvatarProps {
  src: string | undefined | null;
  alt?: string;
  size?: number;
  className?: string;
}

export function AdminAvatar({
  src,
  alt = "",
  size = 40,
  className = "",
}: AdminAvatarProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={`rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <svg
          className="w-1/2 h-1/2 text-stone-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      </div>
    );
  }

  // 检查是否为外部 URL
  const isExternalUrl = src.startsWith("http://") || src.startsWith("https://");
  const isKnownDomain = (url: string) => {
    const knownDomains = [
      "avatars.githubusercontent.com",
      "lh3.googleusercontent.com",
    ];
    try {
      const urlObj = new URL(url);
      return knownDomains.includes(urlObj.hostname);
    } catch {
      return false;
    }
  };

  const shouldOptimize = !isExternalUrl || isKnownDomain(src);

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      onError={() => setHasError(true)}
      unoptimized={!shouldOptimize}
    />
  );
}

export default AdminImage;


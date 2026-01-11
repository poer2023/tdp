"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";

interface LivePhotoPlayerProps {
  imageSrc: string;
  videoSrc: string;
  alt: string;
  className?: string;
}

/**
 * Live Photo 播放器
 * 设计原则：节制、可预测、服务内容
 * - Hover/长按触发，符合用户预期
 * - 状态标识清晰（LIVE标记）
 * - 无炫技动画，仅必要的淡入淡出
 * 
 * 2026 性能优化:
 * - IntersectionObserver - 仅在视口内响应交互
 * - preload="metadata" - 仅加载视频元数据
 */
export function LivePhotoPlayer({ imageSrc, videoSrc, alt, className = "" }: LivePhotoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInViewport, setIsInViewport] = useState(false);

  // IntersectionObserver - 视口检测，节省资源
  useEffect(() => {
    const container = containerRef.current;
    // Skip if IntersectionObserver not available (e.g., test environment)
    if (!container || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setIsInViewport(entry.isIntersecting);
      },
      { threshold: 0.1, rootMargin: "50px" }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const handleInteractionStart = () => {
    // 只在视口内响应交互，节省资源
    if (!isInViewport || !videoRef.current) return;
    videoRef.current.play();
    setIsPlaying(true);
  };

  const handleInteractionEnd = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  return (
    <div
      ref={containerRef}
      className={`group relative overflow-hidden ${className}`}
      onMouseEnter={handleInteractionStart}
      onMouseLeave={handleInteractionEnd}
      onTouchStart={handleInteractionStart}
      onTouchEnd={handleInteractionEnd}
    >
      {/* 静态图片层 - 默认显示 */}
      <div className={`transition-opacity duration-150 ${isPlaying ? "opacity-0" : "opacity-100"}`}>
        <Image
          src={imageSrc}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
        />
      </div>

      {/* 视频层 - 播放时显示 */}
      <video
        ref={videoRef}
        src={videoSrc}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-150 ${isPlaying ? "opacity-100" : "opacity-0"
          }`}
        muted
        playsInline
        loop
        preload="metadata"
        aria-hidden="true"
      />

      {/* LIVE 标识 - 克制的存在感 */}
      <div className="absolute top-2 right-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium tracking-wider text-white uppercase backdrop-blur-sm">
        LIVE
      </div>

      {/* 交互提示 - 仅在未播放且悬停时显示 */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity delay-300 duration-150 group-hover:bg-black/5 group-hover:opacity-100">
          <div className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-stone-900 shadow-sm backdrop-blur-sm">
            悬停播放
          </div>
        </div>
      )}
    </div>
  );
}

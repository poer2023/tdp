import React from "react";

interface MomentCardFooterProps {
  isPublic: boolean;
  createdAt: Date;
  locale: "zh" | "en";
  className?: string;
}

/**
 * 格式化日期显示
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

/**
 * 共享的卡片底部组件 - 显示隐私状态和时间
 *
 * 用于所有卡片类型的底部元数据显示，包括：
 * - 私密标记（可选显示）
 * - 创建时间（相对时间格式）
 */
export function MomentCardFooter({
  isPublic,
  createdAt,
  locale,
  className = "",
}: MomentCardFooterProps) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      {/* 左侧：私密标记 */}
      {!isPublic && (
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-[#F87171]" aria-hidden="true" />
          <span className="text-[11px] text-[#9CA3AF]">
            {locale === "zh" ? "私密" : "Private"}
          </span>
        </div>
      )}

      <div className="flex-1" />

      {/* 右侧：时间戳 */}
      <time className="text-[11px] text-[#9CA3AF]" dateTime={createdAt.toISOString()}>
        {formatMomentDate(createdAt, locale)}
      </time>
    </div>
  );
}

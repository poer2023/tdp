import React from "react";
import { Sparkles } from "lucide-react";
import type { MomentListItem } from "@/lib/moments";

interface TextOnlyCardProps {
  moment: MomentListItem & { isPublic: boolean };
  locale: "zh" | "en";
  onTextClick: () => void;
}

/**
 * 格式化日期显示（独立版本，因为纯文字卡片不使用 MomentCardFooter）
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
 * 纯文字卡片 - 仅显示文字内容，无图片
 */
export function TextOnlyCard({ moment, locale, onTextClick }: TextOnlyCardProps) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onTextClick();
      }}
      className="group block cursor-pointer overflow-hidden rounded-[24px] bg-[#F7F8FB] shadow-[0_25px_50px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-[0_35px_70px_rgba(15,23,42,0.12)] active:scale-[0.99] dark:bg-[#1E2433] dark:shadow-[0_25px_50px_rgba(0,0,0,0.35)]"
      aria-label={locale === "zh" ? "打开文字瞬间" : "Open text moment"}
    >
      <div className="p-5 sm:p-6">
        <p className="mb-5 line-clamp-3 text-[22px] leading-8 text-[#111827] dark:text-[#F8FAFC]">
          {moment.content}
        </p>

        {/* 底部信息条 */}
        <div className="flex h-8 items-center justify-between rounded-full bg-white/80 px-3 dark:bg-white/5">
          {/* 左侧: Icon + Tag/Notes */}
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-[#94A3B8]" aria-hidden="true" />
            <span className="text-xs text-[#94A3B8]">
              {moment.tags && moment.tags.length > 0
                ? moment.tags[0]
                : locale === "zh"
                ? "随记"
                : "Notes"}
            </span>
          </div>

          {/* 右侧: 时间 */}
          <time className="text-xs text-[#94A3B8]" dateTime={moment.createdAt.toISOString()}>
            {formatMomentDate(moment.createdAt, locale)}
          </time>
        </div>
      </div>
    </div>
  );
}

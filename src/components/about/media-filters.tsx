"use client";

import { Search, Calendar, CheckCircle2 } from "lucide-react";
import type { MediaApiParams } from "@/types/live-data";

interface MediaFiltersProps {
  locale: "en" | "zh";
  platform: MediaApiParams["platform"];
  dateRange: MediaApiParams["dateRange"];
  completion: MediaApiParams["completion"];
  searchQuery: string;
  onDateRangeChange: (range: MediaApiParams["dateRange"]) => void;
  onCompletionChange: (completion: MediaApiParams["completion"]) => void;
  onSearchChange: (query: string) => void;
}

export function MediaFilters({
  locale,
  platform,
  dateRange,
  completion,
  searchQuery,
  onDateRangeChange,
  onCompletionChange,
  onSearchChange,
}: MediaFiltersProps) {
  const t =
    locale === "zh"
      ? {
          search: "搜索标题...",
          dateRange: "时间范围",
          completion: "完成度",
          dateRanges: {
            all: "全部",
            thisWeek: "本周",
            thisMonth: "本月",
            thisYear: "今年",
          },
          completionOptions: {
            all: "全部",
            completed: "已看完",
            watching: "观看中",
            notStarted: "未开始",
          },
        }
      : {
          search: "Search titles...",
          dateRange: "Date Range",
          completion: "Completion",
          dateRanges: {
            all: "All",
            thisWeek: "This Week",
            thisMonth: "This Month",
            thisYear: "This Year",
          },
          completionOptions: {
            all: "All",
            completed: "Completed",
            watching: "Watching",
            notStarted: "Not Started",
          },
        };

  return (
    <div className="mb-6 flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-4 sm:flex-row sm:items-center dark:border-neutral-800 dark:bg-neutral-900">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t.search}
          className="w-full rounded-lg border border-neutral-200 bg-white py-2 pr-4 pl-10 text-sm text-neutral-900 placeholder-neutral-400 transition-colors focus:border-neutral-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500 dark:focus:border-neutral-600"
        />
      </div>

      {/* Date Range Select */}
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-neutral-400" />
        <select
          value={dateRange}
          onChange={(e) => onDateRangeChange(e.target.value as MediaApiParams["dateRange"])}
          className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 transition-colors focus:border-neutral-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:focus:border-neutral-600"
        >
          <option value="all">{t.dateRanges.all}</option>
          <option value="thisWeek">{t.dateRanges.thisWeek}</option>
          <option value="thisMonth">{t.dateRanges.thisMonth}</option>
          <option value="thisYear">{t.dateRanges.thisYear}</option>
        </select>
      </div>

      {/* Completion Filter (Bilibili only) */}
      {platform === "bilibili" && (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-neutral-400" />
          <select
            value={completion}
            onChange={(e) => onCompletionChange(e.target.value as MediaApiParams["completion"])}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 transition-colors focus:border-neutral-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:focus:border-neutral-600"
          >
            <option value="all">{t.completionOptions.all}</option>
            <option value="completed">{t.completionOptions.completed}</option>
            <option value="watching">{t.completionOptions.watching}</option>
            <option value="notStarted">{t.completionOptions.notStarted}</option>
          </select>
        </div>
      )}
    </div>
  );
}

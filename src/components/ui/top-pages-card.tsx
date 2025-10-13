"use client";

import * as React from "react";
import { useMemo } from "react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type PeriodOption = "7d" | "30d";

type TopPage = {
  path: string;
  label: string;
  views: number;
};

type PeriodRange = {
  from: Date;
  to: Date;
};

type TopPagesCardProps = {
  data: Record<PeriodOption, TopPage[]>;
  totals: Record<PeriodOption, number>;
  ranges: Record<PeriodOption, PeriodRange>;
  deltas?: Record<PeriodOption, number | null>;
  locale: "en" | "zh";
  className?: string;
};

const COLORS = [
  "bg-blue-500",
  "bg-indigo-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-purple-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-teal-500",
  "bg-orange-500",
  "bg-pink-500",
];

const PERIOD_LABELS: Record<PeriodOption, { short: string; compare: string }> = {
  "7d": { short: "7D", compare: "previous 7 days" },
  "30d": { short: "30D", compare: "previous 30 days" },
};

export function TopPagesCard({
  data,
  totals,
  ranges,
  deltas,
  locale,
  className,
}: TopPagesCardProps) {
  const [activePeriod, setActivePeriod] = React.useState<PeriodOption>("7d");
  const pages = data[activePeriod] ?? [];
  const totalViews = totals[activePeriod] ?? 0;
  const range = ranges[activePeriod];
  const delta = deltas?.[activePeriod] ?? null;
  const isZh = locale === "zh";

  const formattedRange = useMemo(() => {
    if (!range) return { from: null, to: null };
    return {
      from: format(range.from, isZh ? "MM月dd日" : "MMM dd", isZh ? { locale: zhCN } : undefined),
      to: format(range.to, isZh ? "MM月dd日" : "MMM dd", isZh ? { locale: zhCN } : undefined),
    };
  }, [range, isZh]);

  const stackedData = useMemo(() => {
    if (pages.length === 0 || totalViews === 0) return [];

    return pages.slice(0, 8).map((page, index) => {
      const percent = (page.views / totalViews) * 100;
      return {
        ...page,
        percent,
        colorClass: COLORS[index % COLORS.length],
      };
    });
  }, [pages, totalViews]);

  return (
    <Card className={cn("flex h-full flex-col gap-4", className)}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold tracking-[0.3em] text-zinc-500 uppercase dark:text-zinc-400">
              {isZh ? "热门页面" : "Top Pages"}
            </p>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              {isZh ? "访问占比" : "Traffic Share"}
            </h2>
          </div>

          <Select
            value={activePeriod}
            onValueChange={(value) => setActivePeriod(value as PeriodOption)}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">{isZh ? "近 7 天" : "Last 7 days"}</SelectItem>
              <SelectItem value="30d" disabled={(data["30d"] ?? []).length === 0}>
                {isZh ? "近 30 天" : "Last 30 days"}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-semibold text-zinc-900 tabular-nums dark:text-zinc-50">
              {totalViews.toLocaleString()}
            </span>
            {delta !== null && Number.isFinite(delta) && (
              <div className="flex items-center gap-1">
                {delta >= 0 ? (
                  <ChevronUp className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-red-500" />
                )}
                <span
                  className={cn(
                    "text-sm font-medium",
                    delta >= 0 ? "text-emerald-500 dark:text-emerald-400" : "text-red-500"
                  )}
                >
                  {Math.abs(delta).toFixed(1)}%
                </span>
              </div>
            )}
          </div>

          {delta !== null && Number.isFinite(delta) && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {delta >= 0 ? (isZh ? "↑ 较" : "↑ from ") : isZh ? "↓ 较" : "↓ from "}
              {isZh
                ? activePeriod === "7d"
                  ? "上一周期"
                  : "前 30 天"
                : PERIOD_LABELS[activePeriod].compare}
            </p>
          )}
        </div>

        {formattedRange.from && formattedRange.to && (
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>{formattedRange.from}</span>
            <span>→</span>
            <span>{formattedRange.to}</span>
          </div>
        )}

        <Separator />

        {stackedData.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            {isZh ? "暂无足够数据。" : "Not enough data yet."}
          </p>
        ) : (
          <TooltipProvider>
            <div className="flex h-10 w-full gap-0.5 overflow-hidden rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800/60">
              {stackedData.map((item, index) => (
                <Tooltip key={`${item.path}-${activePeriod}-${index}`}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "h-full cursor-pointer rounded-lg transition-[opacity,width] hover:opacity-80 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none dark:focus-visible:ring-offset-zinc-900",
                        item.colorClass
                      )}
                      style={{ width: `${Math.max(item.percent, 1)}%`, minWidth: "24px" }}
                      aria-label={`${item.label}: ${item.views.toLocaleString()} ${isZh ? "次访问" : "views"} (${item.percent.toFixed(1)}%)`}
                    />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <div className="space-y-1">
                      <p className="font-medium">{item.label}</p>
                      <p className="text-xs opacity-80">
                        {item.views.toLocaleString()} {isZh ? "次访问" : "views"} ·{" "}
                        {item.percent.toFixed(1)}%
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        )}

        <Separator />

        <div className="mt-auto flex items-start gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                {isZh
                  ? "显示页面浏览量占比，悬停彩色条可查看详细信息。"
                  : "Shows the distribution of page views. Hover the colored bar to inspect details."}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <p className="leading-relaxed">
            {isZh
              ? "基于页面浏览量的占比图表，可帮助识别重点推广内容与长尾页面。"
              : "Traffic share helps you spot hero content, long-tail pages, and promotion opportunities."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

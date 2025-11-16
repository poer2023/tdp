"use client";

import * as React from "react";
import { useMemo } from "react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  from: string | number | Date;
  to: string | number | Date;
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
  const totalViews = totals[activePeriod] ?? 0;
  const range = ranges[activePeriod];
  const delta = deltas?.[activePeriod] ?? null;
  const isZh = locale === "zh";

  const toDate = (value: PeriodRange["from"]) => (value instanceof Date ? value : new Date(value));

  const formattedRange = useMemo(() => {
    if (!range) return { from: null, to: null };
    const formatDate = (value: PeriodRange["from"]) => {
      const date = toDate(value);
      return isZh ? format(date, "yyyy年MM月dd日", { locale: zhCN }) : format(date, "MMM dd, yyyy");
    };
    return {
      from: formatDate(range.from),
      to: formatDate(range.to),
    };
  }, [range, isZh]);

  const stackedData = useMemo(() => {
    const pages = data[activePeriod] ?? [];
    if (pages.length === 0 || totalViews === 0) return [];

    const topPages = pages.slice(0, 8);
    const topPagesTotal = topPages.reduce((sum, page) => sum + page.views, 0);

    return topPages.map((page, index) => {
      const percent = topPagesTotal > 0 ? (page.views / topPagesTotal) * 100 : 0;
      return {
        ...page,
        percent,
        colorClass: COLORS[index % COLORS.length],
      };
    });
  }, [activePeriod, data, totalViews]);

  return (
    <Card className={cn("flex h-full flex-col gap-4", className)}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {isZh ? "页面访问" : "Page Views"}
          </h2>
          <Select
            value={activePeriod}
            onValueChange={(value) => setActivePeriod(value as PeriodOption)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
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
            <span>{formattedRange.to}</span>
          </div>
        )}

        <Separator />

        {stackedData.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            {isZh ? "暂无足够数据。" : "Not enough data yet."}
          </p>
        ) : (
          <TooltipProvider delayDuration={0}>
            <div className="flex h-10 w-full gap-1 overflow-visible rounded-lg bg-zinc-100 dark:bg-zinc-800/60">
              {stackedData.map((item, index) => (
                <Tooltip key={`${item.path}-${activePeriod}-${index}`}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "h-full cursor-pointer rounded-md transition-all hover:-translate-y-1 hover:opacity-80 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none dark:focus-visible:ring-offset-zinc-900",
                        item.colorClass
                      )}
                      style={{ width: `${Math.max(item.percent, 1)}%`, minWidth: "32px" }}
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
      </CardContent>
    </Card>
  );
}

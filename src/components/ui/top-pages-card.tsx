"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button, Card, Chip } from "@/components/ui-heroui";
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

const PERIOD_LABELS: Record<
  PeriodOption,
  { short: string; compare: string; buttonLabel: { en: string; zh: string } }
> = {
  "7d": { short: "7D", compare: "previous 7 days", buttonLabel: { en: "Last 7 days", zh: "近 7 天" } },
  "30d": {
    short: "30D",
    compare: "previous 30 days",
    buttonLabel: { en: "Last 30 days", zh: "近 30 天" },
  },
};

export function TopPagesCard({
  data,
  totals,
  ranges,
  deltas,
  locale,
  className,
}: TopPagesCardProps) {
  const [activePeriod, setActivePeriod] = useState<PeriodOption>("7d");
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
    <Card
      variant="secondary"
      className={cn(
        "flex h-full flex-col border border-zinc-200/80 dark:border-zinc-800/80",
        className
      )}
    >
      <Card.Content className="flex h-full flex-col gap-5 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600 dark:text-blue-400">
              {isZh ? "热门页面" : "Top Pages"}
            </p>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              {isZh ? "页面访问" : "Page Views"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {(Object.keys(PERIOD_LABELS) as PeriodOption[]).map((period) => {
              const disabled = period === "30d" && (data["30d"] ?? []).length === 0;
              return (
                <Button
                  key={period}
                  variant={activePeriod === period ? "solid" : "light"}
                  size="sm"
                  onPress={() => setActivePeriod(period)}
                  isDisabled={disabled}
                >
                  {PERIOD_LABELS[period].buttonLabel[locale]}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-3xl font-semibold text-zinc-900 tabular-nums dark:text-zinc-50">
              {totalViews.toLocaleString()}
            </span>
            {delta !== null && Number.isFinite(delta) && (
              <Chip
                size="sm"
                variant="flat"
                color={delta >= 0 ? "success" : "danger"}
                className="inline-flex items-center gap-1 font-medium"
              >
                {delta >= 0 ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {Math.abs(delta).toFixed(1)}%
              </Chip>
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

        {stackedData.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-zinc-200 py-12 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            {isZh ? "暂无足够数据。" : "Not enough data yet."}
          </div>
        ) : (
          <>
            <div className="flex h-10 w-full gap-1 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800/60">
              {stackedData.map((item, index) => (
                <div
                  key={`${item.path}-${activePeriod}-${index}`}
                  className={cn(
                    "h-full cursor-pointer transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900",
                    item.colorClass
                  )}
                  style={{ width: `${Math.max(item.percent, 1)}%` }}
                  aria-label={`${item.label}: ${item.views.toLocaleString()} ${isZh ? "次访问" : "views"} (${item.percent.toFixed(1)}%)`}
                  title={`${item.label}: ${item.views.toLocaleString()} (${item.percent.toFixed(1)}%)`}
                />
              ))}
            </div>

            <div className="space-y-3 text-sm">
              {stackedData.map((item, index) => (
                <div
                  key={`${item.path}-legend-${index}`}
                  className="flex items-center justify-between gap-3 rounded-xl bg-zinc-50 px-3 py-2 dark:bg-zinc-900/40"
                >
                  <div className="flex items-center gap-3">
                    <span className={cn("h-3 w-3 rounded-full", item.colorClass)} />
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-50">{item.label}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{item.path}</p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-zinc-500 dark:text-zinc-400">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {item.views.toLocaleString()}
                    </p>
                    <p>{item.percent.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card.Content>
    </Card>
  );
}

"use client";

/**
 * Visits Trend Chart Component
 * Displays page view and unique visitor trends over a configurable time range
 */

import { useState, useMemo } from "react";
import { format, subDays, startOfDay } from "date-fns";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent } from "@/components/ui-heroui";
import { t, type AdminLocale } from "@/lib/admin-translations";

type DailyStatsData = {
  date: Date;
  totalViews: number;
  uniqueVisitors: number;
};

type VisitsTrendChartProps = {
  dailyStats: DailyStatsData[];
  locale: AdminLocale;
};

type TimeRange = 7 | 30 | 90;

export function VisitsTrendChart({ dailyStats, locale }: VisitsTrendChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>(7);

  // Filter and format data based on selected time range
  const chartData = useMemo(() => {
    const cutoffDate = startOfDay(subDays(new Date(), timeRange - 1));

    return dailyStats
      .filter((stat) => new Date(stat.date) >= cutoffDate)
      .map((stat) => ({
        date: format(new Date(stat.date), "yyyy-MM-dd"),
        dateDisplay: format(new Date(stat.date), locale === "zh" ? "MM/dd" : "MMM d"),
        totalViews: stat.totalViews,
        uniqueVisitors: stat.uniqueVisitors,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [dailyStats, timeRange, locale]);

  // Calculate peak day and average
  const stats = useMemo(() => {
    if (chartData.length === 0) {
      return { peakDay: null, peakViews: 0, avgViews: 0, totalViews: 0, totalVisitors: 0 };
    }

    const peakEntry = chartData.reduce((max, entry) =>
      entry.totalViews > max.totalViews ? entry : max
    );

    const totalViews = chartData.reduce((sum, entry) => sum + entry.totalViews, 0);
    const totalVisitors = chartData.reduce((sum, entry) => sum + entry.uniqueVisitors, 0);
    const avgViews = Math.round(totalViews / chartData.length);

    return {
      peakDay: peakEntry.dateDisplay,
      peakViews: peakEntry.totalViews,
      avgViews,
      totalViews,
      totalVisitors,
    };
  }, [chartData]);

  const timeRangeOptions: { value: TimeRange; label: string }[] = [
    { value: 7, label: locale === "zh" ? "近7天" : "7 Days" },
    { value: 30, label: locale === "zh" ? "近30天" : "30 Days" },
    { value: 90, label: locale === "zh" ? "近90天" : "90 Days" },
  ];

  return (
    <Card variant="default" className="flex min-h-[400px] flex-col">
      <CardContent className="flex h-full flex-col gap-4">
        {/* Header with time range selector */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
            {t(locale, "visitsTrend")}
          </h3>
          <div className="flex gap-2">
            {timeRangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTimeRange(option.value)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  timeRange === option.value
                    ? "bg-blue-500 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        {chartData.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {t(locale, "noDataAvailable")}
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1" style={{ minHeight: "240px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-zinc-200 dark:stroke-zinc-700"
                  />
                  <XAxis
                    dataKey="dateDisplay"
                    className="text-xs text-zinc-500 dark:text-zinc-400"
                    tick={{ fill: "currentColor", fontSize: 11 }}
                  />
                  <YAxis
                    className="text-xs text-zinc-500 dark:text-zinc-400"
                    tick={{ fill: "currentColor", fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--tooltip-bg, #18181b)",
                      border: "1px solid var(--tooltip-border, #27272a)",
                      borderRadius: "0.5rem",
                      color: "var(--tooltip-text, #fafafa)",
                      fontSize: "0.875rem",
                    }}
                    labelStyle={{ color: "var(--tooltip-text, #fafafa)", fontWeight: 600 }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "0.875rem" }}
                    iconType="circle"
                  />
                  <Area
                    type="monotone"
                    dataKey="totalViews"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#colorViews)"
                    name={locale === "zh" ? "页面浏览量 (PV)" : "Page Views (PV)"}
                  />
                  <Area
                    type="monotone"
                    dataKey="uniqueVisitors"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#colorVisitors)"
                    name={locale === "zh" ? "独立访客 (UV)" : "Unique Visitors (UV)"}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Stats summary */}
            <div className="grid grid-cols-2 gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800 md:grid-cols-4">
              <div className="space-y-1">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {t(locale, "totalViews")}
                </p>
                <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {stats.totalViews.toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {t(locale, "totalVisitors")}
                </p>
                <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {stats.totalVisitors.toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {t(locale, "avgViews")}
                </p>
                <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {stats.avgViews.toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {t(locale, "peakDay")}
                </p>
                <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {stats.peakDay}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {stats.peakViews.toLocaleString()} {locale === "zh" ? "次" : "views"}
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

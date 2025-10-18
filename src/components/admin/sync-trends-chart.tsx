"use client";

/**
 * Sync Trends Chart Component
 * Displays sync job trends over time with success/failure rates using Recharts
 */

import { useMemo } from "react";
import { format } from "date-fns";
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

type TrendDataPoint = {
  date: Date;
  platform: string;
  totalJobs: number;
  successJobs: number;
  failedJobs: number;
  successRate: number;
};

type SyncTrendsChartProps = {
  trendData: TrendDataPoint[];
};

export function SyncTrendsChart({ trendData }: SyncTrendsChartProps) {
  // Aggregate data by date (combine all platforms)
  const aggregatedData = useMemo(() => {
    const dateMap = new Map<string, { total: number; success: number; failed: number }>();

    trendData.forEach((point) => {
      const dateKey = format(point.date, "yyyy-MM-dd");
      const existing = dateMap.get(dateKey) || { total: 0, success: 0, failed: 0 };

      dateMap.set(dateKey, {
        total: existing.total + point.totalJobs,
        success: existing.success + point.successJobs,
        failed: existing.failed + point.failedJobs,
      });
    });

    return Array.from(dateMap.entries())
      .map(([date, stats]) => ({
        date,
        dateDisplay: format(new Date(date), "MMM d"),
        total: stats.total,
        success: stats.success,
        failed: stats.failed,
        successRate: stats.total > 0 ? (stats.success / stats.total) * 100 : 0,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30); // Last 30 days
  }, [trendData]);

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
        Sync Trends (Last 30 Days)
      </h2>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        {aggregatedData.length === 0 ? (
          <p className="text-center text-sm text-zinc-500 py-12 dark:text-zinc-400">
            No trend data available
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={aggregatedData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
              <XAxis
                dataKey="dateDisplay"
                className="text-xs text-zinc-500 dark:text-zinc-400"
                tick={{ fill: "currentColor" }}
              />
              <YAxis
                className="text-xs text-zinc-500 dark:text-zinc-400"
                tick={{ fill: "currentColor" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--tooltip-bg, #18181b)",
                  border: "1px solid var(--tooltip-border, #27272a)",
                  borderRadius: "0.5rem",
                  color: "var(--tooltip-text, #fafafa)",
                }}
                labelStyle={{ color: "var(--tooltip-text, #fafafa)", fontWeight: 600 }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="success"
                stackId="1"
                stroke="#22c55e"
                fill="#22c55e"
                fillOpacity={0.6}
                name="Success"
              />
              <Area
                type="monotone"
                dataKey="failed"
                stackId="1"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.6}
                name="Failed"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}

"use client";

import { useMemo, useState } from "react";

type HeatmapEntry = {
  date: Date | string;
  value: number;
};

const normalizeDate = (value: Date | string) => {
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().split("T")[0] || "";
};

interface HeatmapProps {
  data: HeatmapEntry[];
  maxValue?: number;
  colorScheme?: "green" | "blue" | "purple";
  className?: string;
}

export function ActivityHeatmap({
  data,
  maxValue,
  colorScheme = "green",
  className = "",
}: HeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<{ date: string; value: number } | null>(null);

  const { valueByDate, computedMax } = useMemo(() => {
    const map = new Map<string, number>();
    let highest = 0;

    data.forEach(({ date, value }) => {
      const key = normalizeDate(date);
      if (!key) return;
      map.set(key, value);
      if (value > highest) {
        highest = value;
      }
    });

    return { valueByDate: map, computedMax: highest };
  }, [data]);

  // Calculate max value if not provided
  const max = maxValue ?? computedMax;
  const safeMax = max === 0 ? 1 : max;

  // Get color intensity based on value
  const getColor = (value: number) => {
    if (value === 0) return "bg-neutral-100 dark:bg-neutral-800";
    const intensity = Math.ceil((value / safeMax) * 4);

    const colors = {
      green: [
        "bg-green-100 dark:bg-green-900/20",
        "bg-green-300 dark:bg-green-900/40",
        "bg-green-500 dark:bg-green-900/60",
        "bg-green-700 dark:bg-green-900/80",
        "bg-green-900 dark:bg-green-500",
      ],
      blue: [
        "bg-blue-100 dark:bg-blue-900/20",
        "bg-blue-300 dark:bg-blue-900/40",
        "bg-blue-500 dark:bg-blue-900/60",
        "bg-blue-700 dark:bg-blue-900/80",
        "bg-blue-900 dark:bg-blue-500",
      ],
      purple: [
        "bg-purple-100 dark:bg-purple-900/20",
        "bg-purple-300 dark:bg-purple-900/40",
        "bg-purple-500 dark:bg-purple-900/60",
        "bg-purple-700 dark:bg-purple-900/80",
        "bg-purple-900 dark:bg-purple-500",
      ],
    };

    return colors[colorScheme][intensity - 1];
  };

  // Generate last 52 weeks (364 days)
  const weeks: Date[][] = [];
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 364);

  // Group days into weeks
  let currentWeek: Date[] = [];
  for (let i = 0; i < 365; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    if (date.getDay() === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(date);
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Heatmap grid */}
      <div className="overflow-x-auto">
        <div className="inline-flex gap-[2px]">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-[2px]">
              {week.map((date, dayIdx) => {
                const dateStr = date.toISOString().split("T")[0] || "";
                const value = dateStr ? (valueByDate.get(dateStr) ?? 0) : 0;

                return (
                  <div
                    key={dayIdx}
                    className={`h-3 w-3 rounded-sm transition-all hover:ring-2 hover:ring-neutral-400 ${getColor(value)}`}
                    onMouseEnter={() => setHoveredCell({ date: dateStr, value })}
                    onMouseLeave={() => setHoveredCell(null)}
                    title={`${formatDate(date)}: ${value}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {hoveredCell && (
        <div className="absolute top-full left-0 z-10 mt-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
          <p className="font-medium text-neutral-900 dark:text-neutral-100">
            {hoveredCell.value} {hoveredCell.value === 1 ? "contribution" : "contributions"}
          </p>
          <p className="text-neutral-500">{formatDate(new Date(hoveredCell.date))}</p>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex items-center gap-2 text-xs text-neutral-500">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-3 w-3 rounded-sm ${
              level === 0 ? "bg-neutral-100 dark:bg-neutral-800" : getColor((safeMax / 4) * level)
            }`}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type ChartDataItem = {
  name: string;
  value: number; // 0-100 percentage for bar height
  actualValue?: number; // Optional: actual value for display in tooltip
  color?: string; // Optional Tailwind color class
};

export interface StatsCardProps {
  title: string;
  currentValue: number;
  valuePrefix?: string;
  valuePostfix?: string;
  description?: React.ReactNode;
  chartData: ChartDataItem[];
  onActionClick?: () => void;
  className?: string;
  defaultBarColor?: string;
  highlightedBarColor?: string;
}

function AnimatedNumber({
  value,
  prefix,
  postfix,
}: {
  value: number;
  prefix?: string;
  postfix?: string;
}) {
  const springValue = useSpring(0, { stiffness: 100, damping: 30 });
  const display = useTransform(springValue, (current) => Math.round(current).toLocaleString());
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    springValue.set(value);
    const unsubscribe = display.on("change", (latest) => {
      setDisplayValue(latest);
    });
    return () => unsubscribe();
  }, [value, springValue, display]);

  return (
    <span className="text-3xl font-bold tracking-tight">
      {prefix}
      {displayValue}
      {postfix}
    </span>
  );
}

export function StatsCard({
  title,
  currentValue,
  valuePrefix = "",
  valuePostfix = "",
  description,
  chartData,
  onActionClick,
  className,
  defaultBarColor = "bg-zinc-200 dark:bg-zinc-700",
  highlightedBarColor = "bg-blue-500",
}: StatsCardProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="space-y-2 pb-4">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
        <div className="flex items-baseline gap-2">
          <AnimatedNumber value={currentValue} prefix={valuePrefix} postfix={valuePostfix} />
        </div>
        {description && <p className="text-xs text-zinc-500 dark:text-zinc-400">{description}</p>}
      </CardHeader>

      <CardContent className="space-y-3 pb-6">
        <div className="flex h-32 items-end justify-between gap-1">
          {chartData.map((item, index) => {
            const heightPercentage = item.value; // value is already 0-100 percentage
            const isHovered = hoveredIndex === index;
            const isLast = index === chartData.length - 1;

            // Determine background color as actual color value, not class name
            let bgColor: string;
            if (item.color) {
              // If custom color provided, use it (but convert from Tailwind class to actual color)
              bgColor = item.color === "bg-blue-500" ? "rgb(59, 130, 246)" : "rgb(59, 130, 246)";
            } else if (isLast) {
              // Highlighted bar (last one or custom)
              bgColor = "rgb(59, 130, 246)"; // blue-500
            } else {
              // Default bar color
              bgColor = "rgb(228, 228, 231)"; // zinc-200 for light mode
            }

            return (
              <div
                key={`${item.name}-${index}`}
                className="flex h-full flex-1 flex-col items-center gap-1"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="relative flex h-full w-full items-end">
                  <motion.div
                    ref={(el) => {
                      barRefs.current[index] = el;
                    }}
                    className="w-full rounded-t-sm transition-all duration-200"
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPercentage}%` }}
                    transition={{
                      duration: 0.8,
                      delay: index * 0.05,
                      ease: [0.4, 0, 0.2, 1],
                    }}
                    style={{
                      backgroundColor: bgColor,
                      opacity: isHovered ? 0.8 : 1,
                    }}
                  />
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: -5 }}
                      className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full rounded bg-zinc-900 px-2 py-1 text-xs whitespace-nowrap text-white dark:bg-zinc-100 dark:text-zinc-900"
                    >
                      {item.actualValue !== undefined
                        ? `¥${item.actualValue.toLocaleString("zh-CN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`
                        : `${item.value.toFixed(1)}%`}
                    </motion.div>
                  )}
                </div>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">{item.name}</span>
              </div>
            );
          })}
        </div>

        {onActionClick && (
          <button
            type="button"
            onClick={onActionClick}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            View Details
          </button>
        )}
      </CardContent>
    </Card>
  );
}

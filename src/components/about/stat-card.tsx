"use client";

import Link from "next/link";
import { ArrowUpRight, TrendingDown, TrendingUp, Minus } from "lucide-react";

interface StatCardProps {
  icon: React.ReactNode | string;
  title: string;
  subtitle?: string;
  value: string | number;
  trend?: "up" | "down" | "stable";
  href?: string;
  className?: string;
}

export function StatCard({
  icon,
  title,
  subtitle,
  value,
  trend,
  href,
  className = "",
}: StatCardProps) {
  const content = (
    <div
      className={`group relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-6 transition-all hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900 ${
        href ? "cursor-pointer hover:scale-[1.02]" : ""
      } ${className}`}
    >
      {/* Icon */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-100 text-2xl dark:bg-neutral-800">
          {typeof icon === "string" ? icon : icon}
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-sm">
            {trend === "up" && (
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
            )}
            {trend === "down" && (
              <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
            )}
            {trend === "stable" && (
              <Minus className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{title}</h3>
        <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{value}</p>
        {subtitle && <p className="text-sm text-neutral-500 dark:text-neutral-500">{subtitle}</p>}
      </div>

      {/* Hover arrow for links */}
      {href && (
        <div className="absolute top-4 right-4 opacity-0 transition-opacity group-hover:opacity-100">
          <ArrowUpRight className="h-5 w-5 text-neutral-400" />
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

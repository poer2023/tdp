"use client";

import dynamic from "next/dynamic";
import type { AnalyticsDashboardProps } from "@/components/admin/analytics-dashboard";

const AnalyticsDashboardLazy = dynamic<AnalyticsDashboardProps>(
  () =>
    import("@/components/admin/analytics-dashboard").then((mod) => ({
      default: mod.AnalyticsDashboard,
    })),
  {
    ssr: false,
    loading: () => <AnalyticsDashboardSkeleton />,
  }
);

export function AnalyticsDashboardShell(props: AnalyticsDashboardProps) {
  return <AnalyticsDashboardLazy {...props} />;
}

function AnalyticsDashboardSkeleton() {
  return (
    <div className="space-y-10">
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-3xl border border-stone-200 bg-stone-100 dark:border-stone-800 dark:bg-stone-900/40"
          />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-80 animate-pulse rounded-3xl border border-stone-200 bg-stone-100 dark:border-stone-800 dark:bg-stone-900/40" />
        <div className="h-80 animate-pulse rounded-3xl border border-stone-200 bg-stone-100 dark:border-stone-800 dark:bg-stone-900/40" />
      </div>
      <div className="h-72 animate-pulse rounded-3xl border border-stone-200 bg-stone-100 dark:border-stone-800 dark:bg-stone-900/40" />
    </div>
  );
}

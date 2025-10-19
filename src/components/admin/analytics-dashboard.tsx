"use client";

import { t, type AdminLocale } from "@/lib/admin-translations";
import { TrendLineChart } from "@/app/admin/analytics/components/TrendLineChart";
import { TopPagesCard } from "@/components/ui/top-pages-card";

type PeriodOption = "7d" | "30d";

type TrendEntry = {
  date: string;
  totalViews: number;
  uniqueVisitors: number;
};

type TopPageEntry = {
  path: string;
  label: string;
  views: number;
};

type PeriodRange = {
  from: string;
  to: string;
};

type LocaleEntry = {
  locale: string | null;
  count: number;
};

export type AnalyticsOverviewData = {
  status: "ok" | "fallback";
  message?: string;
  metrics: {
    todayViews: number;
    todayUniqueVisitors: number;
    weekViews: number;
    totalVisitors: number;
    totalUsers: number;
  };
  chartData: TrendEntry[];
  topPages: Record<PeriodOption, TopPageEntry[]>;
  totalsByPeriod: Record<PeriodOption, number>;
  rangesByPeriod: Record<PeriodOption, PeriodRange>;
  deltasByPeriod: Record<PeriodOption, number | null>;
  localeDistribution: LocaleEntry[];
};

export type AnalyticsDashboardProps = {
  locale: AdminLocale;
  overview: AnalyticsOverviewData;
};

export function AnalyticsDashboard({ locale, overview }: AnalyticsDashboardProps) {
  const metrics = overview.metrics;
  const averageVisits =
    metrics.totalVisitors > 0 ? Math.round(metrics.weekViews / 7) : metrics.weekViews;

  const localeTotal = overview.localeDistribution.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="space-y-10">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title={t(locale, "todayVisits")}
          value={metrics.todayViews}
          subtitle={`${metrics.todayUniqueVisitors.toLocaleString()} ${t(locale, "uniqueVisitors")}`}
        />
        <StatCard title={t(locale, "weeklyVisits")} value={metrics.weekViews} />
        <StatCard title={t(locale, "totalVisitors")} value={metrics.totalVisitors} />
        <StatCard
          title={t(locale, "avgVisits")}
          value={averageVisits}
          subtitle={t(locale, "dailyAverage")}
        />
        <StatCard title={t(locale, "registeredUsers")} value={metrics.totalUsers} />
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="flex h-full flex-col rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {t(locale, "trendChart")}
          </h2>
          {overview.chartData.length > 0 ? (
            <TrendLineChart data={overview.chartData} locale={locale} />
          ) : (
            <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              {t(locale, "noDataYet")}
            </p>
          )}
        </div>

        <TopPagesCard
          data={overview.topPages}
          totals={overview.totalsByPeriod}
          ranges={overview.rangesByPeriod}
          deltas={overview.deltasByPeriod}
          locale={locale}
          className="h-full"
        />
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {t(locale, "languageDistribution")}
        </h2>
        <div className="space-y-4">
          {overview.localeDistribution.length > 0 ? (
            overview.localeDistribution.map((entry) => {
              const percentage =
                localeTotal > 0 ? Math.round((entry.count / localeTotal) * 100) : 0;
              const langName =
                entry.locale === "zh" ? "中文" : entry.locale === "en" ? "English" : "未知";
              const color = entry.locale === "zh" ? "blue" : "green";

              return (
                <div key={entry.locale ?? "unknown"} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{langName}</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                      {entry.count.toLocaleString()}
                    </span>
                  </div>
                  <div className="relative h-8 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className={`flex h-full items-center justify-center transition-all ${
                        color === "blue" ? "bg-blue-500" : "bg-green-500"
                      }`}
                      style={{ width: `${percentage}%` }}
                    >
                      {percentage > 15 && (
                        <span className="text-xs font-semibold text-white">{percentage}%</span>
                      )}
                    </div>
                    {percentage <= 15 && (
                      <span className="absolute top-1/2 right-3 -translate-y-1/2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        {percentage}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              {t(locale, "noDataYet")}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({ title, value, subtitle }: { title: string; value: number; subtitle?: string }) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{title}</p>
      <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
        {value.toLocaleString()}
      </p>
      {subtitle && <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>}
    </div>
  );
}

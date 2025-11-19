"use client";

import { t, type AdminLocale } from "@/lib/admin-translations";
import { TrendLineChart } from "@/app/admin/analytics/components/TrendLineChart";
import { TopPagesCard } from "@/components/ui/top-pages-card";
import { Card, CardContent, Chip } from "@/components/ui-heroui";

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
  const hasLocaleData = overview.localeDistribution.length > 0;

  return (
    <div className="space-y-8 sm:space-y-10">
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card
          variant="secondary"
          className="h-full border border-zinc-200/80 dark:border-zinc-800/80"
        >
          <CardContent className="flex h-full flex-col gap-4 p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600 dark:text-blue-400">
                {t(locale, "analytics")}
              </p>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {t(locale, "trendChart")}
              </h2>
            </div>
            {overview.chartData.length > 0 ? (
              <TrendLineChart data={overview.chartData} locale={locale} />
            ) : (
              <p className="py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
                {t(locale, "noDataYet")}
              </p>
            )}
          </CardContent>
        </Card>

        <TopPagesCard
          data={overview.topPages}
          totals={overview.totalsByPeriod}
          ranges={overview.rangesByPeriod}
          deltas={overview.deltasByPeriod}
          locale={locale}
          className="h-full"
        />
      </section>

      <Card variant="default" className="border border-zinc-200/80 dark:border-zinc-800/80">
        <CardContent className="space-y-5 p-5">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600 dark:text-blue-400">
              {t(locale, "audience")}
            </p>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {t(locale, "languageDistribution")}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {locale === "zh" ? "了解访问者语言偏好" : "See visitor language preferences"}
            </p>
          </div>

          <div className="space-y-4">
            {hasLocaleData ? (
              overview.localeDistribution.map((entry) => {
                const percentage =
                  localeTotal > 0 ? Math.round((entry.count / localeTotal) * 100) : 0;
                const langName =
                  entry.locale === "zh" ? "中文" : entry.locale === "en" ? "English" : "未知";
                const colorClass = entry.locale === "zh" ? "bg-blue-500" : "bg-emerald-500";

                return (
                  <div key={entry.locale ?? "unknown"} className="space-y-2">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">{langName}</span>
                      <Chip size="sm" variant="flat">
                        {entry.count.toLocaleString()}
                      </Chip>
                    </div>
                    <div className="relative h-3 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div
                        className={`absolute inset-y-0 left-0 rounded-full ${colorClass}`}
                        style={{ width: `${percentage}%` }}
                        aria-label={`${langName} ${percentage}%`}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                      <span>{percentage}%</span>
                      <span>{entry.locale?.toUpperCase() ?? "N/A"}</span>
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
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, subtitle }: { title: string; value: number; subtitle?: string }) {
  return (
    <Card variant="default" className="border border-zinc-200/80 dark:border-zinc-800/80">
      <CardContent className="space-y-2 p-5">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{title}</p>
        <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          {value.toLocaleString()}
        </p>
        {subtitle && <p className="text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

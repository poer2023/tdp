import prisma from "@/lib/prisma";
import { getAdminLocale, t } from "@/lib/admin-i18n";

export const revalidate = 0;

/**
 * Normalize path by removing locale prefix for statistics
 * @param path - Original path (e.g., "/zh/posts", "/en/gallery")
 * @returns Normalized path (e.g., "/posts", "/gallery") or null if should be filtered
 */
function normalizePathForStats(path: string): string | null {
  // Remove leading /zh/ or /en/ prefix
  const normalized = path.replace(/^\/(zh|en)(\/|$)/, "/");

  // Filter out root path, pure locale paths, and empty paths
  if (!normalized || normalized === "/" || normalized === "/zh" || normalized === "/en") {
    return null;
  }

  return normalized;
}

export default async function AdminAnalyticsPage() {
  const locale = await getAdminLocale();
  // Get today's date boundaries (UTC 0:00)
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  // Get 7 days ago for weekly stats
  const weekAgo = new Date(today);
  weekAgo.setUTCDate(weekAgo.getUTCDate() - 7);

  // Parallel queries for performance
  const [todayViews, weekViews, totalVisitors, rawPageViews, localeStats, last7Days] =
    await Promise.all([
      // Today's page views
      prisma.pageView.count({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),

      // This week's page views
      prisma.pageView.count({
        where: {
          createdAt: {
            gte: weekAgo,
          },
        },
      }),

      // Total unique visitors
      prisma.visitor.count(),

      // Top pages (last 7 days) - get raw data for normalization
      prisma.pageView.findMany({
        where: {
          createdAt: {
            gte: weekAgo,
          },
        },
        select: {
          path: true,
        },
      }),

      // Language distribution (last 7 days)
      prisma.pageView.groupBy({
        by: ["locale"],
        where: {
          createdAt: {
            gte: weekAgo,
          },
        },
        _count: {
          locale: true,
        },
      }),

      // Daily stats for last 7 days
      prisma.dailyStats.findMany({
        where: {
          date: {
            gte: weekAgo,
          },
        },
        orderBy: {
          date: "asc",
        },
      }),
    ]);

  // Process top pages: normalize paths and aggregate
  const pathCounts = new Map<string, number>();

  for (const view of rawPageViews) {
    const normalizedPath = normalizePathForStats(view.path);
    if (normalizedPath) {
      pathCounts.set(normalizedPath, (pathCounts.get(normalizedPath) || 0) + 1);
    }
  }

  // Convert to array, sort by count, and take top 10
  const topPages = Array.from(pathCounts.entries())
    .map(([path, count]) => ({
      path,
      _count: { path: count },
    }))
    .sort((a, b) => b._count.path - a._count.path)
    .slice(0, 10);

  // Calculate today's unique visitors
  const todayUniqueVisitors = await prisma.visitor.count({
    where: {
      lastVisit: {
        gte: today,
        lt: tomorrow,
      },
    },
  });

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="text-sm tracking-[0.3em] text-zinc-400 uppercase">{t(locale, "analytics")}</p>
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
          {t(locale, "analytics")}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{t(locale, "trafficInsights")}</p>
      </header>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title={t(locale, "todayVisits")}
          value={todayViews}
          subtitle={`${todayUniqueVisitors} ${t(locale, "uniqueVisitors")}`}
        />
        <StatCard title={t(locale, "weeklyVisits")} value={weekViews} />
        <StatCard title={t(locale, "totalVisitors")} value={totalVisitors} />
        <StatCard
          title={t(locale, "avgVisits")}
          value={totalVisitors > 0 ? Math.round(weekViews / 7) : 0}
          subtitle={t(locale, "dailyAverage")}
        />
      </div>

      {/* 7-Day Trend */}
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {t(locale, "trendChart")}
        </h2>
        <div className="space-y-2">
          {last7Days.length > 0 ? (
            <div className="space-y-2">
              {last7Days.map((day) => {
                const maxViews = Math.max(...last7Days.map((d) => d.totalViews));
                const percentage = maxViews > 0 ? (day.totalViews / maxViews) * 100 : 0;

                return (
                  <div key={day.date.toISOString()} className="flex items-center gap-4">
                    <div className="w-24 text-sm text-zinc-500 dark:text-zinc-400">
                      {day.date.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" })}
                    </div>
                    <div className="flex-1">
                      <div className="h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                        <div
                          className="h-full rounded-lg bg-blue-500 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-32 text-right text-sm">
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">
                        {day.totalViews}
                      </span>
                      <span className="ml-2 text-zinc-500 dark:text-zinc-400">
                        {day.uniqueVisitors} UV
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              {t(locale, "noDataYet")}
            </p>
          )}
        </div>
      </section>

      {/* Top Pages */}
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {t(locale, "topPages")}
        </h2>
        <div className="space-y-3">
          {topPages.length > 0 ? (
            topPages.map((page, index) => (
              <div
                key={page.path}
                className="flex items-center justify-between rounded-lg border border-zinc-100 p-3 dark:border-zinc-800"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-sm font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    {index + 1}
                  </div>
                  <span className="font-mono text-sm text-zinc-700 dark:text-zinc-300">
                    {page.path}
                  </span>
                </div>
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {page._count.path} {t(locale, "visits")}
                </span>
              </div>
            ))
          ) : (
            <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              {t(locale, "noDataYet")}
            </p>
          )}
        </div>
      </section>

      {/* Language Distribution */}
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {t(locale, "languageDistribution")}
        </h2>
        <div className="space-y-3">
          {localeStats.length > 0 ? (
            localeStats.map((stat) => {
              const total = localeStats.reduce((sum, s) => sum + s._count.locale, 0);
              const percentage = total > 0 ? Math.round((stat._count.locale / total) * 100) : 0;

              return (
                <div key={stat.locale || "unknown"} className="flex items-center gap-4">
                  <div className="w-20 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {stat.locale === "zh" ? "中文" : stat.locale === "en" ? "English" : "未知"}
                  </div>
                  <div className="flex-1">
                    <div className="h-6 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                      <div
                        className="h-full rounded-lg bg-green-500 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-24 text-right text-sm">
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                      {stat._count.locale}
                    </span>
                    <span className="ml-2 text-zinc-500 dark:text-zinc-400">({percentage}%)</span>
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

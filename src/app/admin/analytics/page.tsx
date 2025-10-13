import prisma from "@/lib/prisma";
import { getAdminLocale, t } from "@/lib/admin-i18n";
import { TopPagesList } from "./components/TopPagesList";
import { TrendLineChart } from "./components/TrendLineChart";

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

  // Extract IDs/slugs from paths for title lookup
  const postSlugs = topPages
    .filter((p) => p.path.startsWith("/posts/"))
    .map((p) => p.path.replace("/posts/", "").split("/")[0])
    .filter(Boolean);

  const momentSlugs = topPages
    .filter((p) => p.path.startsWith("/m/"))
    .map((p) => p.path.replace("/m/", "").split("/")[0])
    .filter(Boolean);

  // Fetch titles in parallel
  const [postTitles, momentTitles] = await Promise.all([
    // Fetch post titles
    postSlugs.length > 0
      ? prisma.post.findMany({
          where: { slug: { in: postSlugs } },
          select: { slug: true, title: true },
        })
      : Promise.resolve([]),
    // Fetch moment content
    momentSlugs.length > 0
      ? prisma.moment.findMany({
          where: { slug: { in: momentSlugs } },
          select: { slug: true, content: true },
        })
      : Promise.resolve([]),
  ]);

  // Create lookup maps
  const postTitleMap = new Map(postTitles.map((p) => [p.slug, p.title]));
  const momentTitleMap = new Map(
    momentTitles.map((m) => [
      m.slug,
      m.content.length > 50 ? m.content.substring(0, 50) + "..." : m.content,
    ])
  );

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

      {/* 7-Day Trend - Line Chart */}
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {t(locale, "trendChart")}
        </h2>
        {last7Days.length > 0 ? (
          <TrendLineChart data={last7Days} locale={locale} />
        ) : (
          <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            {t(locale, "noDataYet")}
          </p>
        )}
      </section>

      {/* Top Pages */}
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {t(locale, "topPages")}
        </h2>
        <div className="space-y-3">
          {topPages.length > 0 ? (
            <TopPagesList
              pages={topPages}
              postTitleMap={postTitleMap}
              momentTitleMap={momentTitleMap}
              locale={locale}
            />
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
        <div className="space-y-4">
          {localeStats.length > 0 ? (
            localeStats.map((stat) => {
              const total = localeStats.reduce((sum, s) => sum + s._count.locale, 0);
              const percentage = total > 0 ? Math.round((stat._count.locale / total) * 100) : 0;
              const langName =
                stat.locale === "zh" ? "中文" : stat.locale === "en" ? "English" : "未知";
              const color = stat.locale === "zh" ? "blue" : "green";

              return (
                <div key={stat.locale || "unknown"} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{langName}</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                      {stat._count.locale.toLocaleString()}
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

import prisma from "@/lib/prisma";
import { getAdminLocale, t } from "@/lib/admin-i18n";
import { TopPagesCard } from "@/components/ui/top-pages-card";
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

type RawPageView = { path: string };

type AggregatedPages = {
  total: number;
  entries: Array<{ path: string; views: number }>;
};

function aggregatePageViews(raw: RawPageView[]): AggregatedPages {
  const counts = new Map<string, number>();
  let total = 0;

  for (const view of raw) {
    const normalizedPath = normalizePathForStats(view.path);
    if (!normalizedPath) continue;
    counts.set(normalizedPath, (counts.get(normalizedPath) ?? 0) + 1);
    total += 1;
  }

  const entries = Array.from(counts.entries())
    .map(([path, views]) => ({ path, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  return { total, entries };
}

function fallbackLabel(path: string): string {
  const clean = decodeURIComponent(path.replace(/\/$/, ""));
  if (!clean || clean === "/") return "/";
  if (clean.startsWith("/posts/")) {
    const slug = clean.split("/")[2] ?? "";
    return slug ? `Post · ${slug.replace(/-/g, " ")}` : "Post";
  }
  if (clean.startsWith("/gallery/")) {
    const id = clean.split("/")[2] ?? "";
    return id ? `Photo · ${id}` : "Gallery";
  }
  if (clean.startsWith("/m/")) {
    const fragment = clean.split("/")[2] ?? "";
    return fragment ? `Moment · ${fragment}` : "Moments";
  }
  const parts = clean.split("/").filter(Boolean);
  const last = parts[parts.length - 1] || clean;
  return last.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

async function resolvePageLabels(paths: string[]) {
  if (paths.length === 0) return new Map<string, string>();

  const postSlugs = new Set<string>();
  const galleryIds = new Set<string>();
  const momentKeys = new Set<string>();

  for (const path of paths) {
    const trimmed = path.replace(/\/$/, "");
    if (trimmed.startsWith("/posts/")) {
      const slug = trimmed.slice("/posts/".length).split("/")[0];
      if (slug) postSlugs.add(slug);
    } else if (trimmed.startsWith("/gallery/")) {
      const id = trimmed.slice("/gallery/".length).split("/")[0];
      if (id) galleryIds.add(id);
    } else if (trimmed.startsWith("/m/")) {
      const key = trimmed.slice("/m/".length).split("/")[0];
      if (key) momentKeys.add(key);
    }
  }

  const [posts, galleryItems, moments] = await Promise.all([
    postSlugs.size
      ? prisma.post.findMany({
          where: { slug: { in: Array.from(postSlugs) } },
          select: { slug: true, title: true },
        })
      : Promise.resolve([]),
    galleryIds.size
      ? prisma.galleryImage.findMany({
          where: { id: { in: Array.from(galleryIds) } },
          select: { id: true, title: true },
        })
      : Promise.resolve([]),
    momentKeys.size
      ? prisma.moment.findMany({
          where: {
            OR: [{ slug: { in: Array.from(momentKeys) } }, { id: { in: Array.from(momentKeys) } }],
          },
          select: { id: true, slug: true, content: true },
        })
      : Promise.resolve([]),
  ]);

  const labels = new Map<string, string>();

  posts.forEach((post) => {
    labels.set(`/posts/${post.slug}`, post.title);
  });

  galleryItems.forEach((item) => {
    labels.set(
      `/gallery/${item.id}`,
      item.title && item.title.trim().length > 0 ? item.title : `Photo · ${item.id.slice(0, 6)}`
    );
  });

  moments.forEach((moment) => {
    const preview =
      moment.content && moment.content.length > 0
        ? `${moment.content.slice(0, 40)}${moment.content.length > 40 ? "…" : ""}`
        : `Moment · ${moment.id.slice(0, 6)}`;
    if (moment.slug) {
      labels.set(`/m/${moment.slug}`, preview);
    }
    labels.set(`/m/${moment.id}`, preview);
  });

  return labels;
}

export default async function AdminAnalyticsPage() {
  const locale = await getAdminLocale();
  const header = (
    <header className="space-y-3">
      <p className="text-sm tracking-[0.3em] text-zinc-400 uppercase">{t(locale, "analytics")}</p>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
        {t(locale, "analytics")}
      </h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{t(locale, "trafficInsights")}</p>
    </header>
  );
  // Get today's date boundaries (UTC 0:00)
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  // Ranges
  const weekAgo = new Date(today);
  weekAgo.setUTCDate(weekAgo.getUTCDate() - 7);
  const prevWeekStart = new Date(weekAgo);
  prevWeekStart.setUTCDate(prevWeekStart.getUTCDate() - 7);

  const monthAgo = new Date(today);
  monthAgo.setUTCDate(monthAgo.getUTCDate() - 30);
  const prevMonthStart = new Date(monthAgo);
  prevMonthStart.setUTCDate(prevMonthStart.getUTCDate() - 30);

  try {
    // Parallel queries for performance
    const [
      todayViews,
      weekViews,
      monthViews,
      previousWeekViews,
      previousMonthViews,
      totalVisitors,
      rawPageViews7d,
      rawPageViews30d,
      localeStats,
      last7Days,
    ] = await Promise.all([
      prisma.pageView.count({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
      prisma.pageView.count({
        where: {
          createdAt: {
            gte: weekAgo,
          },
        },
      }),
      prisma.pageView.count({
        where: {
          createdAt: {
            gte: monthAgo,
          },
        },
      }),
      prisma.pageView.count({
        where: {
          createdAt: {
            gte: prevWeekStart,
            lt: weekAgo,
          },
        },
      }),
      prisma.pageView.count({
        where: {
          createdAt: {
            gte: prevMonthStart,
            lt: monthAgo,
          },
        },
      }),
      prisma.visitor.count(),
      prisma.pageView.findMany({
        where: {
          createdAt: {
            gte: weekAgo,
          },
        },
        select: { path: true },
      }),
      prisma.pageView.findMany({
        where: {
          createdAt: {
            gte: monthAgo,
          },
        },
        select: { path: true },
      }),
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

    const weekAggregation = aggregatePageViews(rawPageViews7d);
    const monthAggregation = aggregatePageViews(rawPageViews30d);

    const labels = await resolvePageLabels(
      Array.from(
        new Set([
          ...weekAggregation.entries.map((item) => item.path),
          ...monthAggregation.entries.map((item) => item.path),
        ])
      )
    );

    const topPagesByPeriod = {
      "7d": weekAggregation.entries.map((entry) => ({
        path: entry.path,
        label: labels.get(entry.path) ?? fallbackLabel(entry.path),
        views: entry.views,
      })),
      "30d": monthAggregation.entries.map((entry) => ({
        path: entry.path,
        label: labels.get(entry.path) ?? fallbackLabel(entry.path),
        views: entry.views,
      })),
    } as const;

    const totalsByPeriod = {
      "7d": weekAggregation.total,
      "30d": monthAggregation.total,
    } as const;

    const rangesByPeriod = {
      "7d": { from: weekAgo, to: today },
      "30d": { from: monthAgo, to: today },
    } as const;

    const deltasByPeriod = {
      "7d":
        previousWeekViews > 0 ? ((weekViews - previousWeekViews) / previousWeekViews) * 100 : null,
      "30d":
        previousMonthViews > 0
          ? ((monthViews - previousMonthViews) / previousMonthViews) * 100
          : null,
    } as const;

    const localeTotal = localeStats.reduce((sum, stat) => sum + stat._count.locale, 0);

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
        {header}

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

        <section className="grid gap-6 md:grid-cols-2">
          <div className="flex h-full flex-col rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
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
          </div>

          <TopPagesCard
            data={topPagesByPeriod}
            totals={totalsByPeriod}
            ranges={rangesByPeriod}
            deltas={deltasByPeriod}
            locale={locale}
            className="h-full"
          />
        </section>

        {/* Language Distribution */}
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {t(locale, "languageDistribution")}
          </h2>
          <div className="space-y-4">
            {localeStats.length > 0 ? (
              localeStats.map((stat) => {
                const percentage =
                  localeTotal > 0 ? Math.round((stat._count.locale / localeTotal) * 100) : 0;
                const langName =
                  stat.locale === "zh" ? "中文" : stat.locale === "en" ? "English" : "未知";
                const color = stat.locale === "zh" ? "blue" : "green";

                return (
                  <div key={stat.locale || "unknown"} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">
                        {langName}
                      </span>
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
  } catch (error) {
    console.error("Failed to load admin analytics data", error);
    const fallbackDescription =
      locale === "zh"
        ? "无法连接到数据库，请检查后重试。"
        : "Analytics data is currently unavailable. Please check the database connection and try again.";

    return (
      <div className="space-y-10">
        {header}
        <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-100">
          <h2 className="text-lg font-semibold">{t(locale, "failedToLoadStats")}</h2>
          <p className="mt-2 text-sm">{fallbackDescription}</p>
        </section>
      </div>
    );
  }
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

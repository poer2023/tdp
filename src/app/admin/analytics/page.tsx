import prisma from "@/lib/prisma";
import { getAdminLocale, t } from "@/lib/admin-i18n";
import { features } from "@/config/features";
import type { AdminLocale } from "@/lib/admin-translations";
import type { AnalyticsOverviewData } from "@/components/admin/analytics-dashboard";
import { AnalyticsDashboardShell } from "./analytics-dashboard-shell";

export const revalidate = 0;

const SKIP_DB = process.env.E2E_SKIP_DB === "1" || process.env.E2E_SKIP_DB === "true";

type RawPageView = { path: string };
type AggregatedPages = {
  total: number;
  entries: Array<{ path: string; views: number }>;
};

/**
 * Normalize path by removing locale prefix for statistics
 */
function normalizePathForStats(path: string): string | null {
  const normalized = path.replace(/^\/(zh|en)(\/|$)/, "/");

  if (!normalized || normalized === "/" || normalized === "/zh" || normalized === "/en") {
    return null;
  }

  return normalized;
}

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

function getFallbackOverview(): AnalyticsOverviewData {
  const nowIso = new Date().toISOString();
  return {
    status: "fallback",
    metrics: {
      todayViews: 0,
      todayUniqueVisitors: 0,
      weekViews: 0,
      totalVisitors: 0,
      totalUsers: 0,
    },
    chartData: [],
    topPages: {
      "7d": [],
      "30d": [],
    },
    totalsByPeriod: {
      "7d": 0,
      "30d": 0,
    },
    rangesByPeriod: {
      "7d": { from: nowIso, to: nowIso },
      "30d": { from: nowIso, to: nowIso },
    },
    deltasByPeriod: {
      "7d": null,
      "30d": null,
    },
    localeDistribution: [],
  };
}

async function loadAnalyticsOverview(): Promise<AnalyticsOverviewData> {
  if (SKIP_DB) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Analytics overview skipped due to E2E_SKIP_DB flag.");
    }
    return getFallbackOverview();
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  const weekAgo = new Date(today);
  weekAgo.setUTCDate(weekAgo.getUTCDate() - 7);
  const prevWeekStart = new Date(weekAgo);
  prevWeekStart.setUTCDate(prevWeekStart.getUTCDate() - 7);

  const monthAgo = new Date(today);
  monthAgo.setUTCDate(monthAgo.getUTCDate() - 30);
  const prevMonthStart = new Date(monthAgo);
  prevMonthStart.setUTCDate(prevMonthStart.getUTCDate() - 30);

  try {
    const [
      todayViews,
      weekViews,
      monthViews,
      previousWeekViews,
      previousMonthViews,
      totalVisitors,
      totalUsers,
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
      prisma.user.count(),
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
      "7d": { from: weekAgo.toISOString(), to: today.toISOString() },
      "30d": { from: monthAgo.toISOString(), to: today.toISOString() },
    } as const;

    const deltasByPeriod = {
      "7d":
        previousWeekViews > 0 ? ((weekViews - previousWeekViews) / previousWeekViews) * 100 : null,
      "30d":
        previousMonthViews > 0
          ? ((monthViews - previousMonthViews) / previousMonthViews) * 100
          : null,
    } as const;

    const chartData = last7Days.map((stat) => ({
      date: stat.date.toISOString(),
      totalViews: stat.totalViews,
      uniqueVisitors: stat.uniqueVisitors,
    }));

    const todayUniqueVisitors = await prisma.visitor.count({
      where: {
        lastVisit: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    return {
      status: "ok",
      metrics: {
        todayViews,
        todayUniqueVisitors,
        weekViews,
        totalVisitors,
        totalUsers,
      },
      chartData,
      topPages: topPagesByPeriod,
      totalsByPeriod,
      rangesByPeriod,
      deltasByPeriod,
      localeDistribution: localeStats.map((stat) => ({
        locale: stat.locale,
        count: stat._count.locale,
      })),
    };
  } catch (error) {
    console.error("Failed to load admin analytics data", error);
    return getFallbackOverview();
  }
}

export default async function AdminAnalyticsPage() {
  const locale = await getAdminLocale();

  if (!features.get("adminAnalytics")) {
    return (
      <div className="space-y-10">
        <AnalyticsHeader locale={locale} />
        <section className="rounded-xl border border-stone-200 bg-white p-6 text-sm text-stone-600 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300">
          <p>
            {locale === "zh"
              ? "分析模块已关闭，请在环境变量中启用后重试。"
              : "Analytics module is disabled. Enable the feature flag to view this page."}
          </p>
        </section>
      </div>
    );
  }

  const overview = await loadAnalyticsOverview();

  if (overview.status === "fallback") {
    const fallbackDescription =
      locale === "zh"
        ? "无法连接到数据库，请检查后重试。"
        : "Analytics data is currently unavailable. Please check the database connection and try again.";

    return (
      <div className="space-y-10">
        <AnalyticsHeader locale={locale} />
        <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-100">
          <h2 className="text-lg font-semibold">{t(locale, "failedToLoadStats")}</h2>
          <p className="mt-2 text-sm">{fallbackDescription}</p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <AnalyticsHeader locale={locale} />
      <AnalyticsDashboardShell locale={locale} overview={overview} />
    </div>
  );
}

function AnalyticsHeader({ locale }: { locale: AdminLocale }) {
  return (
    <header className="space-y-3">
      <p className="text-sm tracking-[0.3em] text-stone-400 uppercase">{t(locale, "analytics")}</p>
      <h1 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl dark:text-stone-50">
        {t(locale, "analytics")}
      </h1>
      <p className="text-sm text-stone-500 dark:text-stone-400">{t(locale, "trafficInsights")}</p>
    </header>
  );
}

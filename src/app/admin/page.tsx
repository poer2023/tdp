// Admin dashboard home
import prisma from "@/lib/prisma";
import { PostStatus } from "@prisma/client";
import { MetricCard } from "@/components/admin/metric-card";
import { ActionCard } from "@/components/admin/action-card";
import { RecentPosts } from "@/components/admin/recent-posts";
import { RecentUploads } from "@/components/admin/recent-uploads";
import { PostStatsTop } from "@/components/admin/post-stats-top";
import { getAdminLocale, t } from "@/lib/admin-i18n";

export const revalidate = 0;
// Force Node.js runtime because this page queries Prisma directly
export const runtime = "nodejs";

export default async function AdminHomePage() {
  const locale = await getAdminLocale();

  // Fetch content statistics and recent activity in parallel
  const [
    totalPosts,
    publishedPosts,
    draftPosts,
    totalGallery,
    livePhotos,
    geotaggedPhotos,
    recentPosts,
    recentUploads,
  ] = await Promise.all([
    prisma.post.count(),
    prisma.post.count({ where: { status: PostStatus.PUBLISHED } }),
    prisma.post.count({ where: { status: PostStatus.DRAFT } }),
    prisma.galleryImage.count(),
    prisma.galleryImage.count({ where: { isLivePhoto: true } }),
    prisma.galleryImage.count({ where: { NOT: { latitude: null } } }),
    prisma.post.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { author: { select: { name: true } } },
    }),
    prisma.galleryImage.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  return (
    <div className="space-y-6 sm:space-y-8 md:space-y-10">
      {/* Page Header - Simplified */}
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          {t(locale, "overview")}
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {t(locale, "contentDashboard")}
        </p>
      </header>

      {/* Metrics Grid - 2 Cards (comments removed) */}
      <section className="grid gap-6 sm:grid-cols-2">
        <MetricCard
          label={t(locale, "postsLabel")}
          value={totalPosts}
          meta={`${t(locale, "published")} ${publishedPosts} · ${t(locale, "drafts")} ${draftPosts}`}
          href="/admin/posts"
        />
        <MetricCard
          label={t(locale, "galleryLabel")}
          value={totalGallery}
          meta={`${t(locale, "live")} ${livePhotos} · ${t(locale, "geotagged")} ${geotaggedPhotos}`}
          href="/admin/gallery"
        />
      </section>

      {/* Quick Actions Grid */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
          {t(locale, "quickActions")}
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <ActionCard
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            }
            title={t(locale, "posts")}
            description={t(locale, "createManageArticles")}
            primaryAction={{ label: t(locale, "newPost"), href: "/admin/posts/new" }}
          />
          <ActionCard
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            }
            title={t(locale, "gallery")}
            description={t(locale, "uploadOrganizePhotos")}
            primaryAction={{ label: t(locale, "upload"), href: "/admin/gallery" }}
          />
          <ActionCard
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            }
            title={t(locale, "analytics")}
            description={t(locale, "trafficInsights")}
            primaryAction={{ label: t(locale, "viewAnalytics"), href: "/admin/analytics" }}
          />
          <ActionCard
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                />
              </svg>
            }
            title={t(locale, "contentIO")}
            description={t(locale, "importExportContent")}
            primaryAction={{ label: t(locale, "export"), href: "/admin/export" }}
          />
        </div>
      </section>

      {/* Recent Activity Grid */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
          {t(locale, "recentActivity")}
        </h2>
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          <RecentPosts posts={recentPosts} />
          <RecentUploads images={recentUploads} locale={locale} />
          <PostStatsTop locale={locale} />
        </div>
      </section>

      {/* No page footer for admin dashboard */}
    </div>
  );
}

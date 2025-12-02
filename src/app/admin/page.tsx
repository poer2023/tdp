/**
 * Admin Dashboard Home
 *
 * @modular Metrics and activity sections can be feature-gated with `FEATURE_ADMIN_DASHBOARD`
 * @see docs/modular-development-playbook.md
 */

import dynamic from "next/dynamic";
import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { PostStatus, type Prisma } from "@prisma/client";
import { ActionCard } from "@/components/admin/action-card";
import { getAdminLocale, t } from "@/lib/admin-i18n";
import { features } from "@/config/features";
import { AdminErrorBoundary } from "@/components/error-boundaries/admin-error-boundary";
import { ModuleLoadingSkeleton } from "@/components/error-boundaries/module-error-fallback";

// Dynamic imports for dashboard sections
const DashboardMetrics = dynamic(
  () =>
    import("@/components/admin/dashboard-metrics").then((mod) => ({
      default: mod.DashboardMetrics,
    })),
  {
    loading: () => <ModuleLoadingSkeleton rows={2} />,
  }
);

const DashboardActivity = dynamic(
  () =>
    import("@/components/admin/dashboard-activity").then((mod) => ({
      default: mod.DashboardActivity,
    })),
  {
    loading: () => <ModuleLoadingSkeleton rows={3} />,
  }
);

export const revalidate = 0;
// Force Node.js runtime because this page queries Prisma directly
export const runtime = "nodejs";

const SKIP_DB = process.env.E2E_SKIP_DB === "1" || process.env.E2E_SKIP_DB === "true";
type RecentPostsResult = Prisma.PostGetPayload<{
  include: { author: { select: { name: true } } };
}>[];
type RecentUploadsResult = Awaited<ReturnType<typeof prisma.galleryImage.findMany>>;

type AdminOverviewData = {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalGallery: number;
  livePhotos: number;
  geotaggedPhotos: number;
  recentPosts: RecentPostsResult;
  recentUploads: RecentUploadsResult;
};

function getFallbackOverview(): AdminOverviewData {
  return {
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    totalGallery: 0,
    livePhotos: 0,
    geotaggedPhotos: 0,
    recentPosts: [] as RecentPostsResult,
    recentUploads: [] as RecentUploadsResult,
  };
}

async function loadAdminOverview(): Promise<AdminOverviewData> {
  if (SKIP_DB) {
    return getFallbackOverview();
  }

  try {
    console.log("[Admin Overview] Starting data load...");

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

    console.log("[Admin Overview] Data loaded successfully:", {
      totalPosts,
      publishedPosts,
      draftPosts,
      totalGallery,
      recentPostsCount: recentPosts.length,
      recentUploadsCount: recentUploads.length,
    });

    return {
      totalPosts,
      publishedPosts,
      draftPosts,
      totalGallery,
      livePhotos,
      geotaggedPhotos,
      recentPosts,
      recentUploads,
    };
  } catch (error) {
    // Always log errors to help diagnose issues
    console.error("[Admin Overview] Failed to load admin overview metrics:", error);
    console.error("[Admin Overview] Error details:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return getFallbackOverview();
  }
}

export default async function AdminHomePage() {
  const locale = await getAdminLocale();

  const {
    totalPosts,
    publishedPosts,
    draftPosts,
    totalGallery,
    livePhotos,
    geotaggedPhotos,
    recentPosts,
    recentUploads,
  } = await loadAdminOverview();

  const dashboardEnabled = features.get("adminDashboard");

  return (
    <div className="space-y-6 sm:space-y-8 md:space-y-10">
      {/* Page Header */}
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl dark:text-stone-50">
          {t(locale, "overview")}
        </h1>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          {t(locale, "contentDashboard")}
        </p>
      </header>

      {/* Metrics Grid - Feature-gated with dynamic loading */}
      {dashboardEnabled ? (
        <AdminErrorBoundary>
          <Suspense fallback={<ModuleLoadingSkeleton rows={2} />}>
            <DashboardMetrics
              totalPosts={totalPosts}
              publishedPosts={publishedPosts}
              draftPosts={draftPosts}
              totalGallery={totalGallery}
              livePhotos={livePhotos}
              geotaggedPhotos={geotaggedPhotos}
              locale={locale}
            />
          </Suspense>
        </AdminErrorBoundary>
      ) : (
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-6 text-center text-sm text-stone-500 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400">
          统计功能已禁用
        </div>
      )}

      {/* Quick Actions List - Lumina style single column */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold tracking-wider text-stone-500 uppercase dark:text-stone-400">
          {t(locale, "quickActions")}
        </h2>
        <div className="grid gap-3">
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
            title={t(locale, "tools")}
            description={t(locale, "importExportContent")}
            primaryAction={{ label: t(locale, "export"), href: "/admin/tools?tab=export" }}
          />
          <ActionCard
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            }
            title={t(locale, "syncDashboard")}
            description={t(locale, "syncNowAction")}
            primaryAction={{ label: t(locale, "syncNow"), href: "/admin/sync" }}
          />
          <ActionCard
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            }
            title={t(locale, "credentials")}
            description={t(locale, "manageCredentialsAction")}
            primaryAction={{ label: t(locale, "manage"), href: "/admin/credentials" }}
          />
        </div>
      </section>

      {/* Recent Activity Grid - Feature-gated with dynamic loading */}
      {dashboardEnabled ? (
        <AdminErrorBoundary>
          <Suspense fallback={<ModuleLoadingSkeleton rows={3} />}>
            <DashboardActivity
              recentPosts={recentPosts}
              recentUploads={recentUploads}
              locale={locale}
            />
          </Suspense>
        </AdminErrorBoundary>
      ) : (
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-6 text-center text-sm text-stone-500 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400">
          活动记录功能已禁用
        </div>
      )}
    </div>
  );
}

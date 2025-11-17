/**
 * Admin Dashboard Home
 *
 * @modular Metrics and activity sections can be feature-gated with `FEATURE_ADMIN_DASHBOARD`
 * @see docs/modular-development-playbook.md
 */

import dynamic from "next/dynamic";
import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { PostStatus, SyncJobStatus, type Prisma } from "@prisma/client";
import { getAdminLocale, t } from "@/lib/admin-i18n";
import { features } from "@/config/features";
import AdminErrorBoundary from "@/components/error-boundaries/admin-error-boundary";
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

const VisitsTrendChart = dynamic(
  () =>
    import("@/components/admin/visits-trend-chart").then((mod) => ({
      default: mod.VisitsTrendChart,
    })),
  {
    loading: () => <ModuleLoadingSkeleton rows={2} />,
  }
);

const AttentionNeeded = dynamic(
  () =>
    import("@/components/admin/attention-needed").then((mod) => ({
      default: mod.AttentionNeeded,
    })),
  {
    loading: () => <ModuleLoadingSkeleton rows={2} />,
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
type DailyStatsResult = Awaited<ReturnType<typeof prisma.dailyStats.findMany>>;
type OldDraftsResult = Prisma.PostGetPayload<{
  select: { id: true; title: true; updatedAt: true };
}>[];
type FailedSyncsResult = Prisma.SyncJobLogGetPayload<{
  select: { id: true; platform: true; startedAt: true; message: true };
}>[];
type ExpiringCredentialsResult = Prisma.ExternalCredentialGetPayload<{
  select: { id: true; platform: true; validUntil: true };
}>[];

type AdminOverviewData = {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalGallery: number;
  livePhotos: number;
  geotaggedPhotos: number;
  recentPosts: RecentPostsResult;
  recentUploads: RecentUploadsResult;
  dailyStats: DailyStatsResult;
  oldDrafts: OldDraftsResult;
  failedSyncs: FailedSyncsResult;
  expiringCredentials: ExpiringCredentialsResult;
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
    dailyStats: [] as DailyStatsResult,
    oldDrafts: [] as OldDraftsResult,
    failedSyncs: [] as FailedSyncsResult,
    expiringCredentials: [] as ExpiringCredentialsResult,
  };
}

async function loadAdminOverview(): Promise<AdminOverviewData> {
  if (SKIP_DB) {
    return getFallbackOverview();
  }

  try {
    console.log("[Admin Overview] Starting data load...");

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 90); // Get 90 days for chart

    const [
      totalPosts,
      publishedPosts,
      draftPosts,
      totalGallery,
      livePhotos,
      geotaggedPhotos,
      recentPosts,
      recentUploads,
      dailyStats,
      oldDrafts,
      failedSyncs,
      expiringCredentials,
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
      // Daily stats for last 90 days
      prisma.dailyStats.findMany({
        where: { date: { gte: thirtyDaysAgo } },
        orderBy: { date: "asc" },
      }),
      // Old drafts (>7 days)
      prisma.post.findMany({
        where: {
          status: PostStatus.DRAFT,
          updatedAt: { lt: sevenDaysAgo },
        },
        select: { id: true, title: true, updatedAt: true },
        orderBy: { updatedAt: "asc" },
        take: 5,
      }),
      // Recent failed syncs
      prisma.syncJobLog.findMany({
        where: { status: SyncJobStatus.FAILED },
        select: { id: true, platform: true, startedAt: true, message: true },
        orderBy: { startedAt: "desc" },
        take: 3,
      }),
      // Credentials expiring soon or expired
      prisma.externalCredential.findMany({
        where: {
          validUntil: { not: null },
        },
        select: { id: true, platform: true, validUntil: true },
      }),
    ]);

    console.log("[Admin Overview] Data loaded successfully:", {
      totalPosts,
      publishedPosts,
      draftPosts,
      totalGallery,
      recentPostsCount: recentPosts.length,
      recentUploadsCount: recentUploads.length,
      dailyStatsCount: dailyStats.length,
      oldDraftsCount: oldDrafts.length,
      failedSyncsCount: failedSyncs.length,
      expiringCredentialsCount: expiringCredentials.length,
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
      dailyStats,
      oldDrafts,
      failedSyncs,
      expiringCredentials,
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
    dailyStats,
    oldDrafts,
    failedSyncs,
    expiringCredentials,
  } = await loadAdminOverview();

  const dashboardEnabled = features.get("adminDashboard");

  return (
    <div className="space-y-6 sm:space-y-8 md:space-y-10">
      {/* Page Header */}
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          {t(locale, "overview")}
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
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
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          统计功能已禁用
        </div>
      )}

      {/* Visits Trend Chart - Feature-gated with dynamic loading */}
      {dashboardEnabled ? (
        <AdminErrorBoundary>
          <Suspense fallback={<ModuleLoadingSkeleton rows={2} />}>
            <VisitsTrendChart dailyStats={dailyStats} locale={locale} />
          </Suspense>
        </AdminErrorBoundary>
      ) : null}

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
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          活动记录功能已禁用
        </div>
      )}

      {/* Attention Needed - Conditionally rendered only if there are items */}
      {dashboardEnabled &&
      (oldDrafts.length > 0 || failedSyncs.length > 0 || expiringCredentials.length > 0) ? (
        <AdminErrorBoundary>
          <Suspense fallback={<ModuleLoadingSkeleton rows={2} />}>
            <AttentionNeeded
              oldDrafts={oldDrafts}
              failedSyncs={failedSyncs}
              expiringCredentials={expiringCredentials}
              locale={locale}
            />
          </Suspense>
        </AdminErrorBoundary>
      ) : null}
    </div>
  );
}

/**
 * Admin Dashboard Home - Lumina Style
 *
 * @modular Metrics and activity sections can be feature-gated with `FEATURE_ADMIN_DASHBOARD`
 * @see docs/modular-development-playbook.md
 */

import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { PostStatus, type Prisma } from "@prisma/client";
import { getAdminLocale } from "@/lib/admin-i18n";
import { t } from "@/lib/admin-translations";
import { features } from "@/config/features";
import { AdminErrorBoundary } from "@/components/error-boundaries/admin-error-boundary";
import { ModuleLoadingSkeleton } from "@/components/error-boundaries/module-error-fallback";
import { FileText, Image, Camera, Briefcase } from "lucide-react";

// Dynamic imports for dashboard sections
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
  totalMoments: number;
  totalProjects: number;
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
    totalMoments: 0,
    totalProjects: 0,
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
      totalMoments,
      totalProjects,
      recentPosts,
      recentUploads,
    ] = await Promise.all([
      prisma.post.count(),
      prisma.post.count({ where: { status: PostStatus.PUBLISHED } }),
      prisma.post.count({ where: { status: PostStatus.DRAFT } }),
      prisma.galleryImage.count(),
      prisma.galleryImage.count({ where: { isLivePhoto: true } }),
      prisma.galleryImage.count({ where: { NOT: { latitude: null } } }),
      prisma.moment.count(),
      prisma.project.count(),
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
      totalMoments,
      totalProjects,
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
      totalMoments,
      totalProjects,
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
    totalGallery,
    totalMoments,
    totalProjects,
    recentPosts,
    recentUploads,
  } = await loadAdminOverview();

  const dashboardEnabled = features.get("adminDashboard");

  const stats = [
    {
      label: t(locale, "postsLabel"),
      value: totalPosts,
      icon: FileText,
      color: "bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
    },
    {
      label: t(locale, "moments"),
      value: totalMoments,
      icon: Image,
      color: "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    },
    {
      label: t(locale, "gallery"),
      value: totalGallery,
      icon: Camera,
      color: "bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
    },
    {
      label: t(locale, "projects"),
      value: totalProjects,
      icon: Briefcase,
      color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in space-y-8">
      {/* Page Header with Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100">
            Dashboard Overview
          </h1>
          <p className="text-stone-500 dark:text-stone-400">
            {t(locale, "contentDashboard")}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/posts/new"
            className="px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-lg text-sm font-bold shadow-sm hover:opacity-90 transition-opacity"
          >
            {t(locale, "newPost")}
          </Link>
          <Link
            href="/admin/moments"
            className="px-4 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 rounded-lg text-sm font-medium hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
          >
            New Moment
          </Link>
        </div>
      </div>

      {/* Stats Grid - 4 columns */}
      {dashboardEnabled ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-stone-900 p-6 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm flex items-center gap-4"
            >
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-stone-500 dark:text-stone-400 text-xs font-bold uppercase tracking-wider">
                  {stat.label}
                </p>
                <h3 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                  {stat.value}
                </h3>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-6 text-center text-sm text-stone-500 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400">
          统计功能已禁用
        </div>
      )}

      {/* Recent Activity Grid - Feature-gated with dynamic loading */}
      {dashboardEnabled ? (
        <AdminErrorBoundary>
          <Suspense fallback={<ModuleLoadingSkeleton rows={3} />}>
            <DashboardActivity
              recentPosts={recentPosts}
              recentUploads={recentUploads}
              locale={locale}
              totalPosts={totalPosts}
              totalMoments={totalMoments}
              totalGallery={totalGallery}
              totalProjects={totalProjects}
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

/**
 * Dashboard Activity Component
 *
 * Displays enhanced activity section for admin dashboard with Lumina-style layout:
 * - Left: Content Distribution Chart (2/3 width on lg+)
 * - Right: Recent Items + System Status (1/3 width on lg+)
 *
 * Separated for dynamic loading and error isolation.
 *
 * @see docs/modular-development-playbook.md
 */

"use client";

import { ContentDistributionChart } from "./content-distribution-chart";
import { RecentItemsPanel } from "./recent-items-panel";
import { SystemStatusPanel } from "./system-status-panel";
import { t, type AdminLocale } from "@/lib/admin-translations";
import type { Prisma } from "@prisma/client";

type RecentPostsData = Prisma.PostGetPayload<{
  include: { author: { select: { name: true } } };
}>[];

type RecentUploadsData = Awaited<
  ReturnType<typeof import("@/lib/prisma").default.galleryImage.findMany>
>;

type DashboardActivityProps = {
  recentPosts: RecentPostsData;
  recentUploads: RecentUploadsData;
  locale: AdminLocale;
  isServiceDegraded?: boolean;
  // NEW: Content distribution data
  totalPosts: number;
  totalMoments: number;
  totalGallery: number;
  totalProjects: number;
};

export function DashboardActivity({
  recentPosts,
  recentUploads,
  locale,
  isServiceDegraded = false,
  totalPosts,
  totalMoments,
  totalGallery,
  totalProjects,
}: DashboardActivityProps) {
  if (isServiceDegraded) {
    return (
      <section className="space-y-4">
        <h2 className="text-sm font-semibold tracking-wider text-stone-500 uppercase dark:text-stone-400">
          {t(locale, "recentActivity")}
        </h2>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-800 dark:bg-amber-900/20">
          <p className="text-sm text-amber-600 dark:text-amber-500">
            {t(locale, "serviceTemporarilyUnavailable")}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold tracking-wider text-stone-500 uppercase dark:text-stone-400">
        {t(locale, "recentActivity")}
      </h2>

      {/* Lumina-style 3-panel layout: 2/3 chart + 1/3 panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Content Distribution Chart (2/3 width on lg+) */}
        <ContentDistributionChart
          data={{
            totalPosts,
            totalMoments,
            totalGallery,
            totalProjects,
          }}
          locale={locale}
        />

        {/* Right: Recent Items + System Status (1/3 width on lg+, stacked) */}
        <div className="space-y-6">
          <RecentItemsPanel
            recentPosts={recentPosts}
            recentUploads={recentUploads}
            locale={locale}
          />
          <SystemStatusPanel locale={locale} />
        </div>
      </div>
    </section>
  );
}

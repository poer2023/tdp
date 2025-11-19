/**
 * Dashboard Metrics Component
 *
 * Displays metric cards for admin dashboard.
 * Separated for dynamic loading and error isolation.
 *
 * @see docs/modular-development-playbook.md
 */

"use client";

import { MetricCard } from "./metric-card";
import { t, type AdminLocale } from "@/lib/admin-translations";

type DashboardMetricsProps = {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalGallery: number;
  livePhotos: number;
  geotaggedPhotos: number;
  locale: AdminLocale;
  isServiceDegraded?: boolean;
};

export function DashboardMetrics({
  totalPosts,
  publishedPosts,
  draftPosts,
  totalGallery,
  livePhotos,
  geotaggedPhotos,
  locale,
  isServiceDegraded = false,
}: DashboardMetricsProps) {
  if (isServiceDegraded) {
    return (
      <section className="grid gap-6 sm:grid-cols-2">
        <div className="flex min-h-[120px] flex-col items-center justify-center rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/60 dark:bg-amber-950/40">
          <svg
            className="mb-2 h-8 w-8 text-amber-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
            {t(locale, "metricsUnavailable")}
          </p>
          <p className="text-xs text-amber-600/80 dark:text-amber-500/80">
            {t(locale, "databaseConnectionError")}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
      <MetricCard
        label={t(locale, "postsLabel")}
        value={totalPosts}
        meta={`${draftPosts} ${t(locale, "drafts")}`}
        href="/admin/posts"
        alert={draftPosts > 0}
      />
      <MetricCard
        label={t(locale, "galleryLabel")}
        value={totalGallery}
        meta={livePhotos > 0 ? `${livePhotos} Live Photo` : undefined}
        href="/admin/gallery"
      />
      <MetricCard
        label={t(locale, "published")}
        value={publishedPosts}
        meta={t(locale, "publishedPosts")}
        href="/admin/posts"
      />
      <MetricCard
        label={t(locale, "geotagged")}
        value={geotaggedPhotos}
        meta={t(locale, "geotaggedPhotos")}
        href="/admin/gallery"
      />
    </section>
  );
}

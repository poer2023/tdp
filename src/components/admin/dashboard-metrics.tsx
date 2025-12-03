/**
 * Dashboard Metrics Component
 *
 * Displays metric cards for admin dashboard - Lumina style.
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

// Icons for metric cards
function FileTextIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10,9 9,9 8,9" />
    </svg>
  );
}

function CameraIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

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
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        label={t(locale, "postsLabel")}
        value={totalPosts}
        meta={`${t(locale, "published")} ${publishedPosts} · ${t(locale, "drafts")} ${draftPosts}`}
        href="/admin/posts"
        icon={<FileTextIcon />}
        iconColor="bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
      />
      <MetricCard
        label={t(locale, "galleryLabel")}
        value={totalGallery}
        meta={`${t(locale, "live")} ${livePhotos} · ${t(locale, "geotagged")} ${geotaggedPhotos}`}
        href="/admin/gallery"
        icon={<CameraIcon />}
        iconColor="bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
      />
    </section>
  );
}

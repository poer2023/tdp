/**
 * Dashboard Activity Component
 *
 * Displays recent activity section for admin dashboard.
 * Separated for dynamic loading and error isolation.
 *
 * @see docs/modular-development-playbook.md
 */

"use client";

import { RecentPosts } from "./recent-posts";
import { RecentUploads } from "./recent-uploads";
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
};

export function DashboardActivity({
  recentPosts,
  recentUploads,
  locale,
  isServiceDegraded = false,
}: DashboardActivityProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
        {t(locale, "recentActivity")}
      </h2>
      <div className="grid gap-6 md:grid-cols-2">
        <RecentPosts posts={recentPosts} locale={locale} isServiceDegraded={isServiceDegraded} />
        <RecentUploads
          images={recentUploads}
          locale={locale}
          isServiceDegraded={isServiceDegraded}
        />
      </div>
    </section>
  );
}

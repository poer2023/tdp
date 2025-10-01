import Link from "next/link";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { PostStatus, PostLocale, CommentStatus } from "@prisma/client";

export const revalidate = 0;

export default async function AdminHomePage() {
  const session = await auth();

  // Fetch content statistics
  const [
    totalPosts,
    enPosts,
    zhPosts,
    publishedPosts,
    draftPosts,
    pendingComments,
    totalComments,
    galleryCount,
  ] = await Promise.all([
    prisma.post.count(),
    prisma.post.count({ where: { locale: PostLocale.EN } }),
    prisma.post.count({ where: { locale: PostLocale.ZH } }),
    prisma.post.count({ where: { status: PostStatus.PUBLISHED } }),
    prisma.post.count({ where: { status: PostStatus.DRAFT } }),
    prisma.comment.count({ where: { status: CommentStatus.PENDING } }),
    prisma.comment.count(),
    prisma.galleryImage.count(),
  ]);

  return (
    <div className="space-y-12">
      {/* Page Header */}
      <header className="max-w-3xl space-y-4">
        <h1 className="text-4xl font-semibold leading-tight tracking-tight text-zinc-900 dark:text-zinc-100">
          Overview
        </h1>
        <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          Content management dashboard. Monitor posts, moderate comments, and manage content
          operations.
        </p>
      </header>

      {/* Statistics Grid */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Posts"
          value={totalPosts}
          detail={`${enPosts} EN / ${zhPosts} ZH`}
        />
        <MetricCard label="Published" value={publishedPosts} />
        <MetricCard label="Drafts" value={draftPosts} />
        <MetricCard
          label="Comments"
          value={totalComments}
          detail={pendingComments > 0 ? `${pendingComments} pending` : undefined}
          alert={pendingComments > 0}
        />
      </section>

      {/* Moderation Queue */}
      {pendingComments > 0 && (
        <section className="max-w-3xl space-y-4 border-l-2 border-zinc-900 pl-6 dark:border-zinc-100">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
            Moderation Queue
          </h2>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {pendingComments} comment{pendingComments !== 1 ? "s" : ""} awaiting review.
          </p>
          <Link
            href="/admin/comments"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-900 underline decoration-1 underline-offset-4 transition-colors duration-150 hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-400"
          >
            <span>Review comments</span>
            <span aria-hidden>→</span>
          </Link>
        </section>
      )}

      {/* Quick Actions */}
      <section className="max-w-3xl space-y-6">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Quick Actions</h2>
        <div className="divide-y divide-zinc-200 border-y border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          <ActionLink
            href="/admin/posts"
            label="Manage Posts"
            description="Create, edit, and publish blog articles"
          />
          <ActionLink
            href="/admin/comments"
            label="Moderate Comments"
            description="Review and manage user comments"
          />
          <ActionLink
            href="/admin/export"
            label="Export Content"
            description="Download posts as Markdown files"
          />
          <ActionLink
            href="/admin/import"
            label="Import Content"
            description="Upload Markdown files to create or update posts"
          />
          <ActionLink
            href="/admin/gallery"
            label="Gallery Management"
            description="Manage photo uploads and metadata"
          />
        </div>
      </section>

      {/* System Info */}
      <section className="max-w-3xl space-y-4 text-sm text-zinc-500 dark:text-zinc-500">
        <p>Logged in as {session?.user?.email}</p>
        <p>
          System Status:{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-100">Operational</span>
        </p>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  alert,
}: {
  label: string;
  value: number;
  detail?: string;
  alert?: boolean;
}) {
  return (
    <div className="space-y-3 border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{label}</p>
      <div className="space-y-1">
        <p className="text-3xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
          {value}
        </p>
        {detail && (
          <p
            className={`text-xs ${alert ? "font-medium text-zinc-900 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-500"}`}
          >
            {detail}
          </p>
        )}
      </div>
    </div>
  );
}

function ActionLink({
  href,
  label,
  description,
}: {
  href: string;
  label: string;
  description: string;
}) {
  return (
    <Link href={href} className="group block py-4 transition-colors duration-150">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-medium text-zinc-900 group-hover:text-zinc-600 dark:text-zinc-100 dark:group-hover:text-zinc-400">
            {label}
          </h3>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {description}
          </p>
        </div>
        <span
          aria-hidden
          className="text-zinc-400 transition-transform duration-150 group-hover:translate-x-0.5"
        >
          →
        </span>
      </div>
    </Link>
  );
}

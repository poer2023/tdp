import Link from "next/link";
import prisma from "@/lib/prisma";
import { CommentStatus, PostLocale } from "@prisma/client";
import { CommentModerationActions } from "@/components/admin/comment-moderation-actions";

export const revalidate = 0;

export default async function CommentsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const statusFilter = searchParams.status as CommentStatus | undefined;

  // Fetch comments with filtering
  const where = statusFilter ? { status: statusFilter } : {};

  const comments = await prisma.comment.findMany({
    where,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      post: {
        select: {
          id: true,
          title: true,
          slug: true,
          locale: true,
        },
      },
      replies: {
        select: {
          id: true,
        },
      },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  // Count by status
  const [pendingCount, publishedCount, hiddenCount] = await Promise.all([
    prisma.comment.count({ where: { status: CommentStatus.PENDING } }),
    prisma.comment.count({ where: { status: CommentStatus.PUBLISHED } }),
    prisma.comment.count({ where: { status: CommentStatus.HIDDEN } }),
  ]);

  // Get user comment history for trust signals
  const authorIds = [...new Set(comments.map((c) => c.authorId))];
  const authorStats = await Promise.all(
    authorIds.map(async (authorId) => {
      const approvedCount = await prisma.comment.count({
        where: { authorId, status: CommentStatus.PUBLISHED },
      });
      return { authorId, approvedCount };
    })
  );
  const authorStatsMap = Object.fromEntries(
    authorStats.map((s) => [s.authorId, s.approvedCount])
  );

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <header className="max-w-3xl space-y-4">
        <h1 className="text-4xl font-semibold leading-tight tracking-tight text-zinc-900 dark:text-zinc-100">
          Comments
        </h1>
        <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          Review and moderate user comments. First-time commenters require approval. Users with
          approved history are auto-published.
        </p>
      </header>

      {/* Status Filter Tabs */}
      <nav className="flex gap-6 border-b border-zinc-200 dark:border-zinc-800">
        <FilterTab
          label="Pending"
          count={pendingCount}
          active={!statusFilter || statusFilter === CommentStatus.PENDING}
          href="/admin/comments?status=PENDING"
        />
        <FilterTab
          label="Published"
          count={publishedCount}
          active={statusFilter === CommentStatus.PUBLISHED}
          href="/admin/comments?status=PUBLISHED"
        />
        <FilterTab
          label="Hidden"
          count={hiddenCount}
          active={statusFilter === CommentStatus.HIDDEN}
          href="/admin/comments?status=HIDDEN"
        />
        <FilterTab label="All" count={comments.length} active={false} href="/admin/comments" />
      </nav>

      {/* Comments List */}
      <div className="space-y-6">
        {comments.length === 0 ? (
          <div className="max-w-3xl py-12 text-center text-sm text-zinc-500 dark:text-zinc-500">
            No comments found.
          </div>
        ) : (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {comments.map((comment) => {
              const approvedCount = authorStatsMap[comment.authorId] || 0;
              const isReply = !!comment.parentId;

              return (
                <article key={comment.id} className="py-6">
                  <div className="max-w-3xl space-y-4">
                    {/* Comment Meta */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">
                            {comment.author.name || "Anonymous"}
                          </p>
                          <StatusBadge status={comment.status} />
                          {approvedCount > 0 && (
                            <span className="text-xs text-zinc-500 dark:text-zinc-500">
                              {approvedCount} approved
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                          <span>{comment.author.email}</span>
                          <span>·</span>
                          <time dateTime={comment.createdAt.toISOString()}>
                            {new Date(comment.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </time>
                        </div>
                      </div>
                    </div>

                    {/* Comment Content */}
                    <div className="prose prose-sm prose-zinc max-w-none dark:prose-invert">
                      <p className="whitespace-pre-wrap text-zinc-900 dark:text-zinc-100">
                        {comment.content}
                      </p>
                    </div>

                    {/* Post Context */}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-zinc-500 dark:text-zinc-500">
                        {isReply ? "Reply on:" : "Comment on:"}
                      </span>
                      <Link
                        href={`/${comment.post.locale === PostLocale.ZH ? "zh/" : ""}posts/${comment.post.slug}`}
                        className="font-medium text-zinc-900 underline decoration-1 underline-offset-4 transition-colors duration-150 hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-400"
                      >
                        {comment.post.title}
                      </Link>
                      {comment.replies.length > 0 && (
                        <>
                          <span className="text-zinc-400">·</span>
                          <span className="text-zinc-500 dark:text-zinc-500">
                            {comment.replies.length} {comment.replies.length === 1 ? "reply" : "replies"}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Moderation Actions */}
                    <CommentModerationActions commentId={comment.id} status={comment.status} />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterTab({
  label,
  count,
  active,
  href,
}: {
  label: string;
  count: number;
  active: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={`border-b-2 pb-3 text-sm font-medium transition-colors duration-150 ${
        active
          ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
          : "border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      }`}
    >
      {label} <span className="tabular-nums">({count})</span>
    </Link>
  );
}

function StatusBadge({ status }: { status: CommentStatus }) {
  const config = {
    [CommentStatus.PENDING]: {
      label: "Pending",
      className: "bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100",
    },
    [CommentStatus.PUBLISHED]: {
      label: "Published",
      className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400",
    },
    [CommentStatus.HIDDEN]: {
      label: "Hidden",
      className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400",
    },
  };

  const { label, className } = config[status];

  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}

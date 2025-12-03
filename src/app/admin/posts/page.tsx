import { Suspense } from "react";
import Link from "next/link";
import { PostStatus } from "@prisma/client";
import { features } from "@/config/features";
import { listAllPosts } from "@/lib/posts";
import { deletePostAction, publishPostAction, unpublishPostAction } from "./actions";
import { CreatePostForm } from "./create-post-form";
import { AdminErrorBoundary } from "@/components/error-boundaries/admin-error-boundary";
import { DeletePostButton } from "./delete-post-button";
import {
  LuminaBadge,
  LuminaEmptyState,
  LuminaRichPostItem,
} from "@/components/admin/lumina-shared";

export const revalidate = 0;

const SKIP_DB = process.env.E2E_SKIP_DB === "1" || process.env.E2E_SKIP_DB === "true";

const PostsSkeleton = () => (
  <div className="space-y-10">
    <div className="h-32 animate-pulse rounded-xl border border-stone-200 bg-stone-100 dark:border-stone-800 dark:bg-stone-900/40" />
    <div className="h-96 animate-pulse rounded-xl border border-stone-200 bg-stone-100 dark:border-stone-800 dark:bg-stone-900/40" />
  </div>
);

async function PostsListContent() {
  const posts = await listAllPosts();

  const formatDate = (value: Date | string | null | undefined) => {
    if (!value) return "—";
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="text-sm tracking-[0.3em] text-stone-400 uppercase">Posts</p>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl dark:text-stone-50">
          文章管理
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          新建、发布和维护博客文章，支持 Markdown 与封面上传。
        </p>
      </header>

      <CreatePostForm />

      {SKIP_DB && posts.length === 0 ? (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
          当前运行于数据库离线模式（E2E_SKIP_DB）。文章列表暂不可用。
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">文章列表</h2>
            <span className="text-sm text-stone-500 dark:text-stone-400">共 {posts.length} 篇</span>
          </div>

          {posts.length === 0 ? (
            <LuminaEmptyState
              title="暂无文章"
              description="可以先创建一篇草稿，再切换到卡片视图。"
              action={
                <Link href="/admin/posts/new" className="admin-primary-btn">
                  新建文章
                </Link>
              }
            />
          ) : (
            <div className="grid gap-3">
              {posts.map((post) => {
                const tags =
                  typeof post.tags === "string" && post.tags.length
                    ? post.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
                    : [];

                const status =
                  post.status === PostStatus.PUBLISHED ? (
                    <LuminaBadge variant="success">已发布</LuminaBadge>
                  ) : (
                    <LuminaBadge variant="default">草稿</LuminaBadge>
                  );

                return (
                  <LuminaRichPostItem
                    key={post.id}
                    title={post.title}
                    excerpt={post.excerpt}
                    coverUrl={post.coverImagePath ?? "/images/placeholder-cover.svg"}
                    tags={tags}
                    status={status}
                    stats={
                      <span>
                        发布于 {post.publishedAt ? formatDate(post.publishedAt) : "未发布"}
                      </span>
                    }
                    actions={
                      <>
                        <Link
                          href={`/admin/posts/${post.id}`}
                          className="rounded-full border border-stone-300 px-3 py-1 text-xs font-semibold transition hover:bg-stone-100 dark:border-stone-700 dark:text-stone-100 dark:hover:bg-stone-800"
                        >
                          编辑
                        </Link>
                        {post.status === PostStatus.PUBLISHED ? (
                          <form action={unpublishPostAction}>
                            <input type="hidden" name="id" value={post.id} />
                            <button
                              type="submit"
                              className="rounded-full border border-amber-500 px-3 py-1 text-xs font-semibold text-amber-600 transition hover:bg-amber-50 dark:border-amber-400/60 dark:text-amber-300 dark:hover:bg-amber-500/10"
                            >
                              下线
                            </button>
                          </form>
                        ) : (
                          <form action={publishPostAction}>
                            <input type="hidden" name="id" value={post.id} />
                            <button
                              type="submit"
                              className="rounded-full border border-emerald-500 px-3 py-1 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-50 dark:border-emerald-400/60 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                            >
                              发布
                            </button>
                          </form>
                        )}
                        <DeletePostButton
                          postId={post.id}
                          postTitle={post.title}
                          deleteAction={deletePostAction}
                        />
                      </>
                    }
                  />
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: PostStatus }) {
  if (status === PostStatus.PUBLISHED) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
        <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden /> 已发布
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600 dark:bg-stone-800/70 dark:text-stone-300">
      <span className="h-2 w-2 rounded-full bg-stone-400" aria-hidden /> 草稿
    </span>
  );
}

export default async function AdminPostsPage() {
  if (!features.get("adminPosts")) {
    return (
      <div className="space-y-6">
        <header className="space-y-3">
          <p className="text-sm tracking-[0.3em] text-stone-400 uppercase">Posts</p>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl dark:text-stone-50">
            文章管理
          </h1>
        </header>
        <section className="rounded-xl border border-stone-200 bg-white p-6 text-sm text-stone-600 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300">
          已禁用文章管理功能。请在环境变量中设置
          <code className="mx-2 rounded bg-stone-100 px-1 py-0.5 text-xs text-stone-700">
            FEATURE_ADMIN_POSTS=on
          </code>
          后重新部署启用。
        </section>
      </div>
    );
  }

  return (
    <AdminErrorBoundary>
      <Suspense fallback={<PostsSkeleton />}>
        <PostsListContent />
      </Suspense>
    </AdminErrorBoundary>
  );
}

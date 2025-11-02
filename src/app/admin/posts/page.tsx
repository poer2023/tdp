import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { PostStatus } from "@prisma/client";
import { features } from "@/config/features";
import { listAllPosts } from "@/lib/posts";
import { deletePostAction, publishPostAction, unpublishPostAction } from "./actions";
import { CreatePostForm } from "./create-post-form";
import { AdminErrorBoundary } from "@/components/error-boundaries/admin-error-boundary";
import { DeletePostButton } from "./delete-post-button";

export const revalidate = 0;

const SKIP_DB = process.env.E2E_SKIP_DB === "1" || process.env.E2E_SKIP_DB === "true";

const PostsSkeleton = () => (
  <div className="space-y-10">
    <div className="h-32 animate-pulse rounded-3xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/40" />
    <div className="h-96 animate-pulse rounded-3xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/40" />
  </div>
);

async function PostsListContent() {
  const posts = await listAllPosts();

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="text-sm tracking-[0.3em] text-zinc-400 uppercase">Posts</p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          文章管理
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
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
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">文章列表</h2>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">共 {posts.length} 篇</span>
          </div>

          <div className="overflow-hidden rounded-3xl border border-zinc-200/70 bg-white/80 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-900/70">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-zinc-100/80 text-xs tracking-[0.2em] text-zinc-500 uppercase dark:bg-zinc-800/60 dark:text-zinc-400">
                <tr>
                  <th className="px-6 py-4">文章</th>
                  <th className="px-6 py-4">状态</th>
                  <th className="px-6 py-4">发布时间</th>
                  <th className="px-6 py-4">操作</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} className="border-t border-zinc-200/60 dark:border-zinc-800/60">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative h-16 w-24 overflow-hidden rounded-xl bg-zinc-200 dark:bg-zinc-800">
                          <Image
                            src={post.coverImagePath ?? "/images/placeholder-cover.svg"}
                            alt="封面"
                            fill
                            sizes="96px"
                            className="object-cover"
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium text-zinc-900 dark:text-zinc-50">
                            {post.title}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">{post.excerpt}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={post.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                      {post.publishedAt
                        ? new Intl.DateTimeFormat("zh-CN", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }).format(new Date(post.publishedAt))
                        : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                        <Link
                          href={`/admin/posts/${post.id}`}
                          className="rounded-full border border-zinc-300 px-3 py-1 transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                        >
                          编辑
                        </Link>

                        {post.status === PostStatus.PUBLISHED ? (
                          <form action={unpublishPostAction}>
                            <input type="hidden" name="id" value={post.id} />
                            <button
                              type="submit"
                              className="rounded-full border border-amber-500 px-3 py-1 text-amber-600 transition hover:bg-amber-50 dark:border-amber-400/60 dark:text-amber-300 dark:hover:bg-amber-500/10"
                            >
                              下线
                            </button>
                          </form>
                        ) : (
                          <form action={publishPostAction}>
                            <input type="hidden" name="id" value={post.id} />
                            <button
                              type="submit"
                              className="rounded-full border border-emerald-500 px-3 py-1 text-emerald-600 transition hover:bg-emerald-50 dark:border-emerald-400/60 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
    <span className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-800/70 dark:text-zinc-300">
      <span className="h-2 w-2 rounded-full bg-zinc-400" aria-hidden /> 草稿
    </span>
  );
}

export default async function AdminPostsPage() {
  if (!features.get("adminPosts")) {
    return (
      <div className="space-y-6">
        <header className="space-y-3">
          <p className="text-sm tracking-[0.3em] text-zinc-400 uppercase">Posts</p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
            文章管理
          </h1>
        </header>
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          已禁用文章管理功能。请在环境变量中设置
          <code className="mx-2 rounded bg-zinc-100 px-1 py-0.5 text-xs text-zinc-700">
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

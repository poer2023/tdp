import { Suspense } from "react";
import { features } from "@/config/features";
import { listAllPosts } from "@/lib/posts";
import AdminErrorBoundary from "@/components/error-boundaries/admin-error-boundary";
import { PostsListClient } from "./posts-list-client";

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
  return <PostsListClient posts={posts} skipDb={SKIP_DB} />;
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

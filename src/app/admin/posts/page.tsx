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
import { Table, Chip, Button } from "@/components/ui-heroui";

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

          <Table variant="striped" hoverable>
            <Table.Head>
              <Table.Row>
                <Table.Header>文章</Table.Header>
                <Table.Header>状态</Table.Header>
                <Table.Header>发布时间</Table.Header>
                <Table.Header>操作</Table.Header>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {posts.map((post) => (
                <Table.Row key={post.id}>
                  <Table.Cell>
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
                  </Table.Cell>
                  <Table.Cell>
                    <StatusBadge status={post.status} />
                  </Table.Cell>
                  <Table.Cell>
                    {post.publishedAt
                      ? new Intl.DateTimeFormat("zh-CN", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }).format(new Date(post.publishedAt))
                      : "—"}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/posts/${post.id}`}>编辑</Link>
                      </Button>

                      {post.status === PostStatus.PUBLISHED ? (
                        <form action={unpublishPostAction}>
                          <input type="hidden" name="id" value={post.id} />
                          <Button type="submit" variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700">
                            下线
                          </Button>
                        </form>
                      ) : (
                        <form action={publishPostAction}>
                          <input type="hidden" name="id" value={post.id} />
                          <Button type="submit" variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700">
                            发布
                          </Button>
                        </form>
                      )}

                      <DeletePostButton
                        postId={post.id}
                        postTitle={post.title}
                        deleteAction={deletePostAction}
                      />
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </section>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: PostStatus }) {
  if (status === PostStatus.PUBLISHED) {
    return (
      <Chip status="success">
        <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden /> 已发布
      </Chip>
    );
  }

  return (
    <Chip status="default">
      <span className="h-2 w-2 rounded-full bg-zinc-400" aria-hidden /> 草稿
    </Chip>
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

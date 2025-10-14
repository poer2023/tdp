import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostById } from "@/lib/posts";
import { PostStatus } from "@prisma/client";
import { EditPostForm } from "./post-edit-form";

export const revalidate = 0;

export default async function AdminEditPostPage({ params }: { params: { id: string } }) {
  const post = await getPostById(params.id);

  if (!post) {
    notFound();
  }

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <Link
          href="/admin/posts"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400"
        >
          ← 返回列表
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          编辑文章
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          更新 Markdown 内容、封面与发布状态。
        </p>
      </header>

      <div className="grid gap-8 md:grid-cols-[1.3fr_0.7fr]">
        <EditPostForm post={post} />
        <aside className="space-y-6">
          <div className="rounded-3xl border border-zinc-200/70 bg-white/80 p-4 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-900/70">
            <h2 className="text-sm font-semibold tracking-[0.2em] text-zinc-500 uppercase dark:text-zinc-400">
              当前状态
            </h2>
            <div className="mt-4">
              <StatusBadge status={post.status} />
            </div>
            <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
              {post.publishedAt
                ? `发布于 ${new Intl.DateTimeFormat("zh-CN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }).format(new Date(post.publishedAt))}`
                : "尚未发布"}
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-200/70 bg-white/80 p-4 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-900/70">
            <h2 className="text-sm font-semibold tracking-[0.2em] text-zinc-500 uppercase dark:text-zinc-400">
              封面预览
            </h2>
            <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60">
              <Image
                src={post.coverImagePath ?? "/images/placeholder-cover.svg"}
                alt={post.title}
                width={600}
                height={340}
                className="h-auto w-full object-cover"
              />
            </div>
          </div>
        </aside>
      </div>
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

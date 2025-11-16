"use client";

import Link from "next/link";
import Image from "next/image";
import { PostStatus } from "@prisma/client";
import type { PublicPost } from "@/lib/posts";
import { deletePostAction, publishPostAction, unpublishPostAction } from "./actions";
import { CreatePostForm } from "./create-post-form";
import { DeletePostButton } from "./delete-post-button";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  Chip,
  Button,
  Alert,
} from "@/components/ui-heroui";

type PostsListClientProps = {
  posts: PublicPost[];
  skipDb: boolean;
};

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

export function PostsListClient({ posts, skipDb }: PostsListClientProps) {
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

      {skipDb && posts.length === 0 ? (
        <Alert
          status="warning"
          title="离线模式"
          description="当前运行于数据库离线模式（E2E_SKIP_DB）。文章列表暂不可用。"
        />
      ) : (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">文章列表</h2>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">共 {posts.length} 篇</span>
          </div>

          <Table variant="striped" hoverable>
            <TableHead>
              <TableRow>
                <TableHeader>文章</TableHeader>
                <TableHeader>状态</TableHeader>
                <TableHeader>发布时间</TableHeader>
                <TableHeader>操作</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>
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
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={post.status} />
                  </TableCell>
                  <TableCell>
                    {post.publishedAt
                      ? new Intl.DateTimeFormat("zh-CN", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }).format(new Date(post.publishedAt))
                      : "—"}
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      )}
    </div>
  );
}

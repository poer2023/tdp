"use client";

import { useActionState, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PostStatus } from "@prisma/client";
import type { PublicPost } from "@/lib/posts";
import { updatePostAction, type PostFormState } from "../actions";
import { Input, Textarea, Select, Button, Alert, Card, Chip } from "@/components/ui-heroui";

const INITIAL_STATE: PostFormState = {
  status: "idle",
};

export function EditPostForm({ post }: { post: PublicPost }) {
  const [state, formAction, isPending] = useActionState(updatePostAction, INITIAL_STATE);
  const [content, setContent] = useState(post.content);
  const [showPreview, setShowPreview] = useState(false);

  return (
    <Card variant="secondary">
      <Card.Header>
        <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <Card.Title>文章信息</Card.Title>
            <Card.Description>更新标题、摘要、标签、Markdown 正文与封面。</Card.Description>
          </div>
          {state.status === "success" && state.message && (
            <div className="flex flex-wrap items-center gap-3">
              <Chip status="success" size="sm">
                {state.message}
              </Chip>
              {state.previewUrl && (
                <Button asChild variant="secondary" size="sm">
                  <a href={state.previewUrl} target="_blank" rel="noopener noreferrer">
                    立即预览
                  </a>
                </Button>
              )}
            </div>
          )}
        </div>
      </Card.Header>

      <Card.Content>
        {state.status === "error" && state.message && (
          <Alert status="danger" title="保存失败" description={state.message} className="mb-4" />
        )}

        <form action={formAction} className="space-y-5">
          <input type="hidden" name="id" value={post.id} />

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="标题" error={state.errors?.title}>
            <Input
              name="title"
              type="text"
              defaultValue={post.title}
              isRequired
            />
          </Field>

          <Field label="简介" error={state.errors?.excerpt}>
            <Input
              name="excerpt"
              type="text"
              defaultValue={post.excerpt}
              isRequired
            />
          </Field>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="标签">
            <Input
              name="tags"
              type="text"
              defaultValue={post.tags.join(",")}
            />
          </Field>

          <Field label="状态">
            <Select name="status" defaultSelectedKeys={[post.status]}>
              <Select.Item id={PostStatus.DRAFT}>草稿</Select.Item>
              <Select.Item id={PostStatus.PUBLISHED}>已发布</Select.Item>
            </Select>
          </Field>
        </div>

        <Field label="封面">
          <input
            name="cover"
            type="file"
            accept="image/*"
            className="w-full text-sm text-zinc-600 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-600 hover:file:bg-blue-100 dark:text-zinc-300"
          />
          {post.coverImagePath && (
            <label className="mt-2 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <input type="checkbox" name="removeCover" className="h-3 w-3" /> 删除现有封面
            </label>
          )}
        </Field>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Field label="正文 (Markdown)" error={state.errors?.content}>
                <Textarea
                  name="content"
                  rows={14}
                  isRequired
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                />
              </Field>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onPress={() => setShowPreview((prev) => !prev)}
              className="whitespace-nowrap"
            >
              {showPreview ? "隐藏预览" : "预览 Markdown"}
            </Button>
          </div>

          {showPreview && (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/70 p-4 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
              {content ? (
                <div className="prose prose-sm prose-zinc dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  预览区域会显示 Markdown 渲染效果。
                </p>
              )}
            </div>
          )}
        </div>

          <Button type="submit" variant="primary" isDisabled={isPending}>
            {isPending ? "保存中…" : "保存修改"}
          </Button>
        </form>
      </Card.Content>
    </Card>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold tracking-[0.2em] text-zinc-500 uppercase dark:text-zinc-400">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-600 dark:text-red-300">{error}</p>}
    </div>
  );
}

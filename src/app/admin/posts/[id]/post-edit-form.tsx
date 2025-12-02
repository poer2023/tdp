"use client";

import { useActionState, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PostStatus } from "@prisma/client";
import type { PublicPost } from "@/lib/posts";
import { updatePostAction, type PostFormState } from "../actions";

const INITIAL_STATE: PostFormState = {
  status: "idle",
};

export function EditPostForm({ post }: { post: PublicPost }) {
  const [state, formAction, isPending] = useActionState(updatePostAction, INITIAL_STATE);
  const [content, setContent] = useState(post.content);
  const [showPreview, setShowPreview] = useState(false);

  return (
    <section className="rounded-3xl border border-stone-200/70 bg-white/80 p-6 shadow-sm dark:border-stone-800/70 dark:bg-stone-900/70">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">文章信息</h2>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            更新标题、摘要、标签、Markdown 正文与封面。
          </p>
        </div>
        {state.status === "success" && state.message && (
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              {state.message}
            </span>
            {state.previewUrl && (
              <a
                href={state.previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-800/60"
              >
                立即预览
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            )}
          </div>
        )}
      </div>

      {state.status === "error" && state.message && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/60 dark:text-red-200">
          {state.message}
        </p>
      )}

      <form action={formAction} className="mt-6 space-y-5">
        <input type="hidden" name="id" value={post.id} />

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="标题" error={state.errors?.title}>
            <input
              name="title"
              type="text"
              defaultValue={post.title}
              required
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
            />
          </Field>

          <Field label="简介" error={state.errors?.excerpt}>
            <input
              name="excerpt"
              type="text"
              defaultValue={post.excerpt}
              required
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
            />
          </Field>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="标签">
            <input
              name="tags"
              type="text"
              defaultValue={post.tags.join(",")}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
            />
          </Field>

          <Field label="状态">
            <select
              name="status"
              defaultValue={post.status}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
            >
              <option value={PostStatus.DRAFT}>草稿</option>
              <option value={PostStatus.PUBLISHED}>已发布</option>
            </select>
          </Field>
        </div>

        <Field label="封面">
          <input
            name="cover"
            type="file"
            accept="image/*"
            className="w-full text-sm text-stone-600 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-600 hover:file:bg-blue-100 dark:text-stone-300"
          />
          {post.coverImagePath && (
            <label className="mt-2 flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
              <input type="checkbox" name="removeCover" className="h-3 w-3" /> 删除现有封面
            </label>
          )}
        </Field>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Field label="正文 (Markdown)" error={state.errors?.content}>
                <textarea
                  name="content"
                  rows={14}
                  required
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                />
              </Field>
            </div>
            <button
              type="button"
              onClick={() => setShowPreview((prev) => !prev)}
              className="inline-flex items-center rounded-full border border-stone-300 px-3 py-1 text-xs font-semibold whitespace-nowrap text-stone-600 transition hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              {showPreview ? "隐藏预览" : "预览 Markdown"}
            </button>
          </div>

          {showPreview && (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-white/70 p-4 text-sm shadow-sm dark:border-stone-700 dark:bg-stone-900/70">
              {content ? (
                <div className="prose prose-sm prose-zinc dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  预览区域会显示 Markdown 渲染效果。
                </p>
              )}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "保存中…" : "保存修改"}
        </button>
      </form>
    </section>
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
      <label className="block text-xs font-semibold tracking-[0.2em] text-stone-500 uppercase dark:text-stone-400">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-600 dark:text-red-300">{error}</p>}
    </div>
  );
}

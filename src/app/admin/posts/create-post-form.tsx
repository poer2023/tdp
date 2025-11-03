"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createPostAction, type PostFormState } from "./actions";

const INITIAL_STATE: PostFormState = {
  status: "idle",
};

export function CreatePostForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createPostAction, INITIAL_STATE);
  const [content, setContent] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (state.status === "success" && state.redirectTo) {
      router.push(state.redirectTo);
      return;
    }

    if (state.status !== "success") return;

    if (state.redirectTo) {
      router.push(state.redirectTo);
      return;
    }

    formRef.current?.reset();
    startTransition(() => {
      setContent("");
    });
  }, [state, router]);

  return (
    <section className="rounded-3xl border border-zinc-200/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-900/70">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">创建新文章</h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            上传封面、填写 Markdown 内容并设置标签。
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

      <form ref={formRef} action={formAction} className="mt-6 grid gap-5 md:grid-cols-2">
        <div className="space-y-4 md:col-span-1">
          <Field label="标题" error={state.errors?.title}>
            <input
              name="title"
              type="text"
              required
              placeholder="例如：使用 Next.js 打造清新博客"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </Field>

          <Field label="简介" error={state.errors?.excerpt}>
            <input
              name="excerpt"
              type="text"
              required
              placeholder="一句话概括文章核心"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </Field>

          <Field label="标签">
            <input
              name="tags"
              type="text"
              placeholder="使用逗号分隔多个标签"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </Field>

          <Field label="状态">
            <select
              name="status"
              defaultValue="DRAFT"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <option value="DRAFT">草稿</option>
              <option value="PUBLISHED">立即发布</option>
            </select>
          </Field>

          <Field label="封面">
            <input
              name="cover"
              type="file"
              accept="image/*"
              className="w-full text-sm text-zinc-600 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-600 hover:file:bg-blue-100 dark:text-zinc-300"
            />
          </Field>
        </div>

        <div className="space-y-4 md:col-span-1">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Field label="正文 (支持 Markdown)" error={state.errors?.content}>
                  <textarea
                    name="content"
                    rows={12}
                    required
                    placeholder="支持 **粗体**、`代码`、列表等 Markdown 语法"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                  />
                </Field>
              </div>
              <button
                type="button"
                onClick={() => setShowPreview((prev) => !prev)}
                className="inline-flex items-center rounded-full border border-zinc-300 px-3 py-1 text-xs font-semibold whitespace-nowrap text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                {showPreview ? "隐藏预览" : "预览 Markdown"}
              </button>
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

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "创建中…" : "发布文章"}
          </button>
        </div>
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
    <div className="space-y-1">
      <label className="block text-xs font-semibold tracking-[0.2em] text-zinc-500 uppercase dark:text-zinc-400">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-600 dark:text-red-300">{error}</p>}
    </div>
  );
}

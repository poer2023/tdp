"use client";

import { useActionState, useEffect, useRef } from "react";
import { uploadGalleryImageAction, type GalleryFormState } from "./actions";
import type { PostSummary } from "@/lib/posts";

const INITIAL_STATE: GalleryFormState = {
  status: "idle",
};

export function GalleryUploadForm({ posts }: { posts: PostSummary[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(uploadGalleryImageAction, INITIAL_STATE);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <section className="rounded-3xl border border-zinc-200/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-900/70">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">上传照片</h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            支持 JPG/PNG/WebP/AVIF 等格式，可选关联到文章。
          </p>
        </div>
        {state.status === "success" && state.message && (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            {state.message}
          </span>
        )}
      </div>

      {state.status === "error" && state.message && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/60 dark:text-red-200">
          {state.message}
        </p>
      )}

      <form ref={formRef} action={formAction} className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <Field label="标题 (可选)">
            <input
              name="title"
              type="text"
              placeholder="为照片添加一个标题"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </Field>

          <Field label="描述 (可选)">
            <textarea
              name="description"
              rows={3}
              placeholder="记录照片背后的故事"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </Field>

          <Field label="关联文章 (可选)">
            <select
              name="postId"
              defaultValue=""
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <option value="">不关联文章</option>
              {posts.map((post) => (
                <option key={post.id} value={post.id}>
                  {post.title}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="flex flex-col gap-4">
          <Field label="图片文件" required>
            <input
              name="file"
              type="file"
              required
              accept="image/*"
              className="w-full text-sm text-zinc-600 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-600 hover:file:bg-blue-100 dark:text-zinc-300"
            />
          </Field>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "上传中…" : "上传到相册"}
          </button>
        </div>
      </form>
    </section>
  );
}

function Field({
  label,
  children,
  required,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold tracking-[0.2em] text-zinc-500 uppercase dark:text-zinc-400">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </label>
      {children}
    </div>
  );
}

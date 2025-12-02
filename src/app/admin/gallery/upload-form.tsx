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
    <section className="rounded-3xl border border-stone-200/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-stone-800/70 dark:bg-stone-900/70">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">上传照片</h2>
          <p className="text-xs leading-relaxed text-stone-500 dark:text-stone-400">
            自动提取 EXIF 元数据和 GPS 坐标。HEIC 格式将自动转换为 JPEG。Live Photo
            需同时选择图片和视频文件（同名配对）。
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
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
            />
          </Field>

          <Field label="描述 (可选)">
            <textarea
              name="description"
              rows={3}
              placeholder="记录照片背后的故事"
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
            />
          </Field>

          <Field label="分类">
            <select
              name="category"
              defaultValue="REPOST"
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
            >
              <option value="REPOST">转发</option>
              <option value="ORIGINAL">拍照</option>
              <option value="AI">AI</option>
            </select>
          </Field>

          <Field label="关联文章 (可选)">
            <select
              name="postId"
              defaultValue=""
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
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
          <Field label="文件上传" required>
            <input
              name="files"
              type="file"
              required
              accept="image/*,video/quicktime,video/mp4"
              multiple
              className="w-full text-sm text-stone-600 file:mr-4 file:rounded-lg file:border file:border-stone-300 file:bg-white file:px-4 file:py-2 file:text-sm file:font-medium file:text-stone-900 file:transition-all hover:file:bg-stone-50 dark:text-stone-300 dark:file:border-stone-700 dark:file:bg-stone-900 dark:file:text-stone-100"
            />
            <p className="mt-1.5 text-xs leading-relaxed text-stone-500 dark:text-stone-400">
              支持 JPG/PNG/WebP/HEIC 图片格式。HEIC 将自动转换为 JPEG。
              <br />
              <strong>Live Photo 上传</strong>：需同时选择图片和视频（文件名相同，如 IMG_1234.HEIC +
              IMG_1234.MOV），系统将自动识别配对关系。
            </p>
          </Field>

        <button
          type="submit"
          disabled={isPending}
          className="admin-primary-btn"
        >
          {isPending ? "处理中…" : "上传照片"}
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
      <label className="block text-xs font-semibold tracking-[0.2em] text-stone-500 uppercase dark:text-stone-400">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </label>
      {children}
    </div>
  );
}

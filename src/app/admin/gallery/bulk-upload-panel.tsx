"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { bulkUploadGalleryAction, type BulkUploadState } from "./bulk-actions";
import type { PostSummary } from "@/lib/posts";
import { useRouter } from "next/navigation";

const INITIAL: BulkUploadState = { status: "idle" };

export function BulkUploadPanel({}: { posts?: PostSummary[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [state, formAction, pending] = useActionState(bulkUploadGalleryAction, INITIAL);
  const router = useRouter();
  const [postQuery, setPostQuery] = useState("");
  const [postOptions, setPostOptions] = useState<Array<{ id: string; title: string }>>([]);
  const [selectedPostId, setSelectedPostId] = useState<string>("");

  // Fetch post suggestions
  useEffect(() => {
    const q = postQuery.trim();
    if (!q) return setPostOptions([]);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/posts/search?q=${encodeURIComponent(q)}`, {
          signal: ctrl.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setPostOptions(data.results || []);
        }
      } catch {}
    }, 250);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [postQuery]);

  const totalSize = useMemo(() => files.reduce((s, f) => s + f.size, 0), [files]);

  // Build grouped items for progress uploads
  type Item = {
    key: string;
    image?: File;
    video?: File;
    progress: number;
    status: "idle" | "uploading" | "done" | "error" | "cancelled";
    error?: string;
    id?: string;
    xhr?: XMLHttpRequest | null;
  };

  const [items, setItems] = useState<Item[]>([]);

  // Warn when leaving the page during active uploads
  const hasUploading = useMemo(() => items.some((it) => it.status === "uploading"), [items]);
  useEffect(() => {
    if (!hasUploading) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ""; // Some browsers show a generic message
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasUploading]);

  const groupFiles = useCallback(function groupFiles(input: File[]): Item[] {
    const map = new Map<string, Item>();
    for (const f of input) {
      const key = f.name.replace(/\.[^.]+$/, "").toLowerCase();
      const isImage =
        f.type.startsWith("image/") || /\.(heic|heif|jpe?g|png|webp|gif)$/i.test(f.name);
      const isVideo = f.type.startsWith("video/") || /\.(mov|mp4)$/i.test(f.name);
      if (!isImage && !isVideo) continue;
      if (!map.has(key)) map.set(key, { key, progress: 0, status: "idle" });
      const it = map.get(key)!;
      if (isImage) it.image = it.image || f;
      if (isVideo) it.video = it.video || f;
    }
    return Array.from(map.values());
  }, []);

  useEffect(() => {
    setItems(groupFiles(files));
  }, [files, groupFiles]);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files || []);
    setFiles(list);
  }

  function onDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    const list = Array.from(e.dataTransfer.files || []);
    setFiles(list);
    // Reflect to hidden input for form submit
    if (fileInputRef.current) {
      const dt = new DataTransfer();
      list.forEach((f) => dt.items.add(f));
      fileInputRef.current.files = dt.files;
    }
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  async function uploadOne(index: number): Promise<void> {
    setItems((arr) => {
      const next = [...arr];
      if (!next[index]) return arr;
      next[index].status = "uploading";
      next[index].progress = 0;
      next[index].error = undefined;
      return next;
    });

    const it = items[index];
    if (!it || !it.image) {
      setItems((arr) => {
        const next = [...arr];
        if (next[index]) {
          next[index].status = "error";
          next[index].error = "缺少图片文件";
        }
        return next;
      });
      return;
    }

    const fd = new FormData();
    fd.append("image", it.image);
    if (it.video) fd.append("video", it.video);
    const title =
      (formRef.current?.querySelector('input[name="title"]') as HTMLInputElement | null)?.value ||
      "";
    const description =
      (formRef.current?.querySelector('textarea[name="description"]') as HTMLTextAreaElement | null)
        ?.value || "";
    const category =
      (formRef.current?.querySelector('select[name="category"]') as HTMLSelectElement | null)
        ?.value || "ORIGINAL";
    const postId =
      selectedPostId ||
      (formRef.current?.querySelector('select[name="postId"]') as HTMLSelectElement | null)
        ?.value ||
      "";
    if (title) fd.append("title", title);
    if (description) fd.append("description", description);
    if (category) fd.append("category", category);
    if (postId) fd.append("postId", postId);

    await new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/admin/gallery/upload");
      xhr.upload.onprogress = (ev) => {
        if (!ev.lengthComputable) return;
        const prog = Math.round((ev.loaded / ev.total) * 100);
        setItems((arr) => {
          const next = [...arr];
          if (next[index]) next[index].progress = prog;
          return next;
        });
      };
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          try {
            const ok = xhr.status >= 200 && xhr.status < 300;
            const payload = ok ? JSON.parse(xhr.responseText || "{}") : null;
            setItems((arr) => {
              const next = [...arr];
              if (next[index]) {
                next[index].status = ok ? "done" : "error";
                next[index].id = payload?.image?.id || undefined;
                next[index].error = ok ? undefined : payload?.error || `HTTP ${xhr.status}`;
                next[index].progress = ok ? 100 : next[index].progress;
                next[index].xhr = null;
              }
              return next;
            });
          } catch {
            setItems((arr) => {
              const next = [...arr];
              if (next[index]) {
                next[index].status = "error";
                next[index].error = "解析响应失败";
                next[index].xhr = null;
              }
              return next;
            });
          }
          resolve();
          // 刷新数据
          router.refresh();
        }
      };
      xhr.onerror = () => {
        setItems((arr) => {
          const next = [...arr];
          if (next[index]) {
            next[index].status = "error";
            next[index].error = "网络错误";
            next[index].xhr = null;
          }
          return next;
        });
        resolve();
      };
      xhr.onabort = () => {
        setItems((arr) => {
          const next = [...arr];
          if (next[index]) {
            next[index].status = "cancelled";
            next[index].xhr = null;
          }
          return next;
        });
        resolve();
      };
      xhr.send(fd);
      setItems((arr) => {
        const next = [...arr];
        if (next[index]) next[index].xhr = xhr;
        return next;
      });
    });
  }

  const CONCURRENCY = 3;
  async function startAll() {
    const pendingIdx = items
      .map((it, i) => (it.status === "idle" || it.status === "error" ? i : -1))
      .filter((i) => i >= 0);
    let cursor = 0;
    const workers: Promise<void>[] = [];
    for (let c = 0; c < Math.min(CONCURRENCY, pendingIdx.length); c++) {
      const run = async () => {
        while (cursor < pendingIdx.length) {
          const idx = pendingIdx[cursor++]!;
          await uploadOne(idx);
        }
      };
      workers.push(run());
    }
    await Promise.all(workers);
  }

  function cancelOne(i: number) {
    const it = items[i];
    if (it?.xhr) it.xhr.abort();
  }

  return (
    <section
      data-testid="bulk-upload-panel"
      className="rounded-3xl border border-zinc-200/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-900/70"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">批量上传</h2>
          <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            一次选择/拖拽多张图片。可自动配对同名 HEIC/JPEG 与 MOV 为 Live Photo。
          </p>
        </div>
        {state.message && (
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              state.status === "error"
                ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
            }`}
          >
            {state.message}
          </span>
        )}
      </div>

      <form ref={formRef} action={formAction} className="grid gap-6 md:grid-cols-3">
        <div className="space-y-4 md:col-span-2">
          <label
            onDrop={onDrop}
            onDragOver={onDragOver}
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            <input
              ref={fileInputRef}
              name="files"
              type="file"
              className="hidden"
              accept="image/*,video/quicktime,video/mp4"
              multiple
              onChange={onPick}
            />
            <div className="text-zinc-700 dark:text-zinc-300">拖拽文件到此处或点击选择</div>
            <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              支持 JPG/PNG/WebP/HEIC 图片，和 MOV/MP4 视频（Live Photo 配对）。
            </div>
          </label>

          {files.length > 0 && (
            <ul className="max-h-60 overflow-auto rounded-lg border border-zinc-200 text-sm dark:border-zinc-800">
              {files.map((f) => (
                <li
                  key={f.name + f.size}
                  className="flex items-center justify-between border-b border-zinc-200 px-3 py-2 last:border-b-0 dark:border-zinc-800"
                >
                  <span className="truncate text-zinc-700 dark:text-zinc-300" title={f.name}>
                    {f.name}
                  </span>
                  <span className="ml-3 shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                    {(f.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          <Field label="标题 (可选)">
            <input
              name="title"
              type="text"
              placeholder="为照片添加统一标题（可在批量编辑中再调整）"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </Field>
          <Field label="描述 (可选)">
            <textarea
              name="description"
              rows={4}
              placeholder="批量设置一个统一描述"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </Field>
          <Field label="分类">
            <select
              name="category"
              defaultValue="ORIGINAL"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <option value="REPOST">转发</option>
              <option value="ORIGINAL">拍照</option>
              <option value="AI">AI</option>
            </select>
          </Field>
          <Field label="关联文章 (可选)">
            <div className="relative">
              <input
                type="text"
                placeholder="输入标题关键字搜索文章"
                value={postQuery}
                onChange={(e) => setPostQuery(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
              {postOptions.length > 0 && (
                <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                  {postOptions.map((o) => (
                    <li key={o.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPostId(o.id);
                          setPostQuery(o.title);
                          setPostOptions([]);
                        }}
                        className="block w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        {o.title}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <input type="hidden" name="postId" value={selectedPostId} />
            </div>
          </Field>

          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>
              共 {files.length} 个文件 · {(totalSize / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
          <button
            type="submit"
            disabled={pending || files.length === 0}
            className="w-full rounded-lg border border-zinc-900 bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {pending ? "上传中…" : "开始上传"}
          </button>

          <button
            type="button"
            onClick={startAll}
            disabled={items.length === 0}
            className="w-full rounded-lg border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-blue-400 dark:bg-blue-400 dark:text-zinc-900"
          >
            走队列上传（带进度）
          </button>
        </div>
      </form>

      {state.results && state.results.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-3 py-2">文件组</th>
                <th className="px-3 py-2">状态</th>
                <th className="px-3 py-2">ID</th>
              </tr>
            </thead>
            <tbody>
              {state.results.map((r) => (
                <tr key={r.key} className="border-t border-zinc-200 dark:border-zinc-800">
                  <td className="px-3 py-2 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                    {r.key}
                  </td>
                  <td className="px-3 py-2">
                    {r.ok ? (
                      <span className="text-emerald-600 dark:text-emerald-400">成功</span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400">失败</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-zinc-500 dark:text-zinc-400">
                    {r.id || r.error}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-3 py-2">文件组</th>
                <th className="px-3 py-2">进度</th>
                <th className="px-3 py-2">状态</th>
                <th className="px-3 py-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr
                  key={it.key}
                  className="border-t border-zinc-200 align-middle dark:border-zinc-800"
                >
                  <td className="px-3 py-2 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                    {it.key}
                  </td>
                  <td className="px-3 py-2">
                    <div className="h-2 w-40 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-800">
                      <div
                        className="h-2 bg-blue-600 transition-all"
                        style={{ width: `${it.progress}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {it.status === "idle" && <span className="text-zinc-500">等待</span>}
                    {it.status === "uploading" && (
                      <span className="text-blue-600">上传中… {it.progress}%</span>
                    )}
                    {it.status === "done" && <span className="text-emerald-600">成功</span>}
                    {it.status === "error" && (
                      <span className="text-red-600">失败: {it.error}</span>
                    )}
                    {it.status === "cancelled" && <span className="text-zinc-500">已取消</span>}
                  </td>
                  <td className="px-3 py-2">
                    {it.status !== "uploading" && (
                      <button
                        type="button"
                        onClick={() => uploadOne(i)}
                        className="mr-2 rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                      >
                        {it.status === "error" ? "重试" : "开始"}
                      </button>
                    )}
                    {it.status === "uploading" && (
                      <button
                        type="button"
                        onClick={() => cancelOne(i)}
                        className="rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                      >
                        取消
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold tracking-[0.2em] text-zinc-500 uppercase dark:text-zinc-400">
        {label}
      </label>
      {children}
    </div>
  );
}

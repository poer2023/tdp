"use client";

import { useActionState, useEffect, useRef, useState, startTransition, Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createMomentAction, type CreateMomentState } from "@/app/[locale]/m/actions";
import { useSession } from "next-auth/react";

type LocalImage = { file: File; url: string };

// Inner component that uses useSearchParams - must be wrapped in Suspense
function MomentComposerCore() {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<CreateMomentState, FormData>(createMomentAction, {
    status: "idle",
  });
  const formRef = useRef<HTMLFormElement>(null);
  const [text, setText] = useState("");
  const [images, setImages] = useState<LocalImage[]>([]);

  useEffect(() => {
    const handler = () => setOpen(true);
    const listener: EventListener = () => handler();
    window.addEventListener("open-moment-composer", listener);
    return () => window.removeEventListener("open-moment-composer", listener);
  }, []);

  // URL 驱动：?compose=1 时自动打开；关闭时清理该参数
  useEffect(() => {
    if (sp.get("compose") === "1") {
      setOpen(true);
    }
  }, [sp]);

  function close() {
    setOpen(false);
    // 清理 URL 中的 compose 参数
    try {
      const params = new URLSearchParams(sp.toString());
      if (params.get("compose") === "1") {
        params.delete("compose");
        router.replace(params.size ? `${pathname}?${params.toString()}` : pathname, {
          scroll: false,
        });
      }
    } catch {}
  }

  // Global shortcuts: Cmd/Ctrl+J to open; drag files to open & attach
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setOpen(true);
      }
    };
    const onDrop = (e: DragEvent) => {
      if (!e.dataTransfer) return;
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
      if (!files.length) return;
      e.preventDefault();
      setOpen(true);
      setImages((prev) =>
        prev.concat(
          files.slice(0, 9 - prev.length).map((f) => ({ file: f, url: URL.createObjectURL(f) }))
        )
      );
    };
    const onDragOver = (e: DragEvent) => {
      if (Array.from(e.dataTransfer?.items || []).some((i) => i.type.startsWith("image/"))) {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("drop", onDrop);
    window.addEventListener("dragover", onDragOver);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("drop", onDrop);
      window.removeEventListener("dragover", onDragOver);
    };
  }, []);

  useEffect(() => {
    if (state.status === "success") {
      setText("");
      setImages([]);
      setOpen(false);
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <>
      {/* FAB */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-5 bottom-5 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg md:hidden"
        aria-label="Add moment"
      >
        +
      </button>

      {/* Modal Dialog */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={close}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl dark:bg-[#0b0b0d]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">新建瞬间</h3>
              <button
                onClick={close}
                className="rounded p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                aria-label="关闭"
              >
                ×
              </button>
            </div>
            {status !== "authenticated" ? (
              <div className="py-10 text-center text-sm text-zinc-600 dark:text-zinc-400">
                请先登录后再发布瞬间。
                <div className="mt-4">
                  <Link
                    href="/login"
                    className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
                  >
                    前往登录
                  </Link>
                </div>
              </div>
            ) : (
              <form
                ref={formRef}
                className="space-y-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const fd = new FormData();
                  fd.set("content", text);
                  const vis =
                    (
                      formRef.current?.querySelector(
                        'select[name="visibility"]'
                      ) as HTMLSelectElement | null
                    )?.value || "PUBLIC";
                  fd.set("visibility", vis);
                  for (const im of images) fd.append("images", im.file, im.file.name);
                  // Trigger server action inside a transition so isPending works correctly
                  startTransition(() => {
                    void action(fd);
                  });
                }}
              >
                <textarea
                  name="content"
                  maxLength={1000}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="此刻…"
                  className="h-28 w-full resize-none rounded-lg border border-zinc-300 bg-white p-2 text-sm outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
                />
                {/* Images preview grid */}
                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {images.map((im, idx) => (
                      <div key={idx} className="relative overflow-hidden rounded-lg">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={im.url} alt="preview" className="h-24 w-full object-cover" />
                        <div className="absolute top-1 right-1 flex gap-1">
                          <button
                            type="button"
                            className="rounded bg-black/40 px-1 text-[10px] text-white"
                            onClick={() => setImages((arr) => arr.filter((_, i) => i !== idx))}
                          >
                            ×
                          </button>
                          {idx > 0 && (
                            <button
                              type="button"
                              className="rounded bg-black/40 px-1 text-[10px] text-white"
                              onClick={() =>
                                setImages((arr) => {
                                  const a = arr.slice();
                                  const t = a[idx - 1]!;
                                  a[idx - 1] = a[idx]!;
                                  a[idx] = t;
                                  return a;
                                })
                              }
                            >
                              ↑
                            </button>
                          )}
                          {idx < images.length - 1 && (
                            <button
                              type="button"
                              className="rounded bg-black/40 px-1 text-[10px] text-white"
                              onClick={() =>
                                setImages((arr) => {
                                  const a = arr.slice();
                                  const t = a[idx + 1]!;
                                  a[idx + 1] = a[idx]!;
                                  a[idx] = t;
                                  return a;
                                })
                              }
                            >
                              ↓
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
                      <input
                        type="file"
                        name="images"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          setImages((prev) =>
                            prev.concat(
                              Array.from(e.target.files || [])
                                .slice(0, 9 - prev.length)
                                .map((f) => ({ file: f, url: URL.createObjectURL(f) }))
                            )
                          )
                        }
                      />
                      📷 添加图片
                    </label>
                    <select
                      name="visibility"
                      className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                    >
                      <option value="PUBLIC">公开</option>
                      <option value="UNLISTED">未收录</option>
                      <option value="PRIVATE">私密</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={pending || (!text && images.length === 0)}
                    className="inline-flex items-center rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
                  >
                    {pending ? "发布中…" : "发布"}
                  </button>
                </div>
                {/* Advanced options: tags, location, schedule */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <input
                    name="tags"
                    placeholder="标签（逗号分隔，最多5个）"
                    className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                  />
                  <input
                    name="locationName"
                    placeholder="地点（可选）"
                    className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                  />
                  <input
                    type="datetime-local"
                    name="scheduledAt"
                    className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </div>
                {state.status === "error" && (
                  <p className="text-xs text-red-600">{state.message}</p>
                )}
              </form>
            )}
            {/* end form */}
          </div>
        </div>
      )}
    </>
  );
}

// Main export component with Suspense boundary
export function MomentComposerBottomSheet() {
  return (
    <Suspense fallback={null}>
      <MomentComposerCore />
    </Suspense>
  );
}

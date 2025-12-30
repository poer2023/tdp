"use client";

import React, { useEffect, useState, startTransition, Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

type LocalImage = { file: File; url: string };
type CreateMomentState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; id: string };

// Inner component that uses useSearchParams - must be wrapped in Suspense
function MomentComposerCore() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<CreateMomentState>({ status: "idle" });
  const [pending, setPending] = useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);
  const [text, setText] = useState("");
  const [images, setImages] = useState<LocalImage[]>([]);
  const imagesRef = React.useRef<LocalImage[]>([]);
  const revokeUrls = (list: LocalImage[]) => {
    list.forEach((im) => URL.revokeObjectURL(im.url));
  };
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);
  useEffect(() => () => revokeUrls(imagesRef.current), []);

  // Check if user is admin
  const isAdmin = session?.user?.role === "ADMIN";

  // Hide on admin routes
  const isAdminRoute = pathname?.startsWith("/admin");

  useEffect(() => {
    const handler = () => setOpen(true);
    const listener: EventListener = () => handler();
    window.addEventListener("open-moment-composer", listener);
    return () => window.removeEventListener("open-moment-composer", listener);
  }, []);

  // URL 驱动：?compose=1 时自动打开；关闭时清理该参数
  useEffect(() => {
    if (sp.get("compose") === "1") {
      startTransition(() => setOpen(true));
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
    } catch { }
  }

  // Global shortcuts: Cmd/Ctrl+J to open (admin only); drag files to open & attach
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        if (isAdmin) {
          startTransition(() => setOpen(true));
        }
      }
    };
    const onDrop = (e: DragEvent) => {
      if (!isAdmin || !e.dataTransfer) return;
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
      if (!files.length) return;
      e.preventDefault();
      startTransition(() => {
        setOpen(true);
        setImages((prev) =>
          prev.concat(
            files.slice(0, 9 - prev.length).map((f) => ({ file: f, url: URL.createObjectURL(f) }))
          )
        );
      });
    };
    const onDragOver = (e: DragEvent) => {
      if (!isAdmin) return;
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
  }, [isAdmin]);

  const resetForm = () => {
    setText("");
    revokeUrls(imagesRef.current);
    setImages([]);
    setOpen(false);
    formRef.current?.reset();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;

    const content = text.trim();
    if (!content) {
      setState({ status: "error", message: "内容为空" });
      return;
    }

    setPending(true);
    setState({ status: "idle" });

    try {
      const visibility =
        (
          formRef.current?.querySelector(
            'select[name="visibility"]'
          ) as HTMLSelectElement | null
        )?.value || "PUBLIC";

      const tagsField =
        (
          formRef.current?.querySelector('input[name="tags"]') as HTMLInputElement | null
        )?.value || "";
      const tags = tagsField
        .split(/[,\s]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 5);

      const locationName =
        (
          formRef.current?.querySelector('input[name="locationName"]') as HTMLInputElement | null
        )?.value?.trim() || "";
      const location = locationName ? { name: locationName } : null;

      const uploadedImages: Array<{
        url: string;
        microThumbUrl?: string;
        smallThumbUrl?: string;
        mediumUrl?: string;
        previewUrl?: string;
        w?: number;
        h?: number;
      }> = [];
      for (const item of images) {
        try {
          const formData = new FormData();
          formData.append("image", item.file);
          formData.append("title", `Moment image ${new Date().toLocaleDateString()}`);

          const uploadRes = await fetch("/api/admin/gallery/upload", {
            method: "POST",
            body: formData,
          });

          if (!uploadRes.ok) {
            console.error("Failed to upload image:", await uploadRes.text());
            continue;
          }

          const uploadData = await uploadRes.json().catch(() => ({}));
          if (uploadData.image) {
            uploadedImages.push({
              url: uploadData.image.filePath,
              microThumbUrl: uploadData.image.microThumbPath,
              smallThumbUrl: uploadData.image.smallThumbPath,
              mediumUrl: uploadData.image.mediumPath,
              previewUrl: uploadData.image.smallThumbPath,
              w: uploadData.image.width,
              h: uploadData.image.height,
            });
          }
        } catch (error) {
          console.error("Image upload failed:", error);
        }
      }

      const res = await fetch("/api/admin/moments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          images: uploadedImages,
          tags,
          visibility,
          status: "PUBLISHED",
          ...(location ? { location } : {}),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to create moment");
      }

      console.log("✅ Moment created successfully:", data.moment?.id ?? data.id);
      setState({ status: "success", id: data.moment?.id ?? data.id });
      startTransition(() => resetForm());
    } catch (error) {
      console.error("❌ Moment creation error:", error);
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "发布失败",
      });
    } finally {
      setPending(false);
    }
  };

  // Don't render anything if not admin or on admin routes
  if (!isAdmin || isAdminRoute) return null;

  return (
    <>
      {/* FAB - Admin only */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-5 bottom-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-stone-900 text-white shadow-lg transition-all duration-200 hover:scale-105 hover:bg-stone-800 active:scale-95 md:hidden dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
        aria-label="新建瞬间"
      >
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14m-7-7h14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Modal Dialog */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={close}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-5 shadow-2xl dark:border-stone-800 dark:bg-[#141416]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">新建瞬间</h3>
              <button
                onClick={close}
                className="rounded-full p-1.5 text-stone-500 transition-colors hover:bg-stone-100 dark:hover:bg-stone-800"
                aria-label="关闭"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            {status !== "authenticated" ? (
              <div className="py-10 text-center text-sm text-stone-600 dark:text-stone-400">
                请先登录后再发布瞬间。
                <div className="mt-4">
                  <Link
                    href="/login"
                    className="rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-stone-100 dark:text-stone-900"
                  >
                    前往登录
                  </Link>
                </div>
              </div>
            ) : (
              <form ref={formRef} className="space-y-4" onSubmit={handleSubmit}>
                <textarea
                  name="content"
                  maxLength={1000}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="此刻…"
                  className="h-32 w-full resize-none rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm text-stone-900 outline-none transition-colors focus:border-stone-400 focus:bg-white dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:focus:border-stone-500 dark:focus:bg-stone-800"
                />
                {/* Images preview grid */}
                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {images.map((im, idx) => (
                      <div key={idx} className="relative aspect-square overflow-hidden rounded-xl">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={im.url} alt="preview" className="h-full w-full object-cover" />
                        <div className="absolute top-1 right-1 flex gap-1">
                          <button
                            type="button"
                            className="rounded-full bg-black/60 p-1 text-white transition-colors hover:bg-black/80"
                            onClick={() =>
                              setImages((arr) => {
                                const removed = arr[idx];
                                if (removed) URL.revokeObjectURL(removed.url);
                                return arr.filter((_, i) => i !== idx);
                              })
                            }
                          >
                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                          {idx > 0 && (
                            <button
                              type="button"
                              className="rounded-full bg-black/60 p-1 text-white transition-colors hover:bg-black/80"
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
                              className="rounded-full bg-black/60 p-1 text-white transition-colors hover:bg-black/80"
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
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700">
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
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                      添加图片
                    </label>
                    <select
                      name="visibility"
                      className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300"
                    >
                      <option value="PUBLIC">公开</option>
                      <option value="UNLISTED">未收录</option>
                      <option value="PRIVATE">私密</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={pending || text.trim().length === 0}
                    className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
                  >
                    {pending && (
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                    {pending ? "发布中…" : "发布"}
                  </button>
                </div>
                {/* Advanced options: tags, location, schedule */}
                <div className="space-y-2 border-t border-stone-200 pt-3 dark:border-stone-700">
                  <input
                    name="tags"
                    placeholder="标签（逗号分隔，最多5个）"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-700 outline-none transition-colors focus:border-stone-400 focus:bg-white dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:focus:border-stone-500"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      name="locationName"
                      placeholder="地点（可选）"
                      className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-700 outline-none transition-colors focus:border-stone-400 focus:bg-white dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:focus:border-stone-500"
                    />
                    <input
                      type="datetime-local"
                      name="scheduledAt"
                      className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-700 outline-none transition-colors focus:border-stone-400 focus:bg-white dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:focus:border-stone-500"
                    />
                  </div>
                </div>
                {state.status === "error" && (
                  <p className="text-xs text-red-600 dark:text-red-400">{state.message}</p>
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

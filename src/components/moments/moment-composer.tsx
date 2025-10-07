"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createMomentAction, type CreateMomentState } from "@/app/m/actions";
import { useSession } from "next-auth/react";

type LocalImage = { file: File; url: string };

export function MomentComposerBottomSheet() {
  const { status } = useSession();
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

  if (status !== "authenticated") return null;

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

      {/* Bottom Sheet */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/30"
          onClick={() => setOpen(false)}
        >
          <div
            className="mt-auto w-full rounded-t-2xl bg-white p-4 shadow-xl dark:bg-[#0b0b0d]"
            onClick={(e) => e.stopPropagation()}
          >
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
                await action(fd);
              }}
            >
              <textarea
                name="content"
                maxLength={1000}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="此刻…"
                className="h-24 w-full resize-none rounded-lg border border-zinc-300 bg-white p-2 text-sm outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
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
              {state.status === "error" && <p className="text-xs text-red-600">{state.message}</p>}
            </form>
            {/* end form */}
          </div>
        </div>
      )}
    </>
  );
}

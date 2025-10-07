"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createMomentAction, type CreateMomentState } from "@/app/m/actions";
import { useSession } from "next-auth/react";

export function MomentComposerBottomSheet() {
  const { status } = useSession();
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<CreateMomentState, FormData>(createMomentAction, {
    status: "idle",
  });
  const formRef = useRef<HTMLFormElement>(null);
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);

  useEffect(() => {
    const handler = () => setOpen(true);
    const listener: EventListener = () => handler();
    window.addEventListener("open-moment-composer", listener);
    return () => window.removeEventListener("open-moment-composer", listener);
  }, []);

  useEffect(() => {
    if (state.status === "success") {
      setText("");
      setImage(null);
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
            <form ref={formRef} action={action} className="space-y-3">
              <textarea
                name="content"
                maxLength={1000}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="此刻…"
                className="h-24 w-full resize-none rounded-lg border border-zinc-300 bg-white p-2 text-sm outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
                    <input
                      type="file"
                      name="image"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setImage(e.target.files?.[0] || null)}
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
                  disabled={pending || (!text && !image)}
                  className="inline-flex items-center rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
                >
                  {pending ? "发布中…" : "发布"}
                </button>
              </div>
              {state.status === "error" && <p className="text-xs text-red-600">{state.message}</p>}
            </form>
          </div>
        </div>
      )}
    </>
  );
}

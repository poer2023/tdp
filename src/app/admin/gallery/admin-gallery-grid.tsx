"use client";

import Image from "next/image";
import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { GalleryImage } from "@/lib/gallery";
import {
  bulkUpdateGalleryAction,
  bulkDeleteGalleryAction,
  type BulkUpdateState,
} from "./bulk-actions";
import { useConfirm } from "@/hooks/use-confirm";
import { Button, Card, CardContent } from "@/components/ui-heroui";

export function AdminGalleryGrid({ images }: { images: GalleryImage[] }) {
  const router = useRouter();
  const { confirm } = useConfirm();
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<BulkUpdateState, FormData>(
    bulkUpdateGalleryAction,
    { status: "idle" }
  );
  const [delState, delAction, delPending] = useActionState<BulkUpdateState, FormData>(
    bulkDeleteGalleryAction,
    { status: "idle" }
  );
  const [deleteTransitionPending, startDeleteTransition] = useTransition();

  const selectedIds = useMemo(() => Object.keys(selected).filter((id) => selected[id]), [selected]);

  // Refresh UI when server actions complete successfully
  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [state.status, router]);

  useEffect(() => {
    if (delState.status === "success") {
      router.refresh();
    }
  }, [delState.status, router]);

  function toggle(id: string) {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  }
  function toggleAll(on: boolean) {
    const next: Record<string, boolean> = {};
    images.forEach((img) => (next[img.id] = on));
    setSelected(next);
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {!selectMode ? (
          <Button variant="secondary" onPress={() => setSelectMode(true)}>
            进入选择模式
          </Button>
        ) : (
          <>
            <Button variant="light" onPress={() => toggleAll(true)}>
              全选
            </Button>
            <Button variant="light" onPress={() => toggleAll(false)}>
              取消全选
            </Button>
            <Button
              variant="primary"
              onPress={() => setOpen(true)}
              isDisabled={selectedIds.length === 0}
            >
              批量编辑（{selectedIds.length}）
            </Button>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const confirmed = await confirm({
                  title: "批量删除图片",
                  description: `确认删除所选 ${selectedIds.length} 项？此操作无法恢复。`,
                  confirmText: "删除",
                  cancelText: "取消",
                  variant: "danger",
                });
                if (confirmed) {
                  const fd = new FormData();
                  fd.set("ids", JSON.stringify(selectedIds));
                  startDeleteTransition(() => {
                    void delAction(fd);
                  });
                }
              }}
              className="inline-flex"
            >
              <Button
                type="submit"
                variant="light"
                color="danger"
                isDisabled={selectedIds.length === 0 || delPending || deleteTransitionPending}
              >
                删除所选
              </Button>
            </form>
            <form
              action={(fd) => {
                fd.set("ids", JSON.stringify(selectedIds));
                const patch = { location: { clear: true } };
                fd.set("patch", JSON.stringify(patch));
                return formAction(fd);
              }}
              className="inline-flex"
            >
              <Button
                type="submit"
                variant="light"
                isDisabled={selectedIds.length === 0 || pending}
              >
                清空位置
              </Button>
            </form>
            <Button
              variant="light"
              onPress={() => {
                setSelectMode(false);
                setSelected({});
              }}
            >
              退出
            </Button>
          </>
        )}

        {state.status !== "idle" && state.message && (
          <span
            className={`ml-auto rounded-full px-3 py-1 text-xs ${
              state.status === "error"
                ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
            }`}
          >
            {state.message}
          </span>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((image, index) => (
          <Card
            key={image.id}
            variant="secondary"
            className="group relative overflow-hidden transition hover:-translate-y-1 hover:shadow-lg"
          >
            {selectMode && (
              <label className="absolute top-3 left-3 z-10 inline-flex items-center gap-2 rounded-full bg-white/90 px-2 py-1 text-xs shadow-sm ring-1 ring-zinc-200 backdrop-blur dark:bg-zinc-900/80 dark:ring-zinc-700">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 accent-zinc-900 dark:accent-zinc-100"
                  checked={!!selected[image.id]}
                  onChange={() => toggle(image.id)}
                />
                <span className="text-zinc-700 dark:text-zinc-300">选择</span>
              </label>
            )}

            <div className="relative aspect-square overflow-hidden">
              <Image
                src={image.smallThumbPath ?? image.mediumPath ?? image.filePath}
                alt={image.title ?? "相册照片"}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                priority={index === 0}
                className="object-cover transition duration-500 group-hover:scale-105"
              />
            </div>
            <CardContent className="space-y-2 px-4 py-3 text-sm">
              <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                {image.title ?? "未命名照片"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <form
            action={(fd) => {
              fd.set("ids", JSON.stringify(selectedIds));
              return formAction(fd);
            }}
            className="absolute top-0 right-0 h-full w-full max-w-md overflow-y-auto border-l border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">批量编辑</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                关闭
              </button>
            </div>

            <Field label="标题">
              <div className="flex gap-2">
                <input
                  name="title.set"
                  type="text"
                  placeholder="设置为..."
                  className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
                <label className="inline-flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                  <input name="title.clear" type="checkbox" className="h-3.5 w-3.5" /> 清空
                </label>
              </div>
            </Field>

            <Field label="描述">
              <div className="flex gap-2">
                <textarea
                  name="description.set"
                  rows={3}
                  placeholder="设置为..."
                  className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
                <label className="inline-flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                  <input name="description.clear" type="checkbox" className="h-3.5 w-3.5" /> 清空
                </label>
              </div>
            </Field>

            <Field label="关联文章 ID">
              <div className="flex gap-2">
                <input
                  name="postId.set"
                  type="text"
                  placeholder="设置为..."
                  className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
                <label className="inline-flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                  <input name="postId.clear" type="checkbox" className="h-3.5 w-3.5" /> 清空
                </label>
              </div>
            </Field>

            <Field label="拍摄时间">
              <div className="flex gap-2">
                <input
                  name="capturedAt.set"
                  type="datetime-local"
                  className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
                <label className="inline-flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                  <input name="capturedAt.clear" type="checkbox" className="h-3.5 w-3.5" /> 清空
                </label>
              </div>
            </Field>

            <Field label="位置">
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    name="location.set.latitude"
                    type="number"
                    step="any"
                    placeholder="纬度"
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                  <input
                    name="location.set.longitude"
                    type="number"
                    step="any"
                    placeholder="经度"
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <input
                  name="location.set.city"
                  type="text"
                  placeholder="城市"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
                <input
                  name="location.set.country"
                  type="text"
                  placeholder="国家"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
                <input
                  name="location.set.locationName"
                  type="text"
                  placeholder="位置名称"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
                <label className="mt-1 inline-flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                  <input name="location.clear" type="checkbox" className="h-3.5 w-3.5" />{" "}
                  清空全部位置字段
                </label>
              </div>
            </Field>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="submit"
                disabled={pending || selectedIds.length === 0}
                onClick={(e) => {
                  // Transform dotted names into json patch for server action
                  e.currentTarget.form?.addEventListener(
                    "formdata",
                    (ev: FormDataEvent) => {
                      const fd = ev.formData;
                      type Tri<T> = { set?: T; clear?: true };
                      type LocationSet = {
                        latitude?: number | null;
                        longitude?: number | null;
                        city?: string | null;
                        country?: string | null;
                        locationName?: string | null;
                      };
                      type Patch = {
                        title?: Tri<string>;
                        description?: Tri<string>;
                        postId?: Tri<string | null>;
                        capturedAt?: Tri<string | null>;
                        location?: { set: LocationSet } | { clear: true };
                      };
                      const patch: Patch = {};
                      // title
                      {
                        const setVal = fd.get("title.set");
                        const clear = fd.get("title.clear");
                        if (setVal || clear) {
                          patch.title = {
                            ...(setVal ? { set: String(setVal) } : {}),
                            ...(clear ? { clear: true } : {}),
                          };
                          fd.delete("title.set");
                          fd.delete("title.clear");
                        }
                      }
                      // description
                      {
                        const setVal = fd.get("description.set");
                        const clear = fd.get("description.clear");
                        if (setVal || clear) {
                          patch.description = {
                            ...(setVal ? { set: String(setVal) } : {}),
                            ...(clear ? { clear: true } : {}),
                          };
                          fd.delete("description.set");
                          fd.delete("description.clear");
                        }
                      }
                      // postId
                      {
                        const setVal = fd.get("postId.set");
                        const clear = fd.get("postId.clear");
                        if (setVal || clear) {
                          patch.postId = {
                            ...(setVal ? { set: String(setVal) } : {}),
                            ...(clear ? { clear: true } : {}),
                          };
                          fd.delete("postId.set");
                          fd.delete("postId.clear");
                        }
                      }
                      // capturedAt
                      {
                        const setVal = fd.get("capturedAt.set");
                        const clear = fd.get("capturedAt.clear");
                        if (setVal || clear) {
                          patch.capturedAt = {
                            ...(setVal ? { set: String(setVal) } : {}),
                            ...(clear ? { clear: true } : {}),
                          };
                          fd.delete("capturedAt.set");
                          fd.delete("capturedAt.clear");
                        }
                      }
                      const loc: LocationSet = {};
                      const lat = fd.get("location.set.latitude");
                      const lon = fd.get("location.set.longitude");
                      const city = fd.get("location.set.city");
                      const country = fd.get("location.set.country");
                      const name = fd.get("location.set.locationName");
                      const clear = fd.get("location.clear");
                      if (lat || lon || city || country || name || clear) {
                        if (clear) {
                          patch.location = { clear: true };
                        } else {
                          if (lat) loc.latitude = Number(lat);
                          if (lon) loc.longitude = Number(lon);
                          if (city) loc.city = String(city);
                          if (country) loc.country = String(country);
                          if (name) loc.locationName = String(name);
                          patch.location = { set: loc };
                        }
                        [
                          "location.set.latitude",
                          "location.set.longitude",
                          "location.set.city",
                          "location.set.country",
                          "location.set.locationName",
                          "location.clear",
                        ].forEach((k) => fd.delete(k));
                      }
                      fd.set("patch", JSON.stringify(patch));
                    },
                    { once: true }
                  );
                }}
                className="rounded-lg border border-zinc-900 bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
              >
                应用修改
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                取消
              </button>
            </div>
          </form>
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

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createMomentAction, updateMomentAction } from "@/app/admin/moments/actions";
import {
  LuminaActionBtn,
  LuminaEditForm,
  LuminaInput,
  LuminaTextArea,
} from "./lumina-shared";
import { ImageUploadArea } from "./image-upload-area";

type MomentFormValues = {
  content: string;
  tags: string;
  visibility: "PUBLIC" | "FRIEND_ONLY" | "PRIVATE";
  location: string;
  images: string[];
};

type MomentFormProps = {
  defaultValues?: Partial<MomentFormValues>;
  submitLabel?: string;
  momentId?: string;
};

export function MomentForm({
  defaultValues,
  submitLabel = "保存动态",
  momentId,
}: MomentFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<MomentFormValues>({
    content: defaultValues?.content ?? "",
    tags: defaultValues?.tags ?? "",
    visibility: defaultValues?.visibility ?? "PUBLIC",
    location: defaultValues?.location ?? "",
    images: defaultValues?.images ?? [],
  });
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const tags = values.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
      const payload = {
        id: momentId,
        content: values.content,
        tags,
        images: values.images,
        visibility: values.visibility,
        location: values.location,
      };

      const result = momentId
        ? await updateMomentAction(payload)
        : await createMomentAction(payload);

      if (result.status === "success") {
        setMessage("已保存");
        router.refresh();
      } else {
        setMessage(result.message);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <LuminaEditForm
        title="动态内容"
        description="支持多图与可见性设置，优先采用 Lumina 的卡片风格。"
        footer={
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-stone-500 dark:text-stone-400">
              标签使用英文逗号分隔，例如：travel,photo,friend-only
            </span>
            <div className="flex items-center gap-3">
              {message && <span className="text-xs text-sage-600 dark:text-sage-300">{message}</span>}
              <LuminaActionBtn type="submit" disabled={pending}>
                {pending ? "保存中..." : submitLabel}
              </LuminaActionBtn>
            </div>
          </div>
        }
      >
        <LuminaTextArea
          label="正文"
          placeholder="记录此刻的想法与细节"
          rows={4}
          value={values.content}
          onChange={(event) => setValues((prev) => ({ ...prev, content: event.target.value }))}
        />

        <LuminaInput
          label="标签"
          placeholder="travel,photo"
          value={values.tags}
          onChange={(event) => setValues((prev) => ({ ...prev, tags: event.target.value }))}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              可见性
            </label>
            <select
              className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm focus:border-sage-500 focus:outline-none focus:ring-1 focus:ring-sage-500/20 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-50"
              value={values.visibility}
              onChange={(event) =>
                setValues((prev) => ({
                  ...prev,
                  visibility: event.target.value as MomentFormValues["visibility"],
                }))
              }
            >
              <option value="PUBLIC">公开</option>
              <option value="FRIEND_ONLY">好友可见</option>
              <option value="PRIVATE">仅自己</option>
            </select>
          </div>
          <LuminaInput
            label="位置"
            placeholder="可选：北京 · 三里屯"
            value={values.location}
            onChange={(event) => setValues((prev) => ({ ...prev, location: event.target.value }))}
          />
        </div>

        <ImageUploadArea
          label="图片"
          description="拖拽添加多张图片，复用相册上传能力"
          onChange={(files) => {
            if (!files) return;
            const names = Array.from(files).map((file) => file.name);
            setValues((prev) => ({ ...prev, images: names }));
          }}
          onUploaded={(urls) => setValues((prev) => ({ ...prev, images: urls }))}
        />
      </LuminaEditForm>
    </form>
  );
}

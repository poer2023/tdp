"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createShareItemAction, updateShareItemAction } from "@/app/admin/curated/actions";
import {
  LuminaActionBtn,
  LuminaEditForm,
  LuminaInput,
  LuminaTextArea,
} from "./lumina-shared";
import { ImageUploadArea } from "./image-upload-area";

type ShareItemFormValues = {
  title: string;
  url: string;
  description: string;
  tags: string;
  imageUrl: string;
};

type ShareItemFormProps = {
  defaultValues?: Partial<ShareItemFormValues>;
  submitLabel?: string;
  shareItemId?: string;
};

export function ShareItemForm({
  defaultValues,
  submitLabel = "保存精选",
  shareItemId,
}: ShareItemFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<ShareItemFormValues>({
    title: defaultValues?.title ?? "",
    url: defaultValues?.url ?? "",
    description: defaultValues?.description ?? "",
    tags: defaultValues?.tags ?? "",
    imageUrl: defaultValues?.imageUrl ?? "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const payload = {
        id: shareItemId,
        title: values.title,
        url: values.url,
        description: values.description,
        tags: values.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        imageUrl: values.imageUrl,
      };

      const result = shareItemId
        ? await updateShareItemAction(payload)
        : await createShareItemAction(payload);

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
        title="精选链接"
        description="提供标题、链接、标签和可选缩略图，自动提取域名展示。"
        footer={
          <div className="flex items-center justify-end gap-3">
            <span className="text-xs text-stone-500 dark:text-stone-400">标签使用英文逗号分隔</span>
            <div className="flex items-center gap-3">
              {message && <span className="text-xs text-sage-600 dark:text-sage-300">{message}</span>}
              <LuminaActionBtn type="submit" disabled={pending}>
                {pending ? "保存中..." : submitLabel}
              </LuminaActionBtn>
            </div>
          </div>
        }
      >
        <LuminaInput
          label="标题"
          placeholder="例如：AI 设计工具清单"
          value={values.title}
          onChange={(event) => setValues((prev) => ({ ...prev, title: event.target.value }))}
        />

        <LuminaInput
          label="URL"
          placeholder="https://"
          value={values.url}
          onChange={(event) => setValues((prev) => ({ ...prev, url: event.target.value }))}
        />

        <LuminaTextArea
          label="描述"
          rows={3}
          value={values.description}
          onChange={(event) => setValues((prev) => ({ ...prev, description: event.target.value }))}
        />

        <LuminaInput
          label="标签"
          placeholder="design,ai,tools"
          value={values.tags}
          onChange={(event) => setValues((prev) => ({ ...prev, tags: event.target.value }))}
        />

        <ImageUploadArea
          label="缩略图"
          description="可选，建议 16:9"
          multiple={false}
          onChange={(files) => {
            if (!files?.[0]) return;
            setValues((prev) => ({ ...prev, imageUrl: files[0].name }));
          }}
          onUploaded={(urls) => {
            if (!urls[0]) return;
            setValues((prev) => ({ ...prev, imageUrl: urls[0] }));
          }}
        />
      </LuminaEditForm>
    </form>
  );
}

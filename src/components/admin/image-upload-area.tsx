"use client";

import { useMemo, useState } from "react";
import { LuminaImageUploadArea } from "./lumina-shared";

type ImageUploadAreaProps = {
  label?: string;
  description?: string;
  hint?: string;
  accept?: string;
  multiple?: boolean;
  initialPreview?: string[];
  onChange?: (files: FileList | null) => void;
  onUploaded?: (urls: string[]) => void;
};

export function ImageUploadArea({
  label = "图片上传",
  description = "复用相册上传能力，支持拖拽和多选",
  hint,
  accept,
  multiple,
  initialPreview = [],
  onChange,
  onUploaded,
}: ImageUploadAreaProps) {
  const [preview, setPreview] = useState<string[]>(initialPreview);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    setError(null);
    const names = Array.from(files).map((file) => file.name);
    setPreview((prev) => {
      const merged = [...prev, ...names];
      return Array.from(new Set(merged));
    });
    onChange?.(files);

    // 自动上传到已有的 Gallery Upload API，返回可用 URL
    setUploading(true);
    Promise.all(
      Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append("image", file);
        try {
          const res = await fetch("/api/admin/gallery/upload", {
            method: "POST",
            body: formData,
          });
          if (!res.ok) throw new Error(`上传失败: ${res.status}`);
          const data = (await res.json()) as { image?: { filePath?: string } };
          return data.image?.filePath;
        } catch (err) {
          setError(err instanceof Error ? err.message : "上传失败");
          return null;
        }
      })
    )
      .then((urls) => {
        const valid = urls.filter((u): u is string => !!u);
        if (valid.length) {
          setPreview((prev) => [...valid, ...prev]);
          onUploaded?.(valid);
        }
      })
      .finally(() => setUploading(false));
  };

  const previewItems = useMemo(() => preview.slice(0, 6), [preview]);

  return (
    <LuminaImageUploadArea
      label={label}
      description={description}
      hint={hint}
      accept={accept}
      multiple={multiple}
      onFilesSelected={handleFiles}
      footer={
        error
          ? error
          : uploading
            ? "正在上传到 /api/admin/gallery/upload ..."
            : preview.length > 6
              ? `已选择 ${preview.length} 个文件，显示前 6 个预览`
              : undefined
      }
    >
      {previewItems.map((item) => (
        <div
          key={item}
          className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 shadow-sm dark:border-stone-800 dark:bg-stone-950 dark:text-stone-200"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-stone-100 text-xs text-stone-500 dark:bg-stone-800/70 dark:text-stone-300">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11l3 3 5-6" />
              </svg>
            </div>
            <span className="truncate">{item}</span>
          </div>
          <span className="text-xs text-stone-500 dark:text-stone-400">就绪</span>
        </div>
      ))}
    </LuminaImageUploadArea>
  );
}

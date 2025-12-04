"use client";

import { useState } from "react";

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

  return (
    <div className="space-y-3 rounded-lg border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-950">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{label}</p>
          <p className="text-xs text-stone-500">{description}</p>
          {hint && <p className="text-[11px] text-stone-400 mt-1">{hint}</p>}
        </div>
        <label className="cursor-pointer rounded-md bg-stone-900 px-3 py-2 text-xs font-medium text-white transition hover:opacity-90 dark:bg-stone-100 dark:text-stone-900">
          选择文件
          <input
            type="file"
            className="hidden"
            multiple={multiple}
            accept={accept}
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
      </div>

      {uploading && <p className="text-xs text-sky-600">正在上传到 /api/admin/gallery/upload ...</p>}
      {error && <p className="text-xs text-rose-600">{error}</p>}

      {preview.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-stone-500">
            预览 {preview.length > 6 ? `（显示前 6 个）` : ""}
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {preview.slice(0, 6).map((item) => (
              <div
                key={item}
                className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 shadow-sm dark:border-stone-800 dark:bg-stone-900 dark:text-stone-200"
              >
                <span className="truncate">{item}</span>
                <span className="text-xs text-stone-500 dark:text-stone-400">就绪</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

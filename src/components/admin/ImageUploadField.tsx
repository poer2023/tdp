"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { ImageCropModal } from "./ImageCropModal";
import { Upload, X, Loader2 } from "lucide-react";

interface ImageUploadFieldProps {
  label: string;
  value: string | null;
  onChange: (url: string, type: "avatar" | "cover") => void;
  type: "avatar" | "cover";
  maxSize?: number; // bytes
}

export function ImageUploadField({
  label,
  value,
  onChange,
  type,
  maxSize = 5 * 1024 * 1024, // 5MB default
}: ImageUploadFieldProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith("image/")) {
      setError("请选择图片文件");
      return;
    }

    // 验证文件大小
    if (file.size > maxSize) {
      setError(`文件大小不能超过 ${Math.round(maxSize / 1024 / 1024)}MB`);
      return;
    }

    setError(null);
    setSelectedFile(file);

    // 创建预览 URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropConfirm = async (croppedBlob: Blob) => {
    setShowCropModal(false);
    setIsUploading(true);
    setError(null);

    try {
      // 创建 FormData
      const formData = new FormData();
      const croppedFile = new File([croppedBlob], selectedFile?.name || "image.jpg", {
        type: "image/jpeg",
      });
      formData.append("image", croppedFile);
      formData.append("type", type);

      // 上传到 API
      const response = await fetch("/api/admin/friends/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "上传失败");
      }

      const data = await response.json();

      // 根据类型返回对应的 URL
      const uploadedUrl = type === "avatar" ? data.avatar : data.cover;
      onChange(uploadedUrl, type);

      // 清理状态
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err) {
      console.error("上传失败:", err);
      setError(err instanceof Error ? err.message : "上传失败，请重试");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    onChange("", type);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">{label}</label>

      {/* 预览区域 */}
      {value ? (
        <div className="group relative inline-block">
          <div className="relative h-32 w-32 overflow-hidden rounded-2xl border-2 border-stone-200 dark:border-stone-700">
            <Image src={value} alt={label} fill className="object-cover" unoptimized />
          </div>
          {/* 删除按钮 */}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
          {/* 更换按钮 */}
          <button
            type="button"
            onClick={handleButtonClick}
            className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100"
          >
            更换图片
          </button>
        </div>
      ) : (
        /* 上传按钮 */
        <button
          type="button"
          onClick={handleButtonClick}
          disabled={isUploading}
          className="flex h-32 w-32 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-stone-300 transition-colors hover:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-stone-700 dark:hover:border-blue-500"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="text-xs text-stone-500">上传中...</span>
            </>
          ) : (
            <>
              <Upload className="h-6 w-6 text-stone-400" />
              <span className="text-xs text-stone-500">选择图片</span>
            </>
          )}
        </button>
      )}

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* 错误提示 */}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {/* 提示文本 */}
      <p className="text-xs text-stone-500 dark:text-stone-400">
        支持 JPG、PNG、WebP 格式，最大 {Math.round(maxSize / 1024 / 1024)}MB
      </p>

      {/* 裁剪模态框 */}
      {showCropModal && previewUrl && (
        <ImageCropModal
          imageSrc={previewUrl}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
          cropShape="square"
          aspectRatio={1}
        />
      )}
    </div>
  );
}

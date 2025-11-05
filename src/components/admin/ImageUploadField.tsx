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
      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </label>

      {/* 预览区域 */}
      {value ? (
        <div className="relative inline-block group">
          <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-zinc-200 dark:border-zinc-700">
            <Image
              src={value}
              alt={label}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          {/* 删除按钮 */}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
          {/* 更换按钮 */}
          <button
            type="button"
            onClick={handleButtonClick}
            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm font-medium rounded-2xl"
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
          className="w-32 h-32 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-blue-500 dark:hover:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              <span className="text-xs text-zinc-500">上传中...</span>
            </>
          ) : (
            <>
              <Upload className="w-6 h-6 text-zinc-400" />
              <span className="text-xs text-zinc-500">选择图片</span>
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
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* 提示文本 */}
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
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

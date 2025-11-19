"use client";

import * as React from "react";
import { Upload, X, CheckCircle, AlertCircle, Video, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { Button, Progress, Chip } from "@/components/ui-heroui";

export type UploadStatus = "pending" | "uploading" | "success" | "error";

export interface UploadFile {
  id: string;
  file: File;
  preview: string;
  status: UploadStatus;
  progress: number;
  error?: string;
  // Live Photo 相关
  isLivePhoto: boolean;
  pairedWith?: string; // 配对文件的 ID
  type: "image" | "video";
}

interface EnhancedImageUploaderProps {
  files: UploadFile[];
  onChange: (files: UploadFile[]) => void;
  maxFiles?: number;
  maxSize?: number;
  accept?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * 增强版图片上传器
 * - 支持 Live Photo 自动配对
 * - 预览卡片上显示上传状态和进度
 * - 支持拖拽、移除、状态管理
 */
export const EnhancedImageUploader = React.forwardRef<HTMLDivElement, EnhancedImageUploaderProps>(
  (
    {
      files,
      onChange,
      maxFiles = 50,
      maxSize = 10,
      accept = "image/*,video/quicktime,video/mp4",
      className,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const [isDragging, setIsDragging] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // 清理预览 URL
    React.useEffect(() => {
      return () => {
        files.forEach((file) => {
          if (file.preview) {
            URL.revokeObjectURL(file.preview);
          }
        });
      };
    }, [files]);

    /**
     * 从文件名提取基础名（用于 Live Photo 配对）
     * 例如：IMG_1234.HEIC -> img_1234
     */
    const getBaseName = (filename: string): string => {
      return filename.replace(/\.[^.]+$/, "").toLowerCase();
    };

    /**
     * 判断文件类型
     */
    const getFileType = (file: File): "image" | "video" => {
      if (file.type.startsWith("video/")) return "video";
      return "image";
    };

    /**
     * Live Photo 配对逻辑
     */
    const pairLivePhotos = (newFiles: File[]): UploadFile[] => {
      const uploadFiles: UploadFile[] = [];
      const pairedMap = new Map<string, { image?: File; video?: File }>();

      // 第一遍：按基础名分组
      newFiles.forEach((file) => {
        const baseName = getBaseName(file.name);
        const type = getFileType(file);

        if (!pairedMap.has(baseName)) {
          pairedMap.set(baseName, {});
        }

        const pair = pairedMap.get(baseName)!;
        if (type === "image") {
          pair.image = file;
        } else {
          pair.video = file;
        }
      });

      // 第二遍：生成 UploadFile 对象
      pairedMap.forEach((pair, baseName) => {
        const isLivePhoto = !!(pair.image && pair.video);

        // 添加图片
        if (pair.image) {
          const imageId = `${baseName}-image`;
          uploadFiles.push({
            id: imageId,
            file: pair.image,
            preview: URL.createObjectURL(pair.image),
            status: "pending",
            progress: 0,
            isLivePhoto,
            pairedWith: isLivePhoto ? `${baseName}-video` : undefined,
            type: "image",
          });
        }

        // 添加视频（Live Photo 的视频部分）
        if (pair.video) {
          const videoId = `${baseName}-video`;
          uploadFiles.push({
            id: videoId,
            file: pair.video,
            preview: "", // 视频不需要预览
            status: "pending",
            progress: 0,
            isLivePhoto,
            pairedWith: isLivePhoto ? `${baseName}-image` : undefined,
            type: "video",
          });
        }
      });

      return uploadFiles;
    };

    const handleFileChange = (newFiles: FileList | null) => {
      if (!newFiles || disabled) return;

      const filesArray = Array.from(newFiles);

      // 去重：避免添加已存在的文件
      const uniqueNewFiles = filesArray.filter(
        (newFile) => !files.some((existingFile) => existingFile.file.name === newFile.name)
      );

      // Live Photo 配对
      const pairedFiles = pairLivePhotos(uniqueNewFiles);

      // 合并并限制数量
      const updatedFiles = [...files, ...pairedFiles].slice(0, maxFiles);
      onChange(updatedFiles);
    };

    const handleRemoveFile = (id: string) => {
      const file = files.find((f) => f.id === id);
      if (!file) return;

      let updatedFiles = files;

      // 如果是 Live Photo，同时移除配对的文件
      if (file.isLivePhoto && file.pairedWith) {
        updatedFiles = files.filter((f) => f.id !== id && f.id !== file.pairedWith);
      } else {
        updatedFiles = files.filter((f) => f.id !== id);
      }

      onChange(updatedFiles);
    };

    // 拖拽事件处理
    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      handleFileChange(e.dataTransfer.files);
    };

    // 仅显示图片（视频作为 Live Photo 的一部分，不单独显示）
    const displayFiles = files.filter((f) => f.type === "image");

    return (
      <div ref={ref} className={cn("space-y-3", className)} {...props}>
        {/* 拖拽上传区域 - 压缩版 */}
        <div
          className={cn(
            "rounded-lg border-2 border-dashed p-4 text-center transition-colors duration-300",
            isDragging && !disabled
              ? "border-primary bg-primary/10"
              : "border-muted-foreground/30 bg-transparent",
            disabled ? "cursor-not-allowed opacity-50" : "hover:border-primary/50 cursor-pointer"
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          role="button"
          aria-label="Image uploader dropzone"
          tabIndex={disabled ? -1 : 0}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={accept}
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files)}
            disabled={disabled}
          />
          <div className="flex flex-col items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full pointer-events-none"
              disabled={disabled}
            >
              <Upload className="h-5 w-5" />
            </Button>
            <div>
              <p className="text-sm font-medium">选择图片或拖拽到这里</p>
              <p className="text-muted-foreground text-xs">
                支持 JPG, PNG, WEBP, HEIC。最大 {maxSize}MB。
                {accept.includes("video") && " 支持 Live Photo。"}
              </p>
            </div>
          </div>
        </div>

        {/* 预览网格 - 紧凑版 */}
        {displayFiles.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            <AnimatePresence>
              {displayFiles.map((uploadFile) => (
                <motion.div
                  key={uploadFile.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="group relative aspect-square"
                >
                  {/* 图片预览 */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={uploadFile.preview}
                    alt={`Preview of ${uploadFile.file.name}`}
                    className={cn(
                      "h-full w-full rounded-md object-cover",
                      uploadFile.status === "error" && "opacity-50"
                    )}
                  />

                  {/* Live Photo 标识 */}
                  {uploadFile.isLivePhoto && (
                    <Chip
                      size="sm"
                      className="absolute bottom-2 left-2 bg-black/70 text-xs text-white"
                    >
                      <Video size={12} className="mr-1" />
                      Live
                    </Chip>
                  )}

                  {/* 上传中状态 */}
                  {uploadFile.status === "uploading" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-md bg-black/60">
                      <Loader2 className="mb-2 h-8 w-8 animate-spin text-white" />
                      <div className="w-full px-4">
                        <Progress value={uploadFile.progress} className="h-2 bg-white/20" />
                        <p className="mt-2 text-center text-xs text-white">
                          {uploadFile.progress}%
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 成功状态 */}
                  {uploadFile.status === "success" && (
                    <div className="absolute top-2 left-2">
                      <CheckCircle className="rounded-full bg-white text-green-500" />
                    </div>
                  )}

                  {/* 错误状态 */}
                  {uploadFile.status === "error" && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-md bg-red-500/20">
                      <div className="p-2 text-center">
                        <AlertCircle className="mx-auto mb-1 text-red-500" />
                        {uploadFile.error && (
                          <p className="rounded bg-white/90 px-2 py-1 text-xs text-red-600">
                            {uploadFile.error}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 移除按钮 */}
                  {(uploadFile.status === "pending" || uploadFile.status === "error") && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(uploadFile.id);
                      }}
                      aria-label={`Remove ${uploadFile.file.name}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* 文件统计 */}
        {files.length > 0 && (
          <div className="text-muted-foreground text-sm">
            已选择 {displayFiles.length} 个文件
            {files.filter((f) => f.isLivePhoto && f.type === "image").length > 0 && (
              <span className="ml-2">
                （包含 {files.filter((f) => f.isLivePhoto && f.type === "image").length} 组 Live
                Photo）
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

EnhancedImageUploader.displayName = "EnhancedImageUploader";

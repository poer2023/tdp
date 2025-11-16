"use client";

import * as React from "react";
import { Video, Copy } from "lucide-react";

import { Input, Label, Textarea, Select, Button, Chip } from "@/components/ui-heroui";

import type { UploadFile } from "./enhanced-image-uploader";

type GalleryCategory = "REPOST" | "ORIGINAL" | "AI";

interface FileMetadata {
  title: string;
  description: string;
  category: GalleryCategory;
  postId: string;
}

interface IndividualEditCardProps {
  file: UploadFile;
  metadata: FileMetadata;
  onMetadataChange: (updates: Partial<FileMetadata>) => void;
  onCopyToAll: () => void;
  disabled?: boolean;
}

/**
 * 单个图片的编辑卡片
 * - 左侧: 缩略图预览 + Live Photo 标识
 * - 右侧: 表单字段(标题、描述、分类、文章ID)
 * - 操作: 复制到全部按钮
 */
export function IndividualEditCard({
  file,
  metadata,
  onMetadataChange,
  onCopyToAll,
  disabled = false,
}: IndividualEditCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-4 md:flex-row md:items-start dark:border-zinc-800">
      {/* 左侧: 图片预览 */}
      <div className="flex-shrink-0">
        <div className="relative h-24 w-24 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={file.preview}
            alt={metadata.title || "预览"}
            className="h-full w-full object-cover"
          />
          {/* Live Photo 标识 */}
          {file.isLivePhoto && (
            <Chip size="sm" className="absolute bottom-1 left-1 bg-black/70 text-white">
              <Video size={10} className="mr-1" />
              Live
            </Chip>
          )}
        </div>
        <p className="mt-1 max-w-[96px] truncate text-xs text-zinc-500 dark:text-zinc-400">
          {file.file.name}
        </p>
      </div>

      {/* 右侧: 表单字段 */}
      <div className="flex-1 space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          {/* 标题 */}
          <div className="space-y-1">
            <Label htmlFor={`title-${file.id}`} className="text-xs">
              标题
            </Label>
            <Input
              id={`title-${file.id}`}
              placeholder="输入图片标题"
              value={metadata.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onMetadataChange({ title: e.target.value })
              }
              disabled={disabled}
              className="h-8 text-sm"
            />
          </div>

          {/* 分类 */}
          <div className="space-y-1">
            <Label htmlFor={`category-${file.id}`} className="text-xs">
              分类
            </Label>
            <Select
              value={metadata.category}
              onChange={(value) => onMetadataChange({ category: value as GalleryCategory })}
              isDisabled={disabled}
              className="h-8 text-sm"
            >
              <Select.Item id="ORIGINAL">原创</Select.Item>
              <Select.Item id="REPOST">转发</Select.Item>
              <Select.Item id="AI">AI 生成</Select.Item>
            </Select>
          </div>
        </div>

        {/* 描述 */}
        <div className="space-y-1">
          <Label htmlFor={`description-${file.id}`} className="text-xs">
            描述
          </Label>
          <Textarea
            id={`description-${file.id}`}
            placeholder="输入图片描述"
            rows={2}
            value={metadata.description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              onMetadataChange({ description: e.target.value })
            }
            disabled={disabled}
            className="resize-none text-sm"
          />
        </div>

        {/* 文章ID */}
        <div className="space-y-1">
          <Label htmlFor={`postId-${file.id}`} className="text-xs">
            关联文章 ID
          </Label>
          <Input
            id={`postId-${file.id}`}
            placeholder="输入文章 ID(可选)"
            value={metadata.postId}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onMetadataChange({ postId: e.target.value })
            }
            disabled={disabled}
            className="h-8 text-sm"
          />
        </div>
      </div>

      {/* 复制到全部按钮 */}
      <div className="flex-shrink-0 md:self-start">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCopyToAll}
          disabled={disabled}
          className="w-full md:w-auto"
        >
          <Copy className="mr-1 h-3 w-3" />
          复制到全部
        </Button>
      </div>
    </div>
  );
}

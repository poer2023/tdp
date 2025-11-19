"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  Label,
  Textarea,
  Select,
  Alert,
} from "@/components/ui-heroui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  EnhancedImageUploader,
  type UploadFile,
  type UploadStatus,
} from "./enhanced-image-uploader";
import { IndividualEditCard } from "./individual-edit-card";
import { QuickActionsToolbar } from "./quick-actions-toolbar";

type GalleryCategory = "REPOST" | "ORIGINAL" | "AI";

interface FileMetadata {
  title: string;
  description: string;
  category: GalleryCategory;
  postId: string;
}

interface UnifiedUploadFormProps {
  className?: string;
}

/**
 * 统一的相册上传表单
 * - 集成 EnhancedImageUploader
 * - 支持批量设置和单独编辑
 * - 保留所有现有功能：Live Photo、EXIF、地理编码等
 */
export function UnifiedUploadForm({ className }: UnifiedUploadFormProps) {
  const router = useRouter();

  // 文件状态
  const [files, setFiles] = React.useState<UploadFile[]>([]);

  // 批量元数据
  const [bulkMetadata, setBulkMetadata] = React.useState({
    title: "",
    description: "",
    category: "ORIGINAL" as GalleryCategory,
    postId: "",
  });

  // 单独编辑元数据
  const [individualMetadata, setIndividualMetadata] = React.useState<Map<string, FileMetadata>>(
    new Map()
  );

  // 当前活动标签页
  const [activeTab, setActiveTab] = React.useState<"bulk" | "individual">("bulk");

  // 上传状态
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadMessage, setUploadMessage] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  /**
   * 更新单个文件的状态
   */
  const updateFileStatus = (
    id: string,
    updates: {
      status?: UploadStatus;
      progress?: number;
      error?: string;
    }
  ) => {
    setFiles((prev) => prev.map((file) => (file.id === id ? { ...file, ...updates } : file)));
  };

  /**
   * 当文件列表变化时,初始化单独编辑的元数据
   */
  React.useEffect(() => {
    setIndividualMetadata((prevMetadata) => {
      const newMetadata = new Map(prevMetadata);

      // 为新添加的图片文件初始化元数据
      files
        .filter((f) => f.type === "image")
        .forEach((file) => {
          if (!newMetadata.has(file.id)) {
            newMetadata.set(file.id, {
              title: "",
              description: "",
              category: "ORIGINAL",
              postId: "",
            });
          }
        });

      // 移除已删除文件的元数据
      const currentFileIds = new Set(files.filter((f) => f.type === "image").map((f) => f.id));
      for (const id of newMetadata.keys()) {
        if (!currentFileIds.has(id)) {
          newMetadata.delete(id);
        }
      }

      return newMetadata;
    });
  }, [files]);

  /**
   * 更新单个图片的元数据
   */
  const updateIndividualMetadata = (fileId: string, updates: Partial<FileMetadata>) => {
    setIndividualMetadata((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(fileId);
      if (current) {
        newMap.set(fileId, { ...current, ...updates });
      }
      return newMap;
    });
  };

  /**
   * 将某张图片的元数据复制到所有图片
   */
  const copyToAll = (sourceFileId: string) => {
    const sourceMetadata = individualMetadata.get(sourceFileId);
    if (!sourceMetadata) return;

    setIndividualMetadata((prev) => {
      const newMap = new Map(prev);
      for (const fileId of newMap.keys()) {
        newMap.set(fileId, { ...sourceMetadata });
      }
      return newMap;
    });
  };

  /**
   * 将批量设置应用到所有单独编辑的图片
   */
  const applyBulkToIndividual = () => {
    setIndividualMetadata((prev) => {
      const newMap = new Map(prev);
      for (const fileId of newMap.keys()) {
        newMap.set(fileId, {
          title: bulkMetadata.title,
          description: bulkMetadata.description,
          category: bulkMetadata.category,
          postId: bulkMetadata.postId,
        });
      }
      return newMap;
    });
  };

  /**
   * 清除所有单独编辑的元数据
   */
  const clearAllIndividual = () => {
    setIndividualMetadata((prev) => {
      const newMap = new Map(prev);
      for (const fileId of newMap.keys()) {
        newMap.set(fileId, {
          title: "",
          description: "",
          category: "ORIGINAL",
          postId: "",
        });
      }
      return newMap;
    });
  };

  /**
   * 使用 XMLHttpRequest 上传单个文件（支持进度）
   */
  const uploadSingleFile = (
    uploadFile: UploadFile,
    pairedVideo?: UploadFile,
    metadata?: FileMetadata
  ): Promise<{ success: boolean; error?: string }> => {
    return new Promise((resolve) => {
      const formData = new FormData();
      formData.append("image", uploadFile.file);

      // 如果有配对的视频（Live Photo）
      if (pairedVideo) {
        formData.append("video", pairedVideo.file);
      }

      // 添加元数据（如果提供）
      const fileMetadata = metadata || {
        title: bulkMetadata.title,
        description: bulkMetadata.description,
        category: bulkMetadata.category,
        postId: bulkMetadata.postId,
      };

      if (fileMetadata.title) {
        formData.append("title", fileMetadata.title);
      }
      if (fileMetadata.description) {
        formData.append("description", fileMetadata.description);
      }
      formData.append("category", fileMetadata.category);
      if (fileMetadata.postId) {
        formData.append("postId", fileMetadata.postId);
      }

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          updateFileStatus(uploadFile.id, { progress });
          // 同步更新配对视频的进度
          if (pairedVideo) {
            updateFileStatus(pairedVideo.id, { progress });
          }
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          updateFileStatus(uploadFile.id, {
            status: "success",
            progress: 100,
          });
          if (pairedVideo) {
            updateFileStatus(pairedVideo.id, {
              status: "success",
              progress: 100,
            });
          }
          resolve({ success: true });
        } else {
          const error = xhr.responseText || "上传失败";
          updateFileStatus(uploadFile.id, {
            status: "error",
            error,
          });
          if (pairedVideo) {
            updateFileStatus(pairedVideo.id, {
              status: "error",
              error,
            });
          }
          resolve({ success: false, error });
        }
      });

      xhr.addEventListener("error", () => {
        const error = "网络错误";
        updateFileStatus(uploadFile.id, {
          status: "error",
          error,
        });
        if (pairedVideo) {
          updateFileStatus(pairedVideo.id, {
            status: "error",
            error,
          });
        }
        resolve({ success: false, error });
      });

      xhr.open("POST", "/api/admin/gallery/upload");
      xhr.send(formData);
    });
  };

  /**
   * 上传处理函数
   */
  const handleUpload = async () => {
    if (files.length === 0) {
      setUploadMessage({
        type: "error",
        text: "请先选择要上传的文件",
      });
      return;
    }

    setIsUploading(true);
    setUploadMessage(null);

    try {
      const imageFiles = files.filter((f) => f.type === "image");
      const videoFilesMap = new Map(files.filter((f) => f.type === "video").map((f) => [f.id, f]));

      // 并发上传控制
      const CONCURRENCY = 3;
      let completed = 0;
      let failed = 0;

      // 批量上传
      for (let i = 0; i < imageFiles.length; i += CONCURRENCY) {
        const batch = imageFiles.slice(i, i + CONCURRENCY);

        // 设置上传中状态
        batch.forEach((file) => {
          updateFileStatus(file.id, { status: "uploading", progress: 0 });
        });

        // 并发上传
        const uploadPromises = batch.map((imageFile) => {
          // 查找配对的视频
          const pairedVideo = imageFile.pairedWith
            ? videoFilesMap.get(imageFile.pairedWith)
            : undefined;

          // 根据活动标签页选择元数据
          const metadata =
            activeTab === "individual" ? individualMetadata.get(imageFile.id) : undefined; // undefined 会使用 bulkMetadata

          return uploadSingleFile(imageFile, pairedVideo, metadata);
        });

        const results = await Promise.all(uploadPromises);

        // 统计结果
        results.forEach((result) => {
          if (result.success) {
            completed++;
          } else {
            failed++;
          }
        });
      }

      if (failed === 0) {
        setUploadMessage({
          type: "success",
          text: `成功上传 ${completed} 张图片！`,
        });

        // 2秒后重置表单并刷新
        setTimeout(() => {
          setFiles([]);
          setBulkMetadata({
            title: "",
            description: "",
            category: "ORIGINAL",
            postId: "",
          });
          router.refresh();
        }, 2000);
      } else {
        setUploadMessage({
          type: "error",
          text: `上传完成：${completed} 成功，${failed} 失败`,
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadMessage({
        type: "error",
        text: error instanceof Error ? error.message : "上传失败，请重试",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const imageCount = files.filter((f) => f.type === "image").length;
  const livePhotoCount = files.filter((f) => f.isLivePhoto && f.type === "image").length;

  return (
    <div className={className}>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">上传图片到相册</CardTitle>
          <CardDescription className="text-xs">
            支持批量上传、Live Photo 自动配对、EXIF 元数据提取
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 两栏布局：左侧上传+预览，右侧编辑表单 */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5 lg:gap-6">
            {/* 左侧：图片上传器 + 预览（占2列，lg屏幕sticky） */}
            <div className="lg:col-span-2">
              <div className="space-y-3 lg:sticky lg:top-4">
                <EnhancedImageUploader
                  files={files}
                  onChange={setFiles}
                  maxFiles={50}
                  maxSize={10}
                  accept="image/*,video/quicktime,video/mp4"
                  disabled={isUploading}
                />
              </div>
            </div>

            {/* 右侧：元数据编辑（占3列） */}
            <div className="lg:col-span-3">
              {files.length > 0 && (
                <Tabs
                  value={activeTab}
                  onValueChange={(value) => setActiveTab(value as "bulk" | "individual")}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="bulk">批量设置</TabsTrigger>
                    <TabsTrigger value="individual">单独编辑</TabsTrigger>
                  </TabsList>

                  {/* 批量设置 Tab */}
                  <TabsContent value="bulk" className="mt-3 space-y-3">
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* 标题 */}
                      <div className="space-y-2">
                        <Label htmlFor="bulk-title">标题（可选）</Label>
                        <Input
                          id="bulk-title"
                          placeholder="为所有图片设置相同标题"
                          value={bulkMetadata.title}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setBulkMetadata((prev) => ({
                              ...prev,
                              title: e.target.value,
                            }))
                          }
                          disabled={isUploading}
                        />
                      </div>

                      {/* 分类 */}
                      <div className="space-y-2">
                        <Label htmlFor="bulk-category">分类</Label>
                        <Select
                          value={bulkMetadata.category}
                          onChange={(value) =>
                            setBulkMetadata((prev) => ({
                              ...prev,
                              category: value as GalleryCategory,
                            }))
                          }
                          isDisabled={isUploading}
                        >
                          <Select.Item id="ORIGINAL">原创</Select.Item>
                          <Select.Item id="REPOST">转发</Select.Item>
                          <Select.Item id="AI">AI 生成</Select.Item>
                        </Select>
                      </div>

                      {/* 描述 */}
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="bulk-description">描述（可选）</Label>
                        <Textarea
                          id="bulk-description"
                          placeholder="为所有图片设置相同描述"
                          rows={3}
                          value={bulkMetadata.description}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            setBulkMetadata((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          disabled={isUploading}
                        />
                      </div>

                      {/* 关联文章 ID */}
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="bulk-postId">关联文章 ID（可选）</Label>
                        <Input
                          id="bulk-postId"
                          placeholder="输入文章 ID"
                          value={bulkMetadata.postId}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setBulkMetadata((prev) => ({
                              ...prev,
                              postId: e.target.value,
                            }))
                          }
                          disabled={isUploading}
                        />
                      </div>
                    </div>

                    {/* 提示信息 */}
                    <Alert>
                      <div className="text-xs">
                        💡 <strong>自动功能</strong>：上传时将自动提取 EXIF 元数据（拍摄时间、GPS
                        坐标、相机信息等）并生成缩略图。
                      </div>
                    </Alert>
                  </TabsContent>

                  {/* 单独编辑 Tab */}
                  <TabsContent value="individual" className="mt-3 space-y-3">
                    {/* 快捷操作工具栏 */}
                    <QuickActionsToolbar
                      onApplyBulk={applyBulkToIndividual}
                      onClearAll={clearAllIndividual}
                      disabled={isUploading}
                      imageCount={imageCount}
                    />

                    {/* 图片列表 - 自适应高度，最大高度由视口决定 */}
                    <div className="max-h-[calc(100vh-32rem)] space-y-3 overflow-y-auto pr-2">
                      {files
                        .filter((f) => f.type === "image")
                        .map((file) => {
                          const metadata = individualMetadata.get(file.id) || {
                            title: "",
                            description: "",
                            category: "ORIGINAL" as GalleryCategory,
                            postId: "",
                          };

                          return (
                            <IndividualEditCard
                              key={file.id}
                              file={file}
                              metadata={metadata}
                              onMetadataChange={(updates) =>
                                updateIndividualMetadata(file.id, updates)
                              }
                              onCopyToAll={() => copyToAll(file.id)}
                              disabled={isUploading}
                            />
                          );
                        })}
                    </div>

                    {/* 提示信息 */}
                    <Alert>
                      <div className="text-xs">
                        💡 <strong>提示</strong>
                        ：可以为每张图片设置不同的元数据。使用&quot;复制到全部&quot;按钮快速应用某张图片的设置,或使用&quot;应用批量设置&quot;将批量编辑的内容作为起点。
                      </div>
                    </Alert>
                  </TabsContent>
                </Tabs>
              )}

              {/* 上传消息 */}
              {uploadMessage && (
                <Alert
                  status={uploadMessage.type === "error" ? "danger" : "success"}
                  className="mt-3 text-sm"
                >
                  {uploadMessage.text}
                </Alert>
              )}

              {/* 上传按钮 */}
              {files.length > 0 && (
                <div className="mt-3 flex items-center justify-between border-t pt-3">
                  <div className="text-muted-foreground text-xs">
                    准备上传 {imageCount} 张图片
                    {livePhotoCount > 0 && ` (包含 ${livePhotoCount} 组 Live Photo)`}
                  </div>
                  <Button onPress={handleUpload} disabled={isUploading} size="default">
                    {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isUploading ? "上传中..." : "开始上传"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

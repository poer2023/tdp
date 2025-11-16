"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { uploadGalleryImageAction, type GalleryFormState } from "./actions";
import type { PostSummary } from "@/lib/posts";
import { Input, Textarea, Select, Button, Alert, Card } from "@/components/ui-heroui";
import { Chip } from "@/components/ui-heroui";

const INITIAL_STATE: GalleryFormState = {
  status: "idle",
};

export function GalleryUploadForm({ posts }: { posts: PostSummary[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(uploadGalleryImageAction, INITIAL_STATE);
  const [category, setCategory] = useState("REPOST");
  const [postId, setPostId] = useState("");

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      setCategory("REPOST");
      setPostId("");
    }
  }, [state]);

  return (
    <Card className="border-zinc-200/70 bg-white/80 backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-900/70">
      <Card.Header>
        <div className="flex w-full items-center justify-between">
          <div className="space-y-1">
            <Card.Title>上传照片</Card.Title>
            <Card.Description>
              自动提取 EXIF 元数据和 GPS 坐标。HEIC 格式将自动转换为 JPEG。Live Photo
              需同时选择图片和视频文件（同名配对）。
            </Card.Description>
          </div>
          {state.status === "success" && state.message && (
            <Chip color="success" variant="flat">
              {state.message}
            </Chip>
          )}
        </div>
      </Card.Header>

      <Card.Content>
        {state.status === "error" && state.message && (
          <Alert variant="danger" className="mb-4">
            {state.message}
          </Alert>
        )}

        <form ref={formRef} action={formAction} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <Field label="标题 (可选)">
              <Input
                name="title"
                type="text"
                placeholder="为照片添加一个标题"
              />
            </Field>

            <Field label="描述 (可选)">
              <Textarea
                name="description"
                rows={3}
                placeholder="记录照片背后的故事"
              />
            </Field>

            <Field label="分类">
              <Select value={category} onChange={setCategory}>
                <Select.Item id="REPOST">转发</Select.Item>
                <Select.Item id="ORIGINAL">拍照</Select.Item>
                <Select.Item id="AI">AI</Select.Item>
              </Select>
              <input type="hidden" name="category" value={category} />
            </Field>

            <Field label="关联文章 (可选)">
              <Select value={postId} onChange={setPostId} placeholder="不关联文章">
                <Select.Item id="">不关联文章</Select.Item>
                {posts.map((post) => (
                  <Select.Item key={post.id} id={post.id}>
                    {post.title}
                  </Select.Item>
                ))}
              </Select>
              <input type="hidden" name="postId" value={postId} />
            </Field>
          </div>

          <div className="flex flex-col gap-4">
            <Field label="文件上传" required>
              <input
                name="files"
                type="file"
                required
                accept="image/*,video/quicktime,video/mp4"
                multiple
                className="w-full text-sm text-zinc-600 file:mr-4 file:rounded-lg file:border file:border-zinc-300 file:bg-white file:px-4 file:py-2 file:text-sm file:font-medium file:text-zinc-900 file:transition-all hover:file:bg-zinc-50 dark:text-zinc-300 dark:file:border-zinc-700 dark:file:bg-zinc-900 dark:file:text-zinc-100"
              />
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                支持 JPG/PNG/WebP/HEIC 图片格式。HEIC 将自动转换为 JPEG。
                <br />
                <strong>Live Photo 上传</strong>：需同时选择图片和视频（文件名相同，如 IMG_1234.HEIC +
                IMG_1234.MOV），系统将自动识别配对关系。
              </p>
            </Field>

            <Button
              type="submit"
              variant="solid"
              color="primary"
              isDisabled={isPending}
              className="w-full"
            >
              {isPending ? "处理中…" : "上传照片"}
            </Button>
          </div>
        </form>
      </Card.Content>
    </Card>
  );
}

function Field({
  label,
  children,
  required,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold tracking-[0.2em] text-zinc-500 uppercase dark:text-zinc-400">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </label>
      {children}
    </div>
  );
}

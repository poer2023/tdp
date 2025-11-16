"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createPostAction, type PostFormState } from "./actions";
import {
  Input,
  Textarea,
  Select,
  Button,
  Alert,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Chip,
} from "@/components/ui-heroui";

const INITIAL_STATE: PostFormState = {
  status: "idle",
};

export function CreatePostForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createPostAction, INITIAL_STATE);
  const [content, setContent] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (state.status === "success" && state.redirectTo) {
      router.push(state.redirectTo);
      return;
    }

    if (state.status !== "success") return;

    if (state.redirectTo) {
      router.push(state.redirectTo);
      return;
    }

    formRef.current?.reset();
    startTransition(() => {
      setContent("");
    });
  }, [state, router]);

  return (
    <Card variant="secondary">
      <CardHeader>
        <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>创建新文章</CardTitle>
            <CardDescription>
              上传封面、填写 Markdown 内容并设置标签。
            </CardDescription>
          </div>
          {state.status === "success" && state.message && (
            <div className="flex flex-wrap items-center gap-3">
              <Chip status="success" size="sm">
                {state.message}
              </Chip>
              {state.previewUrl && (
                <Button
                  asChild
                  variant="secondary"
                  size="sm"
                >
                  <a href={state.previewUrl} target="_blank" rel="noopener noreferrer">
                    立即预览
                  </a>
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {state.status === "error" && state.message && (
          <Alert status="danger" description={state.message} />
        )}

        {state.status === "success" && state.message && !state.previewUrl && (
          <Alert status="success" description={state.message} />
        )}

        <form ref={formRef} action={formAction} className="grid gap-5 md:grid-cols-2">
        <div className="space-y-4 md:col-span-1">
          <div className="space-y-1">
            <Input
              name="title"
              label="标题"
              placeholder="例如：使用 Next.js 打造清新博客"
              isRequired
              errorMessage={state.errors?.title}
              isInvalid={!!state.errors?.title}
            />
          </div>

          <div className="space-y-1">
            <Input
              name="excerpt"
              label="简介"
              placeholder="一句话概括文章核心"
              isRequired
              errorMessage={state.errors?.excerpt}
              isInvalid={!!state.errors?.excerpt}
            />
          </div>

          <div className="space-y-1">
            <Input
              name="tags"
              label="标签"
              placeholder="使用逗号分隔多个标签"
            />
          </div>

          <div className="space-y-1">
            <Select
              name="status"
              label="状态"
              defaultSelectedKeys={["DRAFT"]}
            >
              <Select.Item id="DRAFT">草稿</Select.Item>
              <Select.Item id="PUBLISHED">立即发布</Select.Item>
            </Select>
          </div>

          <Field label="封面">
            <input
              name="cover"
              type="file"
              accept="image/*"
              className="w-full text-sm text-zinc-600 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-600 hover:file:bg-blue-100 dark:text-zinc-300"
            />
          </Field>
        </div>

        <div className="space-y-4 md:col-span-1">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 space-y-1">
                <Textarea
                  name="content"
                  label="正文 (支持 Markdown)"
                  placeholder="支持 **粗体**、`代码`、列表等 Markdown 语法"
                  rows={12}
                  isRequired
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  errorMessage={state.errors?.content}
                  isInvalid={!!state.errors?.content}
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                onPress={() => setShowPreview((prev) => !prev)}
                className="self-start mt-7 whitespace-nowrap"
              >
                {showPreview ? "隐藏预览" : "预览 Markdown"}
              </Button>
            </div>

            {showPreview && (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/70 p-4 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
                {content ? (
                  <div className="prose prose-sm prose-zinc dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    预览区域会显示 Markdown 渲染效果。
                  </p>
                )}
              </div>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            isDisabled={isPending}
            className="w-full"
          >
            {isPending ? "创建中…" : "发布文章"}
          </Button>
        </div>
      </form>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold tracking-[0.2em] text-zinc-500 uppercase dark:text-zinc-400">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-600 dark:text-red-300">{error}</p>}
    </div>
  );
}

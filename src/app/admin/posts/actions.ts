"use server";

import { revalidatePath } from "next/cache";
import { PostStatus, UserRole } from "@prisma/client";
import { auth } from "@/auth";
import { createPost, deletePost, getPostById, updatePost } from "@/lib/posts";
import { persistUploadedFile, removeUploadedFile } from "@/lib/uploads";

export type PostFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: {
    title?: string;
    excerpt?: string;
    content?: string;
  };
  redirectTo?: string;
  previewUrl?: string;
};

function initialState(): PostFormState {
  return { status: "idle" };
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    throw Object.assign(new Error("未授权"), { code: "UNAUTHORIZED" });
  }
  return session.user;
}

function parseStatus(value: FormDataEntryValue | null | undefined): PostStatus {
  if (value === "PUBLISHED") return PostStatus.PUBLISHED;
  if (value === "DRAFT") return PostStatus.DRAFT;
  return PostStatus.DRAFT;
}

function parseTags(value: FormDataEntryValue | null | undefined): string[] {
  if (!value || typeof value !== "string") return [];
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function validatePostInput({
  title,
  excerpt,
  content,
}: {
  title: string;
  excerpt: string;
  content: string;
}): PostFormState["errors"] {
  const errors: PostFormState["errors"] = {};
  if (title.length < 3) {
    errors.title = "标题至少需要 3 个字符";
  }
  if (excerpt.length < 10) {
    errors.excerpt = "简介至少需要 10 个字符";
  }
  if (content.length < 30) {
    errors.content = "正文至少需要 30 个字符";
  }
  return errors;
}

function invalidateCaches() {
  revalidatePath("/");
  revalidatePath("/posts");
  revalidatePath("/gallery");
  revalidatePath("/admin");
  revalidatePath("/admin/posts");
}

export async function createPostAction(
  _prevState: PostFormState = initialState(),
  formData: FormData
): Promise<PostFormState> {
  void _prevState;
  const user = await requireAdmin();

  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const excerpt = (formData.get("excerpt") as string | null)?.trim() ?? "";
  const content = (formData.get("content") as string | null)?.trim() ?? "";
  const tags = parseTags(formData.get("tags"));
  const status = parseStatus(formData.get("status"));
  const coverFile = formData.get("cover") as File | null;

  const errors = validatePostInput({ title, excerpt, content }) ?? {};
  if (Object.keys(errors).length) {
    return {
      status: "error",
      message: "请修正表单中的错误",
      errors,
    };
  }

  let coverImagePath: string | null = null;
  try {
    if (coverFile && coverFile.size > 0) {
      coverImagePath = await persistUploadedFile(coverFile, "covers");
    }
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "封面上传失败",
    };
  }

  const post = await createPost({
    title,
    excerpt,
    content,
    tags,
    status,
    coverImagePath,
    authorId: user.id,
  });

  invalidateCaches();
  revalidatePath(`/admin/posts/${post.id}`);
  revalidatePath(`/posts/${post.slug}`);

  return {
    status: "success",
    message: "文章已创建，静态页面将在 10-30 秒内刷新",
    redirectTo: `/admin/posts/${post.id}`,
    previewUrl: `/posts/${post.slug}?t=${Date.now()}`,
  };
}

export async function updatePostAction(
  _prevState: PostFormState = initialState(),
  formData: FormData
): Promise<PostFormState> {
  void _prevState;
  await requireAdmin();

  const id = formData.get("id");
  if (!id || typeof id !== "string") {
    return {
      status: "error",
      message: "缺少文章 ID",
    };
  }

  const existing = await getPostById(id);
  if (!existing) {
    return {
      status: "error",
      message: "文章不存在或已被删除",
    };
  }

  const title = (formData.get("title") as string | null)?.trim() ?? existing.title;
  const excerpt = (formData.get("excerpt") as string | null)?.trim() ?? existing.excerpt;
  const content = (formData.get("content") as string | null)?.trim() ?? existing.content;
  const tags = parseTags(formData.get("tags") ?? existing.tags.join(","));
  const status = parseStatus(formData.get("status") ?? existing.status);
  const removeCover = formData.get("removeCover") === "on";
  const coverFile = formData.get("cover") as File | null;

  const errors = validatePostInput({ title, excerpt, content }) ?? {};
  if (Object.keys(errors).length) {
    return {
      status: "error",
      message: "请修正表单中的错误",
      errors,
    };
  }

  let coverImagePath = existing.coverImagePath;
  if (removeCover) {
    await removeUploadedFile(existing.coverImagePath);
    coverImagePath = null;
  }

  if (coverFile && coverFile.size > 0) {
    try {
      const newPath = await persistUploadedFile(coverFile, "covers");
      await removeUploadedFile(existing.coverImagePath);
      coverImagePath = newPath;
    } catch (error) {
      return {
        status: "error",
        message: error instanceof Error ? error.message : "封面上传失败",
      };
    }
  }

  await updatePost(id, {
    title,
    excerpt,
    content,
    tags,
    status,
    coverImagePath,
  });

  invalidateCaches();
  revalidatePath(`/posts/${existing.slug}`);
  revalidatePath(`/admin/posts/${id}`);

  return {
    status: "success",
    message: "文章已更新，静态页面将在 10-30 秒内刷新",
    previewUrl: `/posts/${existing.slug}?t=${Date.now()}`,
  };
}

export async function deletePostAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id");
  if (!id || typeof id !== "string") {
    throw new Error("缺少文章 ID");
  }

  const existing = await getPostById(id);
  if (existing?.coverImagePath) {
    await removeUploadedFile(existing.coverImagePath);
  }

  await deletePost(id);
  invalidateCaches();
  if (existing?.slug) {
    revalidatePath(`/posts/${existing.slug}`);
  }
}

export async function publishPostAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id");
  if (!id || typeof id !== "string") {
    throw new Error("缺少文章 ID");
  }

  const existing = await getPostById(id);
  if (!existing) {
    throw new Error("文章不存在");
  }

  await updatePost(id, {
    status: PostStatus.PUBLISHED,
    publishedAt: new Date(),
  });

  invalidateCaches();
  revalidatePath(`/posts/${existing.slug}`);
}

export async function unpublishPostAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id");
  if (!id || typeof id !== "string") {
    throw new Error("缺少文章 ID");
  }

  const existing = await getPostById(id);
  if (!existing) {
    throw new Error("文章不存在");
  }

  await updatePost(id, {
    status: PostStatus.DRAFT,
    publishedAt: null,
  });

  invalidateCaches();
  revalidatePath(`/posts/${existing.slug}`);
}

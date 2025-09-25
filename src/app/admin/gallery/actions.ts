"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { addGalleryImage, deleteGalleryImage } from "@/lib/gallery";
import { persistUploadedFile, removeUploadedFile } from "@/lib/uploads";
import { getPostById } from "@/lib/posts";
import { UserRole } from "@prisma/client";

function invalidateCaches() {
  revalidatePath("/");
  revalidatePath("/gallery");
  revalidatePath("/admin/gallery");
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    throw new Error("未授权");
  }
  return session.user;
}

export type GalleryFormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function uploadGalleryImageAction(
  _prevState: GalleryFormState,
  formData: FormData
): Promise<GalleryFormState> {
  await requireAdmin();

  const file = formData.get("file") as File | null;
  const title = (formData.get("title") as string | null)?.trim() ?? null;
  const description = (formData.get("description") as string | null)?.trim() ?? null;
  const relatedPostId = ((formData.get("postId") as string | null) ?? "").trim() || null;

  if (!file || file.size === 0) {
    return {
      status: "error",
      message: "请选择要上传的图片",
    };
  }

  if (relatedPostId) {
    const post = await getPostById(relatedPostId);
    if (!post) {
      return {
        status: "error",
        message: "文章 ID 不存在，无法关联",
      };
    }
  }

  try {
    const filePath = await persistUploadedFile(file, "gallery");

    await addGalleryImage({
      title,
      description,
      postId: relatedPostId,
      filePath,
    });
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "上传失败，请稍后重试",
    };
  }

  invalidateCaches();

  return {
    status: "success",
    message: "图片上传成功",
  };
}

export async function deleteGalleryImageAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id");
  const filePath = formData.get("filePath") as string | null;
  if (!id || typeof id !== "string") {
    throw new Error("缺少图片 ID");
  }

  if (filePath) {
    await removeUploadedFile(filePath);
  }

  await deleteGalleryImage(id);
  invalidateCaches();
}

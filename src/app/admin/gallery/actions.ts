"use server";

import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { auth } from "@/auth";
import { addGalleryImage, deleteGalleryImage } from "@/lib/gallery";
import { removeUploadedFile } from "@/lib/uploads";
import { getPostById } from "@/lib/posts";
import { UserRole } from "@prisma/client";
import { extractExif } from "@/lib/exif";
import { reverseGeocode } from "@/lib/geocoding";
import { detectLivePhoto } from "@/lib/live-photo";
import { getStorageProvider } from "@/lib/storage";

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

function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  const ext = parts.length > 1 ? parts[parts.length - 1] : "";
  return ext ? ext.toLowerCase() : "bin";
}

export async function uploadGalleryImageAction(
  _prevState: GalleryFormState,
  formData: FormData
): Promise<GalleryFormState> {
  await requireAdmin();

  // 1. 获取文件（支持多文件上传 for Live Photo）
  const files = formData.getAll("files") as File[];
  if (!files.length) {
    return {
      status: "error",
      message: "请选择要上传的文件",
    };
  }

  const title = (formData.get("title") as string | null)?.trim() ?? null;
  const description = (formData.get("description") as string | null)?.trim() ?? null;
  const relatedPostId = ((formData.get("postId") as string | null) ?? "").trim() || null;

  // 验证关联文章
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
    // 2. 检测 Live Photo (配对的图片+视频)
    const { image, video } = detectLivePhoto(files);

    if (!image) {
      return {
        status: "error",
        message: "未找到有效的图片文件",
      };
    }

    // 3. 提取 EXIF 元数据
    const imageBuffer = Buffer.from(await image.arrayBuffer());
    const exifData = await extractExif(imageBuffer);

    // 4. 处理地理位置（优先手动输入，其次EXIF）
    let locationData = null;
    const manualLat = formData.get("latitude");
    const manualLng = formData.get("longitude");

    const latitude = manualLat ? parseFloat(manualLat as string) : exifData?.latitude;
    const longitude = manualLng ? parseFloat(manualLng as string) : exifData?.longitude;

    // 如果有坐标，进行逆地理编码
    if (latitude && longitude) {
      locationData = await reverseGeocode(latitude, longitude);
    }

    // 5. 上传文件到存储（本地 or S3）
    const storage = getStorageProvider();
    const imageFilename = `${crypto.randomUUID().replace(/-/g, "")}.${getFileExtension(image.name)}`;
    const imagePath = await storage.upload(imageBuffer, imageFilename, image.type);

    let videoPath = null;
    if (video) {
      const videoBuffer = Buffer.from(await video.arrayBuffer());
      const videoFilename = `${crypto.randomUUID().replace(/-/g, "")}.${getFileExtension(video.name)}`;
      videoPath = await storage.upload(videoBuffer, videoFilename, video.type);
    }

    // 6. 保存到数据库
    await addGalleryImage({
      title,
      description,
      filePath: storage.getPublicUrl(imagePath),
      postId: relatedPostId,

      // 地理位置
      latitude: latitude || null,
      longitude: longitude || null,
      locationName: locationData?.locationName || null,
      city: locationData?.city || null,
      country: locationData?.country || null,

      // Live Photo
      livePhotoVideoPath: videoPath ? storage.getPublicUrl(videoPath) : null,
      isLivePhoto: !!video,

      // 元数据
      fileSize: image.size || null,
      width: exifData?.width || null,
      height: exifData?.height || null,
      mimeType: image.type || null,
      capturedAt: exifData?.capturedAt || null,
      storageType: process.env.STORAGE_TYPE || "local",
    });

    invalidateCaches();

    return {
      status: "success",
      message: `上传成功${video ? "（包含 Live Photo 视频）" : ""}`,
    };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "上传失败，请稍后重试",
    };
  }
}

export async function deleteGalleryImageAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id");
  const filePath = formData.get("filePath") as string | null;
  const videoPath = formData.get("livePhotoVideoPath") as string | null;

  if (!id || typeof id !== "string") {
    throw new Error("缺少图片 ID");
  }

  // 删除文件（图片 + 可能的视频）
  if (filePath) {
    await removeUploadedFile(filePath);
  }
  if (videoPath) {
    await removeUploadedFile(videoPath);
  }

  await deleteGalleryImage(id);
  invalidateCaches();
}

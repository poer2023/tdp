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
import { detectLivePhoto, detectLivePhotoMetadata, verifyLivePhotoPair } from "@/lib/live-photo";
import { getStorageProvider } from "@/lib/storage";
import { processImage } from "@/lib/image-converter";

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
  const category = (formData.get("category") as string | null) ?? "REPOST";

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

    // 3. 处理图片：自动转换 HEIC 为 JPEG（基于 2025 最佳实践）
    const originalImageBuffer = Buffer.from(await image.arrayBuffer());
    const processedImage = await processImage(originalImageBuffer, image.name, {
      quality: 90,
      keepMetadata: true,
    });

    // 使用处理后的图片 Buffer
    const imageBuffer = processedImage.buffer;
    const wasConverted = processedImage.converted;

    // 记录转换信息
    if (wasConverted) {
      console.log(
        `HEIC 转换成功: ${image.name} → JPEG ` +
          `(原始: ${(originalImageBuffer.length / 1024).toFixed(2)} KB, ` +
          `转换后: ${(imageBuffer.length / 1024).toFixed(2)} KB)`
      );
    }

    // 4. 检测 Live Photo 元数据
    const livePhotoMetadata = await detectLivePhotoMetadata(imageBuffer);
    let isLivePhotoVerified = livePhotoMetadata.isLivePhoto;

    // 5. 提取 EXIF 元数据
    const exifData = await extractExif(imageBuffer);

    // 6. 处理地理位置（优先手动输入，其次EXIF）
    let locationData = null;
    const manualLat = formData.get("latitude");
    const manualLng = formData.get("longitude");

    const latitude = manualLat ? parseFloat(manualLat as string) : exifData?.latitude;
    const longitude = manualLng ? parseFloat(manualLng as string) : exifData?.longitude;

    // 如果有坐标，进行逆地理编码
    if (latitude && longitude) {
      locationData = await reverseGeocode(latitude, longitude);
    }

    // 7. 处理视频文件（如果有）
    let videoBuffer: Buffer | null = null;
    if (video) {
      videoBuffer = Buffer.from(await video.arrayBuffer());

      // 如果有视频，验证是否为配对的 Live Photo
      if (imageBuffer && videoBuffer) {
        isLivePhotoVerified = await verifyLivePhotoPair(imageBuffer, videoBuffer);
        if (isLivePhotoVerified) {
          console.log("验证成功：检测到配对的 Live Photo");
        }
      }
    }

    // 8. 上传文件到存储（本地 or S3）
    const storage = getStorageProvider();

    // 上传图片（使用 .jpg 扩展名，即使原始是 HEIC）
    const imageFilename = `${crypto.randomUUID().replace(/-/g, "")}.jpg`;
    const imagePath = await storage.upload(imageBuffer, imageFilename, "image/jpeg");

    let videoPath = null;
    if (videoBuffer) {
      const videoFilename = `${crypto.randomUUID().replace(/-/g, "")}.${getFileExtension(video!.name)}`;
      videoPath = await storage.upload(videoBuffer, videoFilename, video!.type);
    }

    // 9. 保存到数据库
    await addGalleryImage({
      title,
      description,
      filePath: storage.getPublicUrl(imagePath),
      postId: relatedPostId,
      category: category as "REPOST" | "ORIGINAL" | "AI",

      // 地理位置
      latitude: latitude || null,
      longitude: longitude || null,
      locationName: locationData?.locationName || null,
      city: locationData?.city || null,
      country: locationData?.country || null,

      // Live Photo - 使用验证后的标识
      livePhotoVideoPath: videoPath ? storage.getPublicUrl(videoPath) : null,
      isLivePhoto: isLivePhotoVerified,

      // 元数据
      fileSize: imageBuffer.length || null,
      width: processedImage.width || exifData?.width || null,
      height: processedImage.height || exifData?.height || null,
      mimeType: "image/jpeg", // 转换后统一为 JPEG
      capturedAt: exifData?.capturedAt || null,
      storageType: process.env.STORAGE_TYPE || "local",
    });

    invalidateCaches();

    // 生成成功消息
    let successMessage = "上传成功";
    if (wasConverted) {
      successMessage += "（HEIC 已自动转换为 JPEG）";
    }
    if (isLivePhotoVerified) {
      successMessage += "（Live Photo）";
    }

    return {
      status: "success",
      message: successMessage,
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

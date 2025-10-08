"use server";

import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { addGalleryImage } from "@/lib/gallery";
import { extractExif } from "@/lib/exif";
import { reverseGeocode } from "@/lib/geocoding";
import { getStorageProvider } from "@/lib/storage";
import { generateThumbnails, getThumbnailFilename } from "@/lib/image-processor";
import { UserRole, Prisma } from "@prisma/client";

type TriState<T> = { set?: T; clear?: true } | undefined;

export type BulkUploadState = {
  status: "idle" | "success" | "error";
  message?: string;
  results?: Array<{ key: string; ok: boolean; id?: string; error?: string }>;
};

export type BulkUpdateState = {
  status: "idle" | "success" | "error";
  message?: string;
  updatedCount?: number;
};

function invalidateCaches() {
  // Homepages
  revalidatePath("/");
  revalidatePath("/zh");
  // Galleries
  revalidatePath("/gallery");
  revalidatePath("/zh/gallery");
  revalidatePath("/admin/gallery");
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    throw new Error("未授权");
  }
  return session.user;
}

function baseName(name: string): string {
  return name.replace(/\.[^.]+$/, "").toLowerCase();
}

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/") || /\.(heic|heif|jpg|jpeg|png|webp|gif)$/i.test(file.name);
}

function isVideoFile(file: File): boolean {
  return file.type.startsWith("video/") || /\.(mov|mp4)$/i.test(file.name);
}

export async function bulkUploadGalleryAction(
  _prev: BulkUploadState,
  formData: FormData
): Promise<BulkUploadState> {
  await requireAdmin();

  const files = formData.getAll("files") as File[];
  if (!files.length) {
    return { status: "error", message: "请选择要上传的文件" };
  }

  const defaultTitle = (formData.get("title") as string | null)?.trim() || null;
  const defaultDescription = (formData.get("description") as string | null)?.trim() || null;
  const relatedPostId = ((formData.get("postId") as string | null) ?? "").trim() || null;

  // Group by basename and pair image+video for Live Photo
  const groups = new Map<string, { image?: File; video?: File }>();
  for (const file of files) {
    const key = baseName(file.name);
    if (!groups.has(key)) groups.set(key, {});
    const g = groups.get(key)!;
    if (isImageFile(file) && !g.image) g.image = file;
    if (isVideoFile(file) && !g.video) g.video = file;
  }

  const storage = getStorageProvider();
  const results: Array<{ key: string; ok: boolean; id?: string; error?: string }> = [];

  for (const [key, pair] of groups) {
    if (!pair.image) {
      results.push({ key, ok: false, error: "缺少图片文件" });
      continue;
    }
    try {
      const imageBuf = Buffer.from(await pair.image.arrayBuffer());
      const exif = await extractExif(imageBuf);

      // reverse geocode if coords exist
      let location = null as Awaited<ReturnType<typeof reverseGeocode>> | null;
      if (exif?.latitude && exif?.longitude) {
        try {
          location = await reverseGeocode(exif.latitude, exif.longitude);
        } catch {}
      }

      const imgExt = pair.image.name.split(".").pop() || "bin";
      const imgKey = `${crypto.randomUUID().replace(/-/g, "")}.${imgExt}`;

      // Generate thumbnails
      const thumbnails = await generateThumbnails(imageBuf);

      // Upload original + 3 thumbnails in batch
      const [imgPath, microPath, smallPath, mediumPath] = (await storage.uploadBatch([
        {
          buffer: imageBuf,
          filename: imgKey,
          mimeType: pair.image.type || "application/octet-stream",
        },
        {
          buffer: thumbnails.micro,
          filename: getThumbnailFilename(imgKey, "micro"),
          mimeType: "image/webp",
        },
        {
          buffer: thumbnails.small,
          filename: getThumbnailFilename(imgKey, "small"),
          mimeType: "image/webp",
        },
        {
          buffer: thumbnails.medium,
          filename: getThumbnailFilename(imgKey, "medium"),
          mimeType: "image/webp",
        },
      ])) as [string, string, string, string];

      let videoPublic: string | null = null;
      if (pair.video) {
        const vidBuf = Buffer.from(await pair.video.arrayBuffer());
        const vidExt = pair.video.name.split(".").pop() || "mov";
        const vidKey = `${crypto.randomUUID().replace(/-/g, "")}.${vidExt}`;
        const vidPath = await storage.upload(vidBuf, vidKey, pair.video.type || "video/quicktime");
        videoPublic = storage.getPublicUrl(vidPath);
      }

      const created = await addGalleryImage({
        title: defaultTitle,
        description: defaultDescription,
        filePath: storage.getPublicUrl(imgPath),
        microThumbPath: storage.getPublicUrl(microPath),
        smallThumbPath: storage.getPublicUrl(smallPath),
        mediumPath: storage.getPublicUrl(mediumPath),
        postId: relatedPostId,

        latitude: exif?.latitude ?? null,
        longitude: exif?.longitude ?? null,
        locationName: location?.locationName ?? null,
        city: location?.city ?? null,
        country: location?.country ?? null,

        livePhotoVideoPath: videoPublic,
        isLivePhoto: !!videoPublic,

        fileSize: pair.image.size || null,
        width: exif?.width ?? null,
        height: exif?.height ?? null,
        mimeType: pair.image.type || null,
        capturedAt: exif?.capturedAt ?? null,
        storageType: process.env.STORAGE_TYPE || "local",
      });

      results.push({ key, ok: true, id: created.id });
    } catch (err) {
      results.push({ key, ok: false, error: err instanceof Error ? err.message : "上传失败" });
    }
  }

  const okCount = results.filter((r) => r.ok).length;
  const failCount = results.length - okCount;
  invalidateCaches();
  return {
    status: failCount === 0 ? "success" : okCount > 0 ? "success" : "error",
    message: `完成：成功 ${okCount}，失败 ${failCount}`,
    results,
  };
}

export async function bulkUpdateGalleryAction(
  _prev: BulkUpdateState,
  formData: FormData
): Promise<BulkUpdateState> {
  await requireAdmin();

  const idsJson = formData.get("ids");
  const patchJson = formData.get("patch");
  if (!idsJson || !patchJson || typeof idsJson !== "string" || typeof patchJson !== "string") {
    return { status: "error", message: "缺少参数" };
  }

  const ids = JSON.parse(idsJson) as string[];
  const patch = JSON.parse(patchJson) as {
    title?: TriState<string>;
    description?: TriState<string>;
    postId?: TriState<string | null>;
    capturedAt?: TriState<string | null>;
    location?: TriState<{
      latitude?: number | null;
      longitude?: number | null;
      city?: string | null;
      country?: string | null;
      locationName?: string | null;
    }>;
  };

  if (!Array.isArray(ids) || ids.length === 0) {
    return { status: "error", message: "未选择任何图片" };
  }

  let updatedCount = 0;
  for (const id of ids) {
    const data: Prisma.GalleryImageUncheckedUpdateInput = {};

    if (patch.title) data.title = patch.title.clear ? null : (patch.title.set ?? undefined);
    if (patch.description)
      data.description = patch.description.clear ? null : (patch.description.set ?? undefined);
    if (patch.postId) data.postId = patch.postId.clear ? null : (patch.postId.set ?? undefined);
    if (patch.capturedAt)
      data.capturedAt = patch.capturedAt.clear
        ? null
        : patch.capturedAt.set
          ? new Date(patch.capturedAt.set)
          : undefined;
    if (patch.location) {
      const loc = patch.location;
      if (loc.clear) {
        data.latitude = null;
        data.longitude = null;
        data.locationName = null;
        data.city = null;
        data.country = null;
      } else if (loc.set) {
        const s = loc.set;
        if (s.latitude !== undefined) data.latitude = s.latitude;
        if (s.longitude !== undefined) data.longitude = s.longitude;
        if (s.locationName !== undefined) data.locationName = s.locationName;
        if (s.city !== undefined) data.city = s.city;
        if (s.country !== undefined) data.country = s.country;
      }
    }

    if (Object.keys(data).length === 0) continue;
    await prisma.galleryImage.update({ where: { id }, data });
    updatedCount += 1;
  }

  invalidateCaches();
  return { status: "success", message: `已更新 ${updatedCount} 项`, updatedCount };
}

export async function bulkDeleteGalleryAction(
  _prev: BulkUpdateState,
  formData: FormData
): Promise<BulkUpdateState> {
  await requireAdmin();
  const idsJson = formData.get("ids");
  if (!idsJson || typeof idsJson !== "string") {
    return { status: "error", message: "缺少参数" };
  }
  const ids = JSON.parse(idsJson) as string[];
  if (!Array.isArray(ids) || ids.length === 0) {
    return { status: "error", message: "未选择任何图片" };
  }

  const items = await prisma.galleryImage.findMany({
    where: { id: { in: ids } },
    select: { id: true, filePath: true, livePhotoVideoPath: true },
  });
  const storage = getStorageProvider();
  let count = 0;
  for (const it of items) {
    try {
      if (it.filePath) await storage.delete(it.filePath);
      if (it.livePhotoVideoPath) await storage.delete(it.livePhotoVideoPath);
      await prisma.galleryImage.delete({ where: { id: it.id } });
      count += 1;
    } catch {
      // continue
    }
  }
  invalidateCaches();
  return { status: "success", message: `已删除 ${count} 项`, updatedCount: count };
}

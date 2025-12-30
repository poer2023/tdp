"use server";

import { auth } from "@/auth";
import { createMoment, type MomentImage } from "@/lib/moments";
import { getStorageProviderAsync } from "@/lib/storage";
import { assertRateLimit } from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import sharp from "sharp";
import { generateThumbnails, getThumbnailFilename } from "@/lib/image-processor";

export type CreateMomentState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; id: string };

export async function createMomentAction(
  _prev: CreateMomentState,
  formData: FormData
): Promise<CreateMomentState> {
  const session = await auth();

  if (!session?.user?.id) return { status: "error", message: "未登录" };

  // Verify user exists in database before proceeding
  const userExists = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });

  if (!userExists) {
    console.error("❌ Session user ID not found in database:", session.user.id);
    return {
      status: "error",
      message: "会话已过期，请重新登录",
    };
  }

  // Basic rate limits
  try {
    await assertRateLimit(`moment:min:${session.user.id}`, 5, 60_000);
    await assertRateLimit(`moment:hour:${session.user.id}`, 50, 60 * 60_000);
  } catch {
    return { status: "error", message: "发布过于频繁，请稍后再试" };
  }

  const content = (formData.get("content") as string | null)?.trim() || "";
  if (!content && formData.getAll("images").length === 0)
    return { status: "error", message: "内容为空" };

  const visibility = ((formData.get("visibility") as string | null) || "PUBLIC") as
    | "PUBLIC"
    | "UNLISTED"
    | "PRIVATE";
  const lang = (formData.get("lang") as string | null) || "en-US";
  // Tags (comma or multiple values)
  const tagsField = (formData.get("tags") as string | null) || "";
  const tags = tagsField
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5);
  // Location
  const locName = (formData.get("locationName") as string | null)?.trim() || null;
  const locLat = parseFloat((formData.get("locationLat") as string) || "");
  const locLng = parseFloat((formData.get("locationLng") as string) || "");
  const location = locName
    ? {
      name: locName,
      lat: isFinite(locLat) ? locLat : undefined,
      lng: isFinite(locLng) ? locLng : undefined,
    }
    : null;
  // Schedule
  const scheduledAtStr = (formData.get("scheduledAt") as string | null) || "";
  const scheduledAt = scheduledAtStr ? new Date(scheduledAtStr) : null;

  const images: MomentImage[] = [];
  const files = (formData.getAll("images") as File[]).slice(0, 9);
  if (files.length) {
    const storage = await getStorageProviderAsync();
    const uploaded = await Promise.all(
      files.map(async (f) => {
        try {
          const buf = Buffer.from(await f.arrayBuffer());
          const base = cryptoRandom();
          const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
          const key = `${base}.${ext}`;

          // Always upload the original for archival
          const originalPath = await storage.upload(buf, key, f.type || "image/jpeg");

          // Generate webp thumbnails for display (micro/small/medium)
          let w: number | null = null;
          let h: number | null = null;
          let previewUrl: string | undefined;
          let displayUrl: string | undefined;
          let microThumbUrl: string | undefined;
          let smallThumbUrl: string | undefined;
          let mediumUrl: string | undefined;
          try {
            const img = sharp(buf).rotate(); // Auto-apply EXIF orientation
            const meta = await img.metadata();
            w = meta.width ?? null;
            h = meta.height ?? null;

            const thumbs = await generateThumbnails(buf, { small: 720, medium: 1600, quality: 82 });
            const [microPath, smallPath, mediumPath] = await Promise.all([
              storage.upload(thumbs.micro, getThumbnailFilename(key, "micro"), "image/webp"),
              storage.upload(thumbs.small, getThumbnailFilename(key, "small"), "image/webp"),
              storage.upload(thumbs.medium, getThumbnailFilename(key, "medium"), "image/webp"),
            ]);

            microThumbUrl = storage.getPublicUrl(microPath);
            smallThumbUrl = storage.getPublicUrl(smallPath);
            mediumUrl = storage.getPublicUrl(mediumPath);
            previewUrl = smallThumbUrl;
            // Use medium webp for display/open; fall back to original
            displayUrl = mediumUrl;
          } catch (err) {
            console.warn("[Moment] Thumbnail generation failed, using original", err);
          }

          return {
            url: displayUrl || storage.getPublicUrl(originalPath),
            w,
            h,
            previewUrl: previewUrl || storage.getPublicUrl(originalPath),
            microThumbUrl,
            smallThumbUrl,
            mediumUrl,
          } as MomentImage;
        } catch (err) {
          console.error("[Moment] Image upload failed", err);
          return null;
        }
      })
    );
    for (const it of uploaded) if (it) images.push(it);
  }

  try {
    const id = await createMoment({
      authorId: session.user.id,
      content,
      images,
      visibility,
      lang,
      status: scheduledAt && scheduledAt.getTime() > Date.now() ? "SCHEDULED" : "PUBLISHED",
      tags,
      location,
    });
    return { status: "success", id };
  } catch (error) {
    console.error("❌ Moment creation failed:", error);
    console.error("Stack trace:", error instanceof Error ? error.stack : "No stack available");
    return {
      status: "error",
      message: error instanceof Error ? error.message : "发布失败"
    };
  }
}

function cryptoRandom() {
  return (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)).replace(
    /-/g,
    ""
  );
}

"use server";

import { auth } from "@/auth";
import { createMoment, type MomentImage } from "@/lib/moments";
import { getStorageProvider } from "@/lib/storage";
import { assertRateLimit } from "@/lib/rate-limit";
import prisma from "@/lib/prisma";
import sharp from "sharp";

export type CreateMomentState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; id: string };

export async function createMomentAction(
  _prev: CreateMomentState,
  formData: FormData
): Promise<CreateMomentState> {
  const session = await auth();

  // Debug logging for session
  console.log("🔍 Session debug:", {
    hasSession: !!session,
    hasUser: !!session?.user,
    userId: session?.user?.id,
    userIdType: typeof session?.user?.id,
    userEmail: session?.user?.email,
  });

  if (!session?.user?.id) return { status: "error", message: "未登录" };

  // Verify user exists in database before proceeding
  const userExists = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true },
  });

  console.log("🔍 DB User check:", {
    sessionUserId: session.user.id,
    dbUser: userExists,
    userExists: !!userExists,
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
    const storage = getStorageProvider();
    const uploaded = await Promise.all(
      files.map(async (f) => {
        try {
          const buf = Buffer.from(await f.arrayBuffer());
          const base = cryptoRandom();
          const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
          const key = `${base}.${ext}`;
          const path = await storage.upload(buf, key, f.type || "image/jpeg");
          // generate webp preview (max width 1280)
          let w: number | null = null;
          let h: number | null = null;
          let previewUrl: string | undefined = undefined;
          try {
            const img = sharp(buf);
            const meta = await img.metadata();
            w = meta.width ?? null;
            h = meta.height ?? null;
            const resized = await img
              .resize({ width: 1280, withoutEnlargement: true })
              .webp({ quality: 82 })
              .toBuffer();
            const previewKey = `${base}.webp`;
            const previewPath = await storage.upload(resized, previewKey, "image/webp");
            previewUrl = storage.getPublicUrl(previewPath);
          } catch {}
          return { url: storage.getPublicUrl(path), w, h, previewUrl } as MomentImage & {
            previewUrl?: string;
          };
        } catch {
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

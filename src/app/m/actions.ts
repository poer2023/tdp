"use server";

import { auth } from "@/auth";
import { createMoment, type MomentImage } from "@/lib/moments";
import { getStorageProvider } from "@/lib/storage";
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
  if (!session?.user?.id) return { status: "error", message: "未登录" };

  const content = (formData.get("content") as string | null)?.trim() || "";
  if (!content && !formData.get("image")) return { status: "error", message: "内容为空" };

  const visibility = ((formData.get("visibility") as string | null) || "PUBLIC") as
    | "PUBLIC"
    | "UNLISTED"
    | "PRIVATE";
  const lang = (formData.get("lang") as string | null) || "en-US";

  const images: MomentImage[] = [];
  const image = formData.get("image") as File | null;
  if (image) {
    try {
      const buf = Buffer.from(await image.arrayBuffer());
      const storage = getStorageProvider();
      const key = `${cryptoRandom()}.${(image.name.split(".").pop() || "jpg").toLowerCase()}`;
      const path = await storage.upload(buf, key, image.type || "image/jpeg");
      let w: number | null = null;
      let h: number | null = null;
      try {
        const meta = await sharp(buf).metadata();
        w = meta.width ?? null;
        h = meta.height ?? null;
      } catch {}
      images.push({ url: storage.getPublicUrl(path), w, h });
    } catch {
      // ignore image failures for now
    }
  }

  try {
    const id = await createMoment({
      authorId: session.user.id,
      content,
      images,
      visibility,
      lang,
      status: "PUBLISHED",
    });
    return { status: "success", id };
  } catch (e) {
    return { status: "error", message: "发布失败" };
  }
}

function cryptoRandom() {
  return (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)).replace(
    /-/g,
    ""
  );
}

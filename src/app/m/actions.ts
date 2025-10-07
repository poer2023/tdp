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
  if (!content && formData.getAll("images").length === 0)
    return { status: "error", message: "内容为空" };

  const visibility = ((formData.get("visibility") as string | null) || "PUBLIC") as
    | "PUBLIC"
    | "UNLISTED"
    | "PRIVATE";
  const lang = (formData.get("lang") as string | null) || "en-US";

  const images: MomentImage[] = [];
  const files = (formData.getAll("images") as File[]).slice(0, 9);
  if (files.length) {
    const storage = getStorageProvider();
    const uploaded = await Promise.all(
      files.map(async (f) => {
        try {
          const buf = Buffer.from(await f.arrayBuffer());
          const key = `${cryptoRandom()}.${(f.name.split(".").pop() || "jpg").toLowerCase()}`;
          const path = await storage.upload(buf, key, f.type || "image/jpeg");
          let w: number | null = null;
          let h: number | null = null;
          try {
            const meta = await sharp(buf).metadata();
            w = meta.width ?? null;
            h = meta.height ?? null;
          } catch {}
          return { url: storage.getPublicUrl(path), w, h } as MomentImage;
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
      status: "PUBLISHED",
    });
    return { status: "success", id };
  } catch (_e) {
    return { status: "error", message: "发布失败" };
  }
}

function cryptoRandom() {
  return (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)).replace(
    /-/g,
    ""
  );
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import { getStorageProvider } from "@/lib/storage";
import sharp from "sharp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Generate avatar and cover thumbnails for Friend images
 * Avatar: 200x200 square for profile display
 * Cover: 800x800 square for card cover
 */
async function generateFriendThumbnails(imageBuffer: Buffer) {
  const quality = 85;

  const [avatar, cover] = await Promise.all([
    // Avatar: 200x200 square for profile display
    sharp(imageBuffer)
      .resize(200, 200, {
        fit: "cover",
        position: "center",
      })
      .webp({ quality })
      .toBuffer(),

    // Cover: 800x800 square for card cover display
    sharp(imageBuffer)
      .resize(800, 800, {
        fit: "cover",
        position: "center",
      })
      .webp({ quality })
      .toBuffer(),
  ]);

  return { avatar, cover };
}

export async function POST(req: Request) {
  // 验证权限
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const image = formData.get("image") as File | null;
    const type = (formData.get("type") as string | null) ?? "avatar"; // 'avatar' or 'cover'

    if (!image) {
      return NextResponse.json({ error: "Missing image file" }, { status: 400 });
    }

    // 文件大小限制 5MB
    if (image.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds 5MB" }, { status: 400 });
    }

    // 验证文件类型
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic"];
    if (!allowedTypes.includes(image.type.toLowerCase())) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPG, PNG, WebP, HEIC" },
        { status: 400 }
      );
    }

    const imageBuf = Buffer.from(await image.arrayBuffer());
    const storage = getStorageProvider();
    const baseKey = cryptoRandom();

    // 生成缩略图
    const thumbnails = await generateFriendThumbnails(imageBuf);

    // 上传两个尺寸
    const [avatarPath, coverPath] = (await storage.uploadBatch([
      {
        buffer: thumbnails.avatar,
        filename: `${baseKey}_avatar.webp`,
        mimeType: "image/webp",
      },
      {
        buffer: thumbnails.cover,
        filename: `${baseKey}_cover.webp`,
        mimeType: "image/webp",
      },
    ])) as [string, string];

    // 返回 URL
    return NextResponse.json({
      success: true,
      avatar: storage.getPublicUrl(avatarPath),
      cover: storage.getPublicUrl(coverPath),
    });
  } catch (err) {
    console.error("Friend image upload error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}

function cryptoRandom() {
  return (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)).replace(
    /-/g,
    ""
  );
}

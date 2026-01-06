import { mkdir, writeFile, unlink, stat } from "fs/promises";
import path from "path";
import crypto from "crypto";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");
const MAX_UPLOAD_SIZE_MB = Number(process.env.MAX_UPLOAD_SIZE_MB ?? 8);
const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/avif",
  "image/heic", // Live Photo
  "image/heif", // Live Photo
  "video/quicktime", // Live Photo MOV
  "video/mp4", // Live Photo alternative
  "video/webm", // Optimized web video
]);

// Video MIME types for detection
const VIDEO_MIME_TYPES = new Set([
  "video/quicktime",
  "video/mp4",
  "video/webm",
  "video/x-msvideo",
  "video/x-matroska",
]);

/**
 * Check if a file is a video based on MIME type
 */
export function isVideoFile(mimeType: string): boolean {
  return VIDEO_MIME_TYPES.has(mimeType) || mimeType.startsWith("video/");
}


export type UploadCategory = "covers" | "gallery" | "avatars";

export async function persistUploadedFile(file: File, category: UploadCategory): Promise<string> {
  if (!file.size) {
    throw new Error("上传文件为空");
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error(`图片大小不可超过 ${MAX_UPLOAD_SIZE_MB}MB`);
  }

  if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error("仅支持上传 JPG/PNG/WebP/GIF/SVG/AVIF/HEIC 图片和 MOV/MP4 视频");
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const randomName = crypto.randomUUID().replace(/-/g, "");
  const extension = getFileExtension(file.name, file.type);
  const dir = path.join(UPLOAD_ROOT, category);
  await mkdir(dir, { recursive: true });

  const fileName = `${randomName}.${extension}`;
  const filePath = path.join(dir, fileName);

  await writeFile(filePath, buffer);

  return `/api/uploads/${category}/${fileName}`;
}

export async function removeUploadedFile(relativePath?: string | null) {
  if (!relativePath) return;
  const sanitized = relativePath.startsWith("/") ? relativePath.slice(1) : relativePath;
  const fullPath = path.join(process.cwd(), "public", sanitized);

  try {
    await stat(fullPath);
  } catch {
    return;
  }

  await unlink(fullPath);
}

function getFileExtension(fileName: string, mimeType?: string): string {
  const extFromName = path.extname(fileName).replace(/^\./, "");
  if (extFromName) {
    return extFromName.toLowerCase();
  }

  if (mimeType) {
    const extension = MIME_EXTENSION_MAP[mimeType as keyof typeof MIME_EXTENSION_MAP];
    if (extension) {
      return extension;
    }
  }

  return "bin";
}

const MIME_EXTENSION_MAP = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/avif": "avif",
  "image/heic": "heic",
  "image/heif": "heif",
  "video/quicktime": "mov",
  "video/mp4": "mp4",
} as const;

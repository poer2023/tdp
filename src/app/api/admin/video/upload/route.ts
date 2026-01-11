import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import {
    processVideo,
    cleanupTempFiles,
    getTempDir,
    isSupportedVideoType,
    checkFFmpegAvailable,
} from "@/lib/video-processor";
import type { VideoProcessResult } from "@/lib/video-processor";
import { getStorageProviderAsync } from "@/lib/storage";
import { addGalleryImage } from "@/lib/gallery";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_VIDEO_SIZE_MB = Number(process.env.MAX_VIDEO_SIZE_MB ?? 50);
const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;
const MAX_VIDEO_DURATION = Number(process.env.MAX_VIDEO_DURATION ?? 30);

/**
 * Video data stored in database
 */
export interface VideoData {
    url: string; // Original video URL
    previewUrl: string; // Compressed preview URL (480p)
    thumbnailUrl: string; // Poster/thumbnail URL (WebP)
    duration: number; // Duration in seconds
    width: number;
    height: number;
    originalSize: number;
    previewSize: number;
}

/**
 * POST /api/admin/video/upload
 * Upload and process a video file
 * 
 * Returns:
 * - Original video URL (for detail view)
 * - Preview video URL (for hero/card, ~50-200KB)
 * - Thumbnail URL (for poster image)
 */
export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check FFmpeg availability
    const ffmpegAvailable = await checkFFmpegAvailable();
    if (!ffmpegAvailable) {
        return NextResponse.json(
            { error: "FFmpeg 未安装，无法处理视频" },
            { status: 500 }
        );
    }

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const title = (formData.get("title") as string | null)?.trim() || null;
        const description = (formData.get("description") as string | null)?.trim() || null;
        const category = (formData.get("category") as string | null) ?? "ORIGINAL";

        if (!file) {
            return NextResponse.json({ error: "未提供视频文件" }, { status: 400 });
        }

        // Validate file type
        if (!isSupportedVideoType(file.type)) {
            return NextResponse.json(
                { error: `不支持的视频格式: ${file.type}` },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_VIDEO_SIZE_BYTES) {
            return NextResponse.json(
                { error: `视频大小超过 ${MAX_VIDEO_SIZE_MB}MB 限制` },
                { status: 400 }
            );
        }

        // Process video (generates preview and thumbnail)
        const buffer = Buffer.from(await file.arrayBuffer());
        let result: VideoProcessResult;
        let tempDir: string | null = null;

        try {
            result = await processVideo(buffer, file.name, {
                maxDuration: MAX_VIDEO_DURATION,
            });
            tempDir = getTempDir(result.originalPath);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return NextResponse.json(
                { error: `视频处理失败: ${message}` },
                { status: 400 }
            );
        }

        // Upload all files to storage
        const storage = await getStorageProviderAsync();
        const baseName = crypto.randomUUID().replace(/-/g, "");
        const originalExt = path.extname(file.name).toLowerCase() || ".mp4";

        try {
            // Read processed files
            const originalBuffer = await fs.readFile(result.originalPath);
            const previewBuffer = await fs.readFile(result.previewPath);
            const thumbnailBuffer = await fs.readFile(result.thumbnailPath);

            // Upload all three versions
            const [originalPath, previewPath, thumbnailPath] = (await storage.uploadBatch([
                {
                    buffer: originalBuffer,
                    filename: `${baseName}${originalExt}`,
                    mimeType: file.type || "video/mp4",
                },
                {
                    buffer: previewBuffer,
                    filename: `${baseName}_preview.mp4`,
                    mimeType: "video/mp4",
                },
                {
                    buffer: thumbnailBuffer,
                    filename: `${baseName}_poster.webp`,
                    mimeType: "image/webp",
                },
            ])) as [string, string, string];


            // Clean up temp files
            if (tempDir) {
                await cleanupTempFiles(tempDir);
            }

            // Build video data
            const videoData: VideoData = {
                url: storage.getPublicUrl(originalPath),
                previewUrl: storage.getPublicUrl(previewPath),
                thumbnailUrl: storage.getPublicUrl(thumbnailPath),
                duration: result.metadata.duration,
                width: result.metadata.width,
                height: result.metadata.height,
                originalSize: result.metadata.size,
                previewSize: result.previewSize,
            };

            // 保存到数据库 Gallery
            const created = await addGalleryImage({
                title: title || `Video ${new Date().toLocaleDateString()}`,
                description,
                filePath: videoData.url,
                microThumbPath: videoData.thumbnailUrl,
                smallThumbPath: videoData.thumbnailUrl,
                mediumPath: videoData.previewUrl,
                category: category as "REPOST" | "ORIGINAL" | "MOMENT",
                livePhotoVideoPath: videoData.previewUrl, // 预览视频用于播放
                isLivePhoto: true, // 标记为有视频
                fileSize: file.size,
                width: result.metadata.width,
                height: result.metadata.height,
                mimeType: file.type || "video/mp4",
                storageType: process.env.STORAGE_TYPE || "local",
            });

            // Revalidate gallery pages
            revalidatePath("/");
            revalidatePath("/gallery");
            revalidatePath("/admin/gallery");

            return NextResponse.json({
                success: true,
                video: videoData,
                image: created, // 返回 gallery image 格式供前端使用
                compressionRatio: result.compressionRatio.toFixed(1),
                message: `视频处理完成，预览版大小: ${Math.round(result.previewSize / 1024)}KB`,
            });
        } catch (error) {
            // Clean up temp files on error
            if (tempDir) {
                await cleanupTempFiles(tempDir);
            }
            throw error;
        }
    } catch (error) {
        console.error("[Video Upload Error]", error);
        return NextResponse.json(
            { error: "视频上传失败，请重试" },
            { status: 500 }
        );
    }
}

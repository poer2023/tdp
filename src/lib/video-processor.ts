import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import os from "os";

/**
 * Video metadata extracted from source file
 */
export interface VideoMetadata {
    duration: number; // Duration in seconds
    width: number;
    height: number;
    codec: string;
    bitrate: number; // In kbps
    fps: number;
    size: number; // File size in bytes
}

/**
 * Result of video processing
 */
export interface VideoProcessResult {
    originalPath: string; // Path to original video
    previewPath: string; // Path to compressed preview video
    thumbnailPath: string; // Path to video thumbnail/poster
    metadata: VideoMetadata;
    previewSize: number;
    compressionRatio: number; // Original / Preview
}

/**
 * Video processing configuration
 */
export interface VideoProcessConfig {
    maxDuration: number; // Max allowed duration in seconds
    previewWidth: number; // Preview video width
    previewBitrate: string; // Target bitrate for preview (e.g., "500k")
    thumbnailTime: number; // Time in seconds to extract thumbnail
}

const DEFAULT_CONFIG: VideoProcessConfig = {
    maxDuration: 30, // 30 seconds max
    previewWidth: 480, // 480p preview
    previewBitrate: "500k", // 500 kbps for small file size
    thumbnailTime: 0, // First frame
};

/**
 * Check if FFmpeg is available
 */
export async function checkFFmpegAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
        const proc = spawn("ffmpeg", ["-version"]);
        proc.on("error", () => resolve(false));
        proc.on("close", (code) => resolve(code === 0));
    });
}

/**
 * Execute a command and return stdout/stderr
 */
function execCommand(cmd: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
        const proc = spawn(cmd, args);
        let stdout = "";
        let stderr = "";

        proc.stdout.on("data", (data) => {
            stdout += data.toString();
        });

        proc.stderr.on("data", (data) => {
            stderr += data.toString();
        });

        proc.on("close", (code) => {
            if (code === 0) {
                resolve({ stdout, stderr });
            } else {
                reject(new Error(`${cmd} failed with code ${code}: ${stderr}`));
            }
        });

        proc.on("error", (err) => {
            reject(err);
        });
    });
}

/**
 * Extract video metadata using FFprobe
 */
export async function extractVideoMetadata(inputPath: string): Promise<VideoMetadata> {
    const { stdout } = await execCommand("ffprobe", [
        "-v", "quiet",
        "-print_format", "json",
        "-show_format",
        "-show_streams",
        "-select_streams", "v:0",
        inputPath,
    ]);

    const result = JSON.parse(stdout) as {
        format?: {
            duration?: string;
            bit_rate?: string;
            size?: string;
        };
        streams?: Array<{
            width?: number;
            height?: number;
            codec_name?: string;
            r_frame_rate?: string;
        }>;
    };

    const format = result.format || {};
    const stream = result.streams?.[0] || {};

    // Parse frame rate (e.g., "30/1" -> 30)
    let fps = 30;
    if (stream.r_frame_rate) {
        const parts = stream.r_frame_rate.split("/");
        const num = Number(parts[0]);
        const den = Number(parts[1]);
        if (num && den) {
            fps = Math.round(num / den);
        }
    }

    return {
        duration: parseFloat(format.duration || "0"),
        width: stream.width || 0,
        height: stream.height || 0,
        codec: stream.codec_name || "unknown",
        bitrate: Math.round(parseInt(format.bit_rate || "0") / 1000),
        fps,
        size: parseInt(format.size || "0"),
    };
}

/**
 * Validate video against constraints
 */
export async function validateVideo(
    inputPath: string,
    config: Partial<VideoProcessConfig> = {}
): Promise<{ valid: boolean; error?: string; metadata?: VideoMetadata }> {
    const cfg = { ...DEFAULT_CONFIG, ...config };

    try {
        const metadata = await extractVideoMetadata(inputPath);

        if (metadata.duration > cfg.maxDuration) {
            return {
                valid: false,
                error: `视频时长 (${Math.round(metadata.duration)}秒) 超过最大限制 (${cfg.maxDuration}秒)`,
                metadata,
            };
        }

        if (metadata.duration === 0) {
            return {
                valid: false,
                error: "无法读取视频时长",
                metadata,
            };
        }

        return { valid: true, metadata };
    } catch (error) {
        return {
            valid: false,
            error: `无法读取视频元数据: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
}

/**
 * Generate video thumbnail/poster image (WebP format)
 */
export async function generateVideoThumbnail(
    inputPath: string,
    outputPath: string,
    time: number = 0
): Promise<void> {
    await execCommand("ffmpeg", [
        "-y", // Overwrite output
        "-ss", time.toString(),
        "-i", inputPath,
        "-vframes", "1",
        "-vf", "scale='min(800,iw)':-2", // Max 800px width, maintain aspect
        "-c:v", "libwebp",
        "-quality", "80",
        outputPath,
    ]);
}

/**
 * Generate compressed preview video (H.264 MP4 for best compatibility)
 * Target: ~50-200KB for hero/thumbnail use
 */
export async function generatePreviewVideo(
    inputPath: string,
    outputPath: string,
    config: Partial<VideoProcessConfig> = {}
): Promise<void> {
    const cfg = { ...DEFAULT_CONFIG, ...config };

    await execCommand("ffmpeg", [
        "-y", // Overwrite output
        "-i", inputPath,
        // Video: H.264 with low bitrate
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "28", // Higher CRF = smaller file
        "-b:v", cfg.previewBitrate,
        "-maxrate", cfg.previewBitrate,
        "-bufsize", "1M",
        // Scale to preview width
        "-vf", `scale=${cfg.previewWidth}:-2`,
        // No audio for previews (smaller file)
        "-an",
        // Web optimization
        "-movflags", "+faststart",
        // Output format
        "-f", "mp4",
        outputPath,
    ]);
}

/**
 * Process a video file: validate, generate preview and thumbnail
 * Returns paths to all generated files
 */
export async function processVideo(
    inputBuffer: Buffer,
    originalFilename: string,
    config: Partial<VideoProcessConfig> = {}
): Promise<VideoProcessResult> {
    const cfg = { ...DEFAULT_CONFIG, ...config };

    // Create temp directory for processing
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "video-process-"));

    // Get original extension or default to mp4
    const ext = path.extname(originalFilename).toLowerCase() || ".mp4";
    const baseName = crypto.randomUUID().replace(/-/g, "");

    const inputPath = path.join(tempDir, `input${ext}`);
    const previewPath = path.join(tempDir, `${baseName}_preview.mp4`);
    const thumbnailPath = path.join(tempDir, `${baseName}_poster.webp`);

    try {
        // Write input buffer to temp file
        await fs.writeFile(inputPath, inputBuffer);

        // Validate video
        const validation = await validateVideo(inputPath, cfg);
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        const metadata = validation.metadata!;

        // Generate thumbnail
        await generateVideoThumbnail(
            inputPath,
            thumbnailPath,
            Math.min(cfg.thumbnailTime, metadata.duration)
        );

        // Generate preview video
        await generatePreviewVideo(inputPath, previewPath, cfg);

        // Get preview file size
        const previewStats = await fs.stat(previewPath);
        const previewSize = previewStats.size;

        return {
            originalPath: inputPath,
            previewPath,
            thumbnailPath,
            metadata,
            previewSize,
            compressionRatio: metadata.size / previewSize,
        };
    } catch (error) {
        // Clean up temp files on error
        await fs.rm(tempDir, { recursive: true, force: true }).catch(() => { });
        throw error;
    }
}

/**
 * Clean up temp files after upload
 */
export async function cleanupTempFiles(tempDir: string): Promise<void> {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => { });
}

/**
 * Get temp directory from a file path
 */
export function getTempDir(filePath: string): string {
    return path.dirname(filePath);
}

/**
 * Check if a file is a video based on MIME type
 */
export function isVideoMimeType(mimeType: string): boolean {
    return mimeType.startsWith("video/");
}

/**
 * Supported video MIME types
 */
export const SUPPORTED_VIDEO_TYPES = new Set([
    "video/mp4",
    "video/quicktime", // MOV
    "video/webm",
    "video/x-msvideo", // AVI
    "video/x-matroska", // MKV
]);

/**
 * Check if video MIME type is supported
 */
export function isSupportedVideoType(mimeType: string): boolean {
    return SUPPORTED_VIDEO_TYPES.has(mimeType);
}

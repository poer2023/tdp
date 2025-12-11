import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getStorageConfig, isS3ConfigComplete } from "@/lib/storage/config";
import { ListObjectsV2Command, S3Client, HeadBucketCommand } from "@aws-sdk/client-s3";

/**
 * GET /api/admin/storage
 * List all files in storage with stats
 */
export async function GET() {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const config = getStorageConfig();
        const storageType = config.storageType;

        if (storageType === "local") {
            // For local storage, we don't have a listing API yet
            return NextResponse.json({
                provider: "local",
                configured: true,
                accessible: true,
                message: "Local storage listing not implemented. Use R2/S3 for full management features.",
                files: [],
                stats: {
                    totalFiles: 0,
                    totalSize: 0,
                    byType: {},
                },
            });
        }

        // For S3/R2 storage
        if (!isS3ConfigComplete(config)) {
            return NextResponse.json({
                provider: storageType,
                configured: false,
                message: "Storage not properly configured. Please configure in Admin > Storage.",
                files: [],
                stats: { totalFiles: 0, totalSize: 0, byType: {} },
            });
        }

        const { endpoint, accessKeyId, secretAccessKey, bucket, region, cdnUrl } = config;

        const client = new S3Client({
            endpoint: endpoint!,
            region: region || "auto",
            credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
        });

        // Check bucket access
        try {
            await client.send(new HeadBucketCommand({ Bucket: bucket! }));
        } catch {
            return NextResponse.json({
                provider: storageType,
                configured: true,
                accessible: false,
                bucket,
                region,
                endpoint,
                cdnUrl,
                message: "Cannot access bucket. Please check credentials and bucket name.",
                files: [],
                stats: { totalFiles: 0, totalSize: 0, byType: {} },
            });
        }

        // List all objects
        const allFiles: Array<{
            key: string;
            size: number;
            lastModified: string;
            url: string;
            type: string;
        }> = [];

        let continuationToken: string | undefined;

        do {
            const command = new ListObjectsV2Command({
                Bucket: bucket!,
                ContinuationToken: continuationToken,
                MaxKeys: 1000,
            });

            const response = await client.send(command);

            if (response.Contents) {
                for (const obj of response.Contents) {
                    if (!obj.Key) continue;

                    const ext = obj.Key.split(".").pop()?.toLowerCase() || "";
                    const isImage = ["jpg", "jpeg", "png", "webp", "gif", "avif", "heic", "heif", "svg"].includes(ext);
                    const isVideo = ["mp4", "mov", "webm", "avi"].includes(ext);

                    allFiles.push({
                        key: obj.Key,
                        size: obj.Size || 0,
                        lastModified: obj.LastModified?.toISOString() || "",
                        url: cdnUrl ? `${cdnUrl}/${obj.Key}` : `${endpoint}/${bucket}/${obj.Key}`,
                        type: isImage ? "image" : isVideo ? "video" : "other",
                    });
                }
            }

            continuationToken = response.NextContinuationToken;
        } while (continuationToken);

        // Filter out auto-generated thumbnails
        // Thumbnails have suffixes like _micro.webp, _small.webp, _medium.webp
        const thumbnailPattern = /_(micro|small|medium)\.webp$/i;
        const originalFiles = allFiles.filter(file => !thumbnailPattern.test(file.key));
        const thumbnailFiles = allFiles.filter(file => thumbnailPattern.test(file.key));

        // Create a lookup map for thumbnails (key without suffix -> thumbnail url)
        const thumbnailMap = new Map<string, string>();
        for (const thumb of thumbnailFiles) {
            // Extract base key: "image_small.webp" -> "image"
            const baseKey = thumb.key.replace(/_(micro|small|medium)\.webp$/i, '');
            // Prefer _small.webp for preview
            if (thumb.key.endsWith('_small.webp')) {
                thumbnailMap.set(baseKey, thumb.url);
            } else if (!thumbnailMap.has(baseKey) && thumb.key.endsWith('_medium.webp')) {
                thumbnailMap.set(baseKey, thumb.url);
            }
        }

        // Add thumbnail URLs to files
        const files = originalFiles.map(file => {
            // Get base key without extension
            const baseKey = file.key.replace(/\.[^.]+$/, '');
            const thumbnailUrl = thumbnailMap.get(baseKey);
            return {
                ...file,
                thumbnailUrl: thumbnailUrl || file.url, // Fallback to original if no thumbnail
            };
        });

        // Calculate stats (based on original files only, excluding thumbnails)
        const stats = {
            totalFiles: files.length,
            totalSize: files.reduce((acc, f) => acc + f.size, 0),
            byType: files.reduce(
                (acc, f) => {
                    acc[f.type] = (acc[f.type] || 0) + 1;
                    return acc;
                },
                {} as Record<string, number>
            ),
            // Include thumbnail info for reference
            thumbnailCount: thumbnailFiles.length,
            thumbnailSize: thumbnailFiles.reduce((acc, f) => acc + f.size, 0),
        };

        return NextResponse.json({
            provider: storageType,
            configured: true,
            accessible: true,
            bucket,
            cdnUrl,
            region,
            endpoint,
            files: files.slice(0, 200), // Limit to 200 files for response
            stats,
        });
    } catch (error) {
        console.error("[Storage API] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch storage info" },
            { status: 500 }
        );
    }
}

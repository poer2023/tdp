import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getStorageProvider } from "@/lib/storage";
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
        const storageType = (process.env.STORAGE_TYPE || process.env.STORAGE_DRIVER || "local") as string;

        if (storageType === "local") {
            // For local storage, we don't have a listing API yet
            return NextResponse.json({
                provider: "local",
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
        const endpoint = process.env.S3_ENDPOINT;
        const accessKeyId = process.env.S3_ACCESS_KEY_ID;
        const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
        const bucket = process.env.S3_BUCKET;
        const region = process.env.S3_REGION || "auto";
        const cdnUrl = process.env.S3_CDN_URL || process.env.S3_PUBLIC_BASE_URL;

        if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
            return NextResponse.json({
                provider: storageType,
                configured: false,
                message: "Storage not properly configured. Please set S3/R2 environment variables.",
                files: [],
                stats: { totalFiles: 0, totalSize: 0, byType: {} },
            });
        }

        const client = new S3Client({
            endpoint,
            region,
            credentials: { accessKeyId, secretAccessKey },
        });

        // Check bucket access
        try {
            await client.send(new HeadBucketCommand({ Bucket: bucket }));
        } catch {
            return NextResponse.json({
                provider: storageType,
                configured: true,
                accessible: false,
                message: "Cannot access bucket. Please check credentials and bucket name.",
                files: [],
                stats: { totalFiles: 0, totalSize: 0, byType: {} },
            });
        }

        // List all objects
        const files: Array<{
            key: string;
            size: number;
            lastModified: string;
            url: string;
            type: string;
        }> = [];

        let continuationToken: string | undefined;

        do {
            const command = new ListObjectsV2Command({
                Bucket: bucket,
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

                    files.push({
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

        // Calculate stats
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

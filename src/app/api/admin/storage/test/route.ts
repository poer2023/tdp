import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { S3Client, HeadBucketCommand } from "@aws-sdk/client-s3";
import { getStorageConfigAsync, type StorageConfigData } from "@/lib/storage/config";

const MASK_PREFIX = "••••";

/**
 * POST /api/admin/storage/test
 * Test S3/R2 connection with provided credentials
 */
export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { storageType, endpoint, region, accessKeyId, secretAccessKey, bucket } = body;

        const existingConfig = await getStorageConfigAsync();
        const isMasked = (value?: string) => !!value && value.startsWith(MASK_PREFIX);

        const effectiveStorageType = (storageType || existingConfig.storageType || "local") as StorageConfigData["storageType"];

        if (effectiveStorageType === 'local') {
            return NextResponse.json({ success: true, message: "Local storage mode" });
        }

        const resolvedEndpoint = !endpoint || isMasked(endpoint) ? existingConfig.endpoint : endpoint.trim();
        const resolvedRegion = region?.trim() || existingConfig.region || "auto";
        const resolvedBucket = !bucket || isMasked(bucket) ? existingConfig.bucket : bucket.trim();
        const resolvedAccessKeyId =
            !accessKeyId || isMasked(accessKeyId) ? existingConfig.accessKeyId : accessKeyId.trim();
        const resolvedSecretAccessKey =
            !secretAccessKey || isMasked(secretAccessKey) ? existingConfig.secretAccessKey : secretAccessKey.trim();

        if (!resolvedEndpoint || !resolvedAccessKeyId || !resolvedSecretAccessKey || !resolvedBucket) {
            return NextResponse.json({
                success: false,
                error: "Missing required fields"
            }, { status: 400 });
        }

        const client = new S3Client({
            endpoint: resolvedEndpoint,
            region: resolvedRegion || 'auto',
            credentials: {
                accessKeyId: resolvedAccessKeyId,
                secretAccessKey: resolvedSecretAccessKey,
            },
        });

        // Test bucket access
        await client.send(new HeadBucketCommand({ Bucket: resolvedBucket }));

        return NextResponse.json({
            success: true,
            message: "Connection successful"
        });
    } catch (error) {
        console.error("[Storage Test] Error:", error);

        // Extract more useful error information
        let message = "Connection failed";
        let errorCode = "UNKNOWN";

        if (error instanceof Error) {
            message = error.message;
            // AWS SDK errors often have a 'name' or 'Code' property
            const awsError = error as Error & { Code?: string; name?: string; $metadata?: { httpStatusCode?: number } };
            if (awsError.Code) {
                errorCode = awsError.Code;
            } else if (awsError.name && awsError.name !== 'Error') {
                errorCode = awsError.name;
            }

            // Add status code if available
            if (awsError.$metadata?.httpStatusCode) {
                message = `[HTTP ${awsError.$metadata.httpStatusCode}] ${message}`;
            }
        }

        return NextResponse.json({
            success: false,
            error: message,
            errorCode,
        }, { status: 400 });
    }
}

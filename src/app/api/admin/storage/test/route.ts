import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { S3Client, HeadBucketCommand } from "@aws-sdk/client-s3";

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

        if (storageType === 'local') {
            return NextResponse.json({ success: true, message: "Local storage mode" });
        }

        if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
            return NextResponse.json({
                success: false,
                error: "Missing required fields"
            }, { status: 400 });
        }

        const client = new S3Client({
            endpoint,
            region: region || 'auto',
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        });

        // Test bucket access
        await client.send(new HeadBucketCommand({ Bucket: bucket }));

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

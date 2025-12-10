import { NextResponse } from "next/server";
import { auth } from "@/auth";
import fs from "fs/promises";
import path from "path";

const CONFIG_FILE = path.join(process.cwd(), ".storage-config.json");

interface StorageConfig {
    storageType: 'local' | 'r2' | 's3';
    endpoint?: string;
    region?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    bucket?: string;
    cdnUrl?: string;
}

async function readConfig(): Promise<StorageConfig | null> {
    try {
        const data = await fs.readFile(CONFIG_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        return null;
    }
}

async function writeConfig(config: StorageConfig): Promise<void> {
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}

/**
 * POST /api/admin/storage/config
 * Save storage configuration to local JSON file
 * Note: Environment variables take precedence if set.
 * This config file is used as a fallback/override mechanism.
 */
export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { storageType, endpoint, region, accessKeyId, secretAccessKey, bucket, cdnUrl } = body;

        const configData: StorageConfig = {
            storageType,
            endpoint: storageType === 'local' ? undefined : endpoint,
            region: storageType === 'local' ? undefined : region,
            accessKeyId: storageType === 'local' ? undefined : accessKeyId,
            secretAccessKey: storageType === 'local' ? undefined : secretAccessKey,
            bucket: storageType === 'local' ? undefined : bucket,
            cdnUrl: storageType === 'local' ? undefined : cdnUrl,
        };

        await writeConfig(configData);

        return NextResponse.json({
            success: true,
            message: "Configuration saved. Server restart required for changes to take effect.",
            note: "For production, set these as environment variables in your deployment platform."
        });
    } catch (error) {
        console.error("[Storage Config] Error:", error);
        return NextResponse.json({
            error: "Failed to save configuration"
        }, { status: 500 });
    }
}

/**
 * GET /api/admin/storage/config
 * Get current storage configuration
 */
export async function GET() {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // First check environment variables (they take precedence)
        const envConfig = {
            storageType: process.env.STORAGE_TYPE || process.env.STORAGE_DRIVER || 'local',
            endpoint: process.env.S3_ENDPOINT || '',
            region: process.env.S3_REGION || 'auto',
            bucket: process.env.S3_BUCKET || '',
            cdnUrl: process.env.S3_CDN_URL || '',
            accessKeyId: process.env.S3_ACCESS_KEY_ID ? '••••••••' + (process.env.S3_ACCESS_KEY_ID.slice(-4) || '') : '',
        };

        // Check if env vars are configured
        if (process.env.S3_ENDPOINT && process.env.S3_ACCESS_KEY_ID) {
            return NextResponse.json({
                ...envConfig,
                secretAccessKey: '',
                source: 'environment',
            });
        }

        // Fall back to file config
        const fileConfig = await readConfig();
        if (fileConfig) {
            return NextResponse.json({
                ...fileConfig,
                accessKeyId: fileConfig.accessKeyId ? '••••••••' + fileConfig.accessKeyId.slice(-4) : '',
                secretAccessKey: '',
                source: 'file',
            });
        }

        // Return defaults
        return NextResponse.json({
            storageType: 'local',
            endpoint: '',
            region: 'auto',
            bucket: '',
            cdnUrl: '',
            accessKeyId: '',
            secretAccessKey: '',
            source: 'default',
        });
    } catch (error) {
        console.error("[Storage Config GET] Error:", error);
        return NextResponse.json({
            error: "Failed to get configuration"
        }, { status: 500 });
    }
}

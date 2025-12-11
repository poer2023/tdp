import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

const STORAGE_CONFIG_KEY = "storage_config";
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

/**
 * Try to read from database, fallback to file
 */
async function readConfig(): Promise<StorageConfig | null> {
    // Try database first
    try {
        const record = await prisma.siteConfig.findUnique({
            where: { key: STORAGE_CONFIG_KEY },
        });
        if (record) {
            return JSON.parse(record.value) as StorageConfig;
        }
    } catch (dbError) {
        console.log("[Storage Config] DB read failed, trying file:", dbError);
    }

    // Fallback to file
    try {
        const data = await fs.readFile(CONFIG_FILE, 'utf-8');
        return JSON.parse(data) as StorageConfig;
    } catch {
        return null;
    }
}

/**
 * Try to write to database, fallback to file
 */
async function writeConfig(config: StorageConfig): Promise<{ success: boolean; method: string; error?: string }> {
    // Try database first
    try {
        await prisma.siteConfig.upsert({
            where: { key: STORAGE_CONFIG_KEY },
            update: {
                value: JSON.stringify(config),
                updatedAt: new Date(),
            },
            create: {
                key: STORAGE_CONFIG_KEY,
                value: JSON.stringify(config),
                encrypted: true,
            },
        });
        return { success: true, method: 'database' };
    } catch (dbError) {
        console.error("[Storage Config] DB write failed:", dbError);

        // Fallback to file storage
        try {
            await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
            return { success: true, method: 'file' };
        } catch (fileError) {
            console.error("[Storage Config] File write also failed:", fileError);
            return {
                success: false,
                method: 'none',
                error: `数据库写入失败 (${dbError instanceof Error ? dbError.message : 'unknown'}), 文件写入也失败 (${fileError instanceof Error ? fileError.message : 'unknown'})`
            };
        }
    }
}

/**
 * POST /api/admin/storage/config
 * Save storage configuration
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

        const result = await writeConfig(configData);

        if (!result.success) {
            return NextResponse.json({
                error: result.error || "保存失败",
                details: "请检查数据库连接或确保 SiteConfig 表已创建"
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: result.method === 'database'
                ? "配置已保存到数据库"
                : "配置已保存到文件（数据库不可用）",
            method: result.method,
        });
    } catch (error) {
        console.error("[Storage Config POST] Error:", error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : "保存配置失败",
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
        if (process.env.S3_ENDPOINT && process.env.S3_ACCESS_KEY_ID) {
            return NextResponse.json({
                storageType: process.env.STORAGE_TYPE || process.env.STORAGE_DRIVER || 'r2',
                endpoint: process.env.S3_ENDPOINT || '',
                region: process.env.S3_REGION || 'auto',
                bucket: process.env.S3_BUCKET || '',
                cdnUrl: process.env.S3_CDN_URL || '',
                accessKeyId: '••••••••' + (process.env.S3_ACCESS_KEY_ID?.slice(-4) || ''),
                secretAccessKey: '',
                source: 'environment',
            });
        }

        // Fall back to database/file config
        const config = await readConfig();
        if (config) {
            return NextResponse.json({
                ...config,
                accessKeyId: config.accessKeyId ? '••••••••' + config.accessKeyId.slice(-4) : '',
                secretAccessKey: '',
                source: 'saved',
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
            error: error instanceof Error ? error.message : "获取配置失败"
        }, { status: 500 });
    }
}

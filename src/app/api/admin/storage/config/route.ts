import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

const STORAGE_CONFIG_KEY = "storage_config";

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
 * Ensure SiteConfig table exists, create if not
 */
async function ensureSiteConfigTable(): Promise<void> {
    try {
        // Try a simple query first
        await prisma.$queryRaw`SELECT 1 FROM "SiteConfig" LIMIT 1`;
    } catch {
        // Table doesn't exist, create it
        console.log("[Storage Config] Creating SiteConfig table...");
        await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "SiteConfig" (
        "key" TEXT PRIMARY KEY,
        "value" TEXT NOT NULL,
        "encrypted" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
      )
    `;
        console.log("[Storage Config] SiteConfig table created successfully");
    }
}

async function readConfigFromDB(): Promise<StorageConfig | null> {
    try {
        await ensureSiteConfigTable();
        const record = await prisma.siteConfig.findUnique({
            where: { key: STORAGE_CONFIG_KEY },
        });
        if (!record) return null;
        return JSON.parse(record.value) as StorageConfig;
    } catch (error) {
        console.error("[Storage Config] DB read error:", error);
        return null;
    }
}

async function writeConfigToDB(config: StorageConfig): Promise<void> {
    await ensureSiteConfigTable();
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
}

/**
 * POST /api/admin/storage/config
 * Save storage configuration to database
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

        await writeConfigToDB(configData);

        return NextResponse.json({
            success: true,
            message: "配置已保存到数据库",
        });
    } catch (error) {
        console.error("[Storage Config POST] Error:", error);
        const message = error instanceof Error ? error.message : "保存失败";
        return NextResponse.json({ error: message }, { status: 500 });
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

        // Fall back to database config
        const dbConfig = await readConfigFromDB();
        if (dbConfig) {
            return NextResponse.json({
                ...dbConfig,
                accessKeyId: dbConfig.accessKeyId ? '••••••••' + dbConfig.accessKeyId.slice(-4) : '',
                secretAccessKey: '',
                source: 'database',
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

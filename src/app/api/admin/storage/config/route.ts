import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import prisma from "@/lib/prisma";
import { clearConfigCache } from "@/lib/storage/config";

const STORAGE_CONFIG_KEY = "storage_config";
const MASK_PREFIX = "••••";

interface StorageConfig {
    storageType: 'local' | 'r2' | 's3';
    endpoint?: string;
    region?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    bucket?: string;
    cdnUrl?: string;
}

function getEnvStorageConfig(): StorageConfig | null {
    if (
        process.env.S3_ENDPOINT &&
        process.env.S3_ACCESS_KEY_ID &&
        process.env.S3_SECRET_ACCESS_KEY &&
        process.env.S3_BUCKET
    ) {
        return {
            storageType: (process.env.STORAGE_TYPE || process.env.STORAGE_DRIVER || "r2") as StorageConfig["storageType"],
            endpoint: process.env.S3_ENDPOINT,
            region: process.env.S3_REGION || "auto",
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
            bucket: process.env.S3_BUCKET,
            cdnUrl: process.env.S3_CDN_URL || "",
        };
    }

    return null;
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

        await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "SiteConfig" (
        "key" TEXT PRIMARY KEY,
        "value" TEXT NOT NULL,
        "encrypted" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
      )
    `;

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

async function getExistingConfig(): Promise<StorageConfig | null> {
    const envConfig = getEnvStorageConfig();
    if (envConfig) return envConfig;
    return await readConfigFromDB();
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
    clearConfigCache();
}

/**
 * POST /api/admin/storage/config
 * Save storage configuration to database
 */
export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { storageType, endpoint, region, accessKeyId, secretAccessKey, bucket, cdnUrl } = body;

        const existingConfig = await getExistingConfig();
        const isMasked = (value?: string) => !!value && value.startsWith(MASK_PREFIX);

        const resolvedAccessKeyId =
            storageType === 'local'
                ? undefined
                : (!accessKeyId || isMasked(accessKeyId) ? existingConfig?.accessKeyId : accessKeyId.trim());

        const resolvedSecretAccessKey =
            storageType === 'local'
                ? undefined
                : (!secretAccessKey || isMasked(secretAccessKey) ? existingConfig?.secretAccessKey : secretAccessKey.trim());

        const resolvedEndpoint = storageType === 'local' ? undefined : (endpoint?.trim() || existingConfig?.endpoint);
        const resolvedRegion = storageType === 'local' ? undefined : (region?.trim() || existingConfig?.region || 'auto');
        const resolvedBucket = storageType === 'local' ? undefined : (bucket?.trim() || existingConfig?.bucket);
        const resolvedCdnUrl = storageType === 'local' ? undefined : (cdnUrl?.trim() || existingConfig?.cdnUrl);

        if (storageType !== 'local' && (!resolvedEndpoint || !resolvedAccessKeyId || !resolvedSecretAccessKey || !resolvedBucket)) {
            return NextResponse.json({ error: "请填写完整的存储配置" }, { status: 400 });
        }

        const configData: StorageConfig = {
            storageType,
            endpoint: resolvedEndpoint,
            region: resolvedRegion,
            accessKeyId: resolvedAccessKeyId,
            secretAccessKey: resolvedSecretAccessKey,
            bucket: resolvedBucket,
            cdnUrl: resolvedCdnUrl,
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
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Helper to mask sensitive values (show MASK_PREFIX + last 4 chars)
        const maskValue = (value?: string) => {
            if (!value || value.length <= 4) return MASK_PREFIX;
            return MASK_PREFIX + value.slice(-4);
        };

        // First check environment variables (they take precedence)
        if (process.env.S3_ENDPOINT && process.env.S3_ACCESS_KEY_ID) {
            return NextResponse.json({
                storageType: process.env.STORAGE_TYPE || process.env.STORAGE_DRIVER || 'r2',
                endpoint: process.env.S3_ENDPOINT || '',
                region: process.env.S3_REGION || 'auto',
                bucket: process.env.S3_BUCKET || '',
                cdnUrl: process.env.S3_CDN_URL || '',
                accessKeyId: maskValue(process.env.S3_ACCESS_KEY_ID),
                secretAccessKey: maskValue(process.env.S3_SECRET_ACCESS_KEY),
                source: 'environment',
            });
        }

        // Fall back to database config
        const dbConfig = await readConfigFromDB();
        if (dbConfig) {
            return NextResponse.json({
                ...dbConfig,
                accessKeyId: maskValue(dbConfig.accessKeyId),
                secretAccessKey: maskValue(dbConfig.secretAccessKey),
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

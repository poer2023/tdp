import prisma from "@/lib/prisma";

export interface StorageConfigData {
    storageType: "local" | "r2" | "s3";
    endpoint?: string;
    region?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    bucket?: string;
    cdnUrl?: string;
}

const STORAGE_CONFIG_KEY = "storage_config";

// Cache to avoid repeated DB queries in the same request
let cachedConfig: StorageConfigData | null = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

/**
 * Read storage configuration from database
 */
async function readConfigFromDB(): Promise<StorageConfigData | null> {
    try {
        const record = await prisma.siteConfig.findUnique({
            where: { key: STORAGE_CONFIG_KEY },
        });
        if (!record) return null;
        return JSON.parse(record.value) as StorageConfigData;
    } catch {
        return null;
    }
}

/**
 * Read storage configuration from config file or environment variables
 * Priority: Environment variables > Database > Defaults
 */
export function getStorageConfig(): StorageConfigData {
    // First check environment variables (they always take precedence)
    const envType = (process.env.STORAGE_TYPE || process.env.STORAGE_DRIVER) as StorageConfigData["storageType"] | undefined;

    if (process.env.S3_ENDPOINT && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY && process.env.S3_BUCKET) {

        return {
            storageType: envType || "r2",
            endpoint: process.env.S3_ENDPOINT,
            region: process.env.S3_REGION || "auto",
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
            bucket: process.env.S3_BUCKET,
            cdnUrl: process.env.S3_CDN_URL || process.env.S3_PUBLIC_BASE_URL,
        };
    }

    // For synchronous compatibility, return cached config or defaults
    // Database config is loaded asynchronously via getStorageConfigAsync
    if (cachedConfig && Date.now() - cacheTime < CACHE_TTL) {
        return cachedConfig;
    }

    // Return local as default (async loading will update cache)
    return { storageType: "local" };
}

/**
 * Async version - reads from database if not in environment
 */
export async function getStorageConfigAsync(): Promise<StorageConfigData> {
    // First check environment variables
    const envType = (process.env.STORAGE_TYPE || process.env.STORAGE_DRIVER) as StorageConfigData["storageType"] | undefined;

    if (process.env.S3_ENDPOINT && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY && process.env.S3_BUCKET) {
        return {
            storageType: envType || "r2",
            endpoint: process.env.S3_ENDPOINT,
            region: process.env.S3_REGION || "auto",
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
            bucket: process.env.S3_BUCKET,
            cdnUrl: process.env.S3_CDN_URL || process.env.S3_PUBLIC_BASE_URL,
        };
    }

    // Try database
    const dbConfig = await readConfigFromDB();
    if (dbConfig && dbConfig.storageType !== "local") {
        if (dbConfig.endpoint && dbConfig.accessKeyId && dbConfig.secretAccessKey && dbConfig.bucket) {

            // Update cache
            cachedConfig = dbConfig;
            cacheTime = Date.now();
            return dbConfig;
        }
    } else if (dbConfig?.storageType === "local") {
        cachedConfig = dbConfig;
        cacheTime = Date.now();
        return { storageType: "local" };
    }

    // Default
    return { storageType: "local" };
}

/**
 * Check if S3/R2 configuration is complete
 */
export function isS3ConfigComplete(config: StorageConfigData): boolean {
    return !!(config.endpoint && config.accessKeyId && config.secretAccessKey && config.bucket);
}

/**
 * Clear config cache (call when config is updated)
 */
export function clearConfigCache(): void {
    cachedConfig = null;
    cacheTime = 0;
}

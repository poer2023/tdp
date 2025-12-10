import fs from "fs";
import path from "path";

export interface StorageConfigData {
    storageType: "local" | "r2" | "s3";
    endpoint?: string;
    region?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    bucket?: string;
    cdnUrl?: string;
}

const CONFIG_FILE = path.join(process.cwd(), ".storage-config.json");

/**
 * Read storage configuration from config file or environment variables
 * Priority: Config file > Environment variables > Defaults
 */
export function getStorageConfig(): StorageConfigData {
    // Try to read from config file first
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const data = fs.readFileSync(CONFIG_FILE, "utf-8");
            const config = JSON.parse(data) as StorageConfigData;

            // If config file has valid R2/S3 settings, use them
            if (config.storageType && config.storageType !== "local") {
                if (config.endpoint && config.accessKeyId && config.secretAccessKey && config.bucket) {
                    console.log(`[Storage] Using config from file: ${config.storageType}`);
                    return config;
                }
            } else if (config.storageType === "local") {
                console.log("[Storage] Using local storage from config file");
                return { storageType: "local" };
            }
        }
    } catch (error) {
        console.log("[Storage] No config file found or invalid, falling back to env vars");
    }

    // Fall back to environment variables
    const envType = (process.env.STORAGE_TYPE || process.env.STORAGE_DRIVER || "local") as StorageConfigData["storageType"];

    return {
        storageType: envType,
        endpoint: process.env.S3_ENDPOINT,
        region: process.env.S3_REGION || "auto",
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        bucket: process.env.S3_BUCKET,
        cdnUrl: process.env.S3_CDN_URL || process.env.S3_PUBLIC_BASE_URL,
    };
}

/**
 * Check if S3/R2 configuration is complete
 */
export function isS3ConfigComplete(config: StorageConfigData): boolean {
    return !!(config.endpoint && config.accessKeyId && config.secretAccessKey && config.bucket);
}

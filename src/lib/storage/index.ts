import { LocalStorage } from "./local-storage";
import { S3Storage } from "./s3-storage";
import type { StorageProvider, StorageType } from "./types";
import { getStorageConfig, getStorageConfigAsync } from "./config";

/**
 * Get storage provider (sync version - uses cached config)
 * For initial load, use getStorageProviderAsync first to ensure cache is populated
 */
export function getStorageProvider(type?: StorageType): StorageProvider {
  const config = getStorageConfig();
  const storageType = type || config.storageType || "local";

  switch (storageType) {
    case "s3":
    case "r2":
      return new S3Storage();
    case "local":
    default:
      return new LocalStorage();
  }
}

/**
 * Get storage provider (async version - reads from database)
 * Use this for routes/API handlers to ensure fresh config
 */
export async function getStorageProviderAsync(): Promise<StorageProvider> {
  const config = await getStorageConfigAsync();
  const storageType = config.storageType || "local";

  switch (storageType) {
    case "s3":
    case "r2":
      return new S3Storage(config);
    case "local":
    default:
      return new LocalStorage();
  }
}

export * from "./types";
export { getStorageConfig, getStorageConfigAsync } from "./config";

import { LocalStorage } from "./local-storage";
import { S3Storage } from "./s3-storage";
import type { StorageProvider, StorageType } from "./types";
import { getStorageConfig } from "./config";

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

export * from "./types";
export { getStorageConfig } from "./config";

import { LocalStorage } from "./local-storage";
import { S3Storage } from "./s3-storage";
import type { StorageProvider, StorageType } from "./types";

export function getStorageProvider(type?: StorageType): StorageProvider {
  const storageType = type || (process.env.STORAGE_TYPE as StorageType) || "local";

  switch (storageType) {
    case "s3":
      return new S3Storage();
    case "local":
    default:
      return new LocalStorage();
  }
}

export * from "./types";

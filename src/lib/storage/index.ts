import { LocalStorage } from "./local-storage";
import { S3Storage } from "./s3-storage";
import type { StorageProvider, StorageType } from "./types";

export function getStorageProvider(type?: StorageType): StorageProvider {
  const envType = (process.env.STORAGE_TYPE || process.env.STORAGE_DRIVER) as
    | StorageType
    | undefined;
  const storageType = type || envType || "local";

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

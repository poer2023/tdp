export interface StorageProvider {
  upload(file: Buffer, filename: string, mimeType: string): Promise<string>;
  delete(path: string): Promise<void>;
  getPublicUrl(path: string): string;
}

export type StorageType = "local" | "s3";

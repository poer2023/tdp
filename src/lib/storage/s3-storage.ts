import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import type { StorageProvider } from "./types";
import { getStorageConfig, getStorageConfigAsync, isS3ConfigComplete, type StorageConfigData } from "./config";

/**
 * S3Storage with lazy initialization
 * Creates S3 client on first use, allowing hot config changes
 */
export class S3Storage implements StorageProvider {
  private client: S3Client | null = null;
  private bucket: string = "";
  private cdnUrl: string | undefined;
  private lastConfigHash: string = "";
  private injectedConfig: StorageConfigData | null = null;

  /**
   * Create S3Storage, optionally with pre-loaded config
   */
  constructor(config?: StorageConfigData) {
    if (config) {
      this.injectedConfig = config;
    }
  }

  /**
   * Get or create S3 client, refreshing if config has changed
   */
  private getClient(): { client: S3Client; bucket: string; cdnUrl?: string } {
    // Use injected config or fall back to sync config (which uses cache)
    const config = this.injectedConfig || getStorageConfig();
    const configHash = JSON.stringify(config);

    // Check if we need to create/refresh the client
    if (!this.client || configHash !== this.lastConfigHash) {
      if (!isS3ConfigComplete(config)) {
        throw new Error("S3 configuration is incomplete. Please configure storage in Admin > Storage.");
      }

      const endpoint = config.endpoint!;
      const region = config.region || "auto";
      const accessKeyId = config.accessKeyId!;
      const secretAccessKey = config.secretAccessKey!;
      const bucket = config.bucket!;
      const forcePathStyle =
        process.env.S3_FORCE_PATH_STYLE === "1" || process.env.S3_FORCE_PATH_STYLE === "true";

      this.client = new S3Client({
        endpoint,
        region,
        forcePathStyle,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.bucket = bucket;
      this.cdnUrl = config.cdnUrl || undefined;
      this.lastConfigHash = configHash;

    }

    return { client: this.client, bucket: this.bucket, cdnUrl: this.cdnUrl };
  }

  /**
   * Async version that ensures fresh config from database
   */
  private async getClientAsync(): Promise<{ client: S3Client; bucket: string; cdnUrl?: string }> {
    if (!this.injectedConfig) {
      this.injectedConfig = await getStorageConfigAsync();
    }
    return this.getClient();
  }

  async upload(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
    const { client, bucket } = await this.getClientAsync();
    const key = `gallery/${filename}`;

    const upload = new Upload({
      client,
      params: {
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        ACL: "public-read",
      },
    });

    await upload.done();

    return key;
  }

  async uploadBatch(
    files: { buffer: Buffer; filename: string; mimeType: string }[]
  ): Promise<string[]> {
    const { client, bucket } = await this.getClientAsync();

    const uploads = files.map((file) => {
      const key = `gallery/${file.filename}`;
      return new Upload({
        client,
        params: {
          Bucket: bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimeType,
          ACL: "public-read",
        },
      })
        .done()
        .then(() => {

          return key;
        });
    });

    return Promise.all(uploads);
  }

  async delete(key: string): Promise<void> {
    try {
      const { client, bucket } = await this.getClientAsync();
      await client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      );

    } catch (error) {
      console.error("Failed to delete from S3:", error);
    }
  }

  getPublicUrl(key: string): string {
    // For sync URL generation, use cached config
    const config = this.injectedConfig || getStorageConfig();
    if (config.cdnUrl) {
      return `${config.cdnUrl}/${key}`;
    }
    return `${config.endpoint}/${config.bucket}/${key}`;
  }
}

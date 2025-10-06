import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import type { StorageProvider } from "./types";

export class S3Storage implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  private cdnUrl: string | undefined;

  constructor() {
    const endpoint = process.env.S3_ENDPOINT;
    const region = process.env.S3_REGION || "auto";
    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
    const bucket = process.env.S3_BUCKET;
    const forcePathStyle =
      process.env.S3_FORCE_PATH_STYLE === "1" || process.env.S3_FORCE_PATH_STYLE === "true";

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
      throw new Error("S3 configuration is incomplete. Please check environment variables.");
    }

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
    // Backward compatibility: support S3_PUBLIC_BASE_URL as alias
    this.cdnUrl = process.env.S3_CDN_URL || process.env.S3_PUBLIC_BASE_URL || undefined;
  }

  async upload(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
    const key = `gallery/${filename}`;
    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
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
    const uploads = files.map((file) => {
      const key = `gallery/${file.filename}`;
      return new Upload({
        client: this.client,
        params: {
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimeType,
          ACL: "public-read",
        },
      })
        .done()
        .then(() => key);
    });

    return Promise.all(uploads);
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );
    } catch (error) {
      console.error("Failed to delete from S3:", error);
    }
  }

  getPublicUrl(key: string): string {
    if (this.cdnUrl) {
      return `${this.cdnUrl}/${key}`;
    }
    return `${process.env.S3_ENDPOINT}/${this.bucket}/${key}`;
  }
}

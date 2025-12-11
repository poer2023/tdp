/**
 * Media Export Module
 * Lists and downloads media files from storage
 */

import { getStorageConfig } from '@/lib/storage/config';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { createHash } from 'crypto';
import { Readable } from 'stream';

export interface MediaFile {
    key: string;
    size: number;
    lastModified?: Date;
    checksum?: string;
}

export interface MediaExportResult {
    files: MediaFile[];
    totalFiles: number;
    totalSize: number;
    storageType: string;
}

/**
 * List all media files in storage
 */
export async function listMediaFiles(): Promise<MediaExportResult> {
    const config = getStorageConfig();
    const files: MediaFile[] = [];

    if (config.storageType === 'local') {
        // For local storage, we'd scan the uploads directory
        // This is simplified - in production, scan /uploads folder
        return {
            files: [],
            totalFiles: 0,
            totalSize: 0,
            storageType: 'local',
        };
    }

    // S3/R2 storage
    if (!config.endpoint || !config.accessKeyId || !config.secretAccessKey || !config.bucket) {
        return {
            files: [],
            totalFiles: 0,
            totalSize: 0,
            storageType: config.storageType || 'unknown',
        };
    }

    const client = new S3Client({
        endpoint: config.endpoint,
        region: config.region || 'auto',
        credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
        },
    });

    let continuationToken: string | undefined;
    let totalSize = 0;

    do {
        const command = new ListObjectsV2Command({
            Bucket: config.bucket,
            ContinuationToken: continuationToken,
        });

        const response = await client.send(command);

        if (response.Contents) {
            for (const obj of response.Contents) {
                if (obj.Key && obj.Size !== undefined) {
                    files.push({
                        key: obj.Key,
                        size: obj.Size,
                        lastModified: obj.LastModified,
                    });
                    totalSize += obj.Size;
                }
            }
        }

        continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return {
        files,
        totalFiles: files.length,
        totalSize,
        storageType: config.storageType || 'r2',
    };
}

/**
 * Download a single file from storage
 */
export async function downloadMediaFile(key: string): Promise<{ data: Buffer; checksum: string } | null> {
    const config = getStorageConfig();

    if (config.storageType === 'local') {
        // For local storage, read from filesystem
        return null;
    }

    if (!config.endpoint || !config.accessKeyId || !config.secretAccessKey || !config.bucket) {
        return null;
    }

    const client = new S3Client({
        endpoint: config.endpoint,
        region: config.region || 'auto',
        credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
        },
    });

    try {
        const command = new GetObjectCommand({
            Bucket: config.bucket,
            Key: key,
        });

        const response = await client.send(command);

        if (!response.Body) {
            return null;
        }

        // Convert stream to buffer
        const chunks: Buffer[] = [];
        const stream = response.Body as Readable;

        for await (const chunk of stream) {
            chunks.push(Buffer.from(chunk));
        }

        const data = Buffer.concat(chunks);
        const checksum = createHash('md5').update(data).digest('hex');

        return { data, checksum };
    } catch (error) {
        console.error(`[Backup] Failed to download file ${key}:`, error);
        return null;
    }
}

/**
 * Get total media size (for estimation)
 */
export async function getMediaStats(): Promise<{ totalFiles: number; totalSize: number }> {
    const result = await listMediaFiles();
    return {
        totalFiles: result.totalFiles,
        totalSize: result.totalSize,
    };
}

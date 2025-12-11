/**
 * Backup Service
 * Main orchestration for creating, listing, and managing backups
 */

import { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getStorageConfig } from '@/lib/storage/config';
import { exportDatabase } from './database-export';
import { listMediaFiles, downloadMediaFile } from './media-export';
import { createHash } from 'crypto';
import type { BackupManifest, BackupInfo } from './types';
import { BACKUP_TABLES } from './types';
import JSZip from 'jszip';
import { Readable } from 'stream';

const BACKUP_PREFIX = 'backups/';
const BACKUP_VERSION = '1.0';

/**
 * Create a full site backup
 */
export async function createBackup(options?: {
    includeMedia?: boolean;
    onProgress?: (phase: string, progress: number, message: string) => void;
}): Promise<BackupInfo> {
    const { includeMedia = true, onProgress } = options || {};
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = `backup_${timestamp}`;
    const filename = `${backupId}.zip`;

    onProgress?.('database', 0, 'Starting database export...');

    // 1. Export database
    const dbExport = await exportDatabase();
    onProgress?.('database', 50, `Exported ${dbExport.totalRecords} records from ${BACKUP_TABLES.length} tables`);

    // 2. List media files
    let mediaExport = { files: [] as { key: string; size: number }[], totalFiles: 0, totalSize: 0, storageType: 'none' };
    if (includeMedia) {
        onProgress?.('media', 0, 'Listing media files...');
        mediaExport = await listMediaFiles();
        onProgress?.('media', 50, `Found ${mediaExport.totalFiles} media files`);
    }

    // 3. Create manifest
    const manifest: BackupManifest = {
        version: BACKUP_VERSION,
        createdAt: new Date().toISOString(),
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
        database: {
            tables: [...BACKUP_TABLES],
            totalRecords: dbExport.totalRecords,
            recordCounts: dbExport.recordCounts,
        },
        media: {
            totalFiles: mediaExport.totalFiles,
            totalSize: mediaExport.totalSize,
            storageType: mediaExport.storageType,
        },
        checksum: '', // Will be calculated after archive creation
    };

    onProgress?.('archive', 0, 'Creating archive...');

    // 4. Create zip archive
    const archiveBuffer = await createArchive(dbExport.tables, mediaExport.files, manifest, includeMedia, (progress) => {
        onProgress?.('archive', progress, `Archiving... ${progress}%`);
    });

    // Calculate checksum
    manifest.checksum = createHash('sha256').update(archiveBuffer).digest('hex');

    onProgress?.('upload', 0, 'Uploading backup...');

    // 5. Upload to storage
    await uploadBackup(filename, archiveBuffer);

    onProgress?.('complete', 100, 'Backup complete!');

    return {
        id: backupId,
        filename,
        size: archiveBuffer.length,
        createdAt: new Date(),
        manifest,
    };
}

/**
 * Create zip archive with database and media files
 */
async function createArchive(
    tables: Record<string, unknown[]>,
    mediaFiles: { key: string; size: number }[],
    manifest: BackupManifest,
    includeMedia: boolean,
    onProgress?: (progress: number) => void
): Promise<Buffer> {
    const zip = new JSZip();

    // Add manifest
    zip.file('manifest.json', JSON.stringify(manifest, null, 2));

    // Add database tables
    let progress = 0;
    const totalItems = Object.keys(tables).length + (includeMedia ? mediaFiles.length : 0);

    for (const [tableName, records] of Object.entries(tables)) {
        const tableJson = JSON.stringify(records, null, 2);
        zip.file(`database/${tableName}.json`, tableJson);
        progress++;
        onProgress?.(Math.round((progress / Math.max(totalItems, 1)) * 50));
    }

    // Add media files (if enabled)
    if (includeMedia && mediaFiles.length > 0) {
        for (const file of mediaFiles) {
            try {
                const result = await downloadMediaFile(file.key);
                if (result) {
                    zip.file(`media/${file.key}`, result.data);
                }
            } catch (error) {
                console.warn(`[Backup] Failed to include media file ${file.key}:`, error);
            }
            progress++;
            onProgress?.(Math.round(50 + (progress / Math.max(totalItems, 1)) * 50));
        }
    }

    // Generate zip buffer
    return await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

/**
 * Upload backup to storage
 */
async function uploadBackup(filename: string, data: Buffer): Promise<void> {
    const config = getStorageConfig();

    if (config.storageType === 'local') {
        // For local storage, save to filesystem
        const fs = await import('fs/promises');
        const path = await import('path');
        const backupDir = path.join(process.cwd(), 'data', 'backups');
        await fs.mkdir(backupDir, { recursive: true });
        await fs.writeFile(path.join(backupDir, filename), data);
        return;
    }

    // S3/R2 storage
    if (!config.endpoint || !config.accessKeyId || !config.secretAccessKey || !config.bucket) {
        throw new Error('Storage not configured');
    }

    const client = new S3Client({
        endpoint: config.endpoint,
        region: config.region || 'auto',
        credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
        },
    });

    await client.send(new PutObjectCommand({
        Bucket: config.bucket,
        Key: `${BACKUP_PREFIX}${filename}`,
        Body: data,
        ContentType: 'application/gzip',
    }));
}

/**
 * List all available backups
 */
export async function listBackups(): Promise<BackupInfo[]> {
    const config = getStorageConfig();
    const backups: BackupInfo[] = [];

    if (config.storageType === 'local') {
        // List from local filesystem
        const fs = await import('fs/promises');
        const path = await import('path');
        const backupDir = path.join(process.cwd(), 'data', 'backups');

        try {
            const files = await fs.readdir(backupDir);
            for (const file of files) {
                if (file.endsWith('.tar.gz')) {
                    const stats = await fs.stat(path.join(backupDir, file));
                    backups.push({
                        id: file.replace('.tar.gz', ''),
                        filename: file,
                        size: stats.size,
                        createdAt: stats.mtime,
                    });
                }
            }
        } catch {
            // Directory doesn't exist yet
        }

        return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    // S3/R2 storage
    if (!config.endpoint || !config.accessKeyId || !config.secretAccessKey || !config.bucket) {
        return [];
    }

    const client = new S3Client({
        endpoint: config.endpoint,
        region: config.region || 'auto',
        credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
        },
    });

    const response = await client.send(new ListObjectsV2Command({
        Bucket: config.bucket,
        Prefix: BACKUP_PREFIX,
    }));

    if (response.Contents) {
        for (const obj of response.Contents) {
            if (obj.Key && obj.Key.endsWith('.tar.gz')) {
                const filename = obj.Key.replace(BACKUP_PREFIX, '');
                backups.push({
                    id: filename.replace('.tar.gz', ''),
                    filename,
                    size: obj.Size || 0,
                    createdAt: obj.LastModified || new Date(),
                });
            }
        }
    }

    return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Download a backup
 */
export async function downloadBackup(id: string): Promise<Buffer | null> {
    const filename = `${id}.tar.gz`;
    const config = getStorageConfig();

    if (config.storageType === 'local') {
        const fs = await import('fs/promises');
        const path = await import('path');
        const backupPath = path.join(process.cwd(), 'data', 'backups', filename);

        try {
            return await fs.readFile(backupPath);
        } catch {
            return null;
        }
    }

    // S3/R2 storage
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
        const response = await client.send(new GetObjectCommand({
            Bucket: config.bucket,
            Key: `${BACKUP_PREFIX}${filename}`,
        }));

        if (!response.Body) {
            return null;
        }

        const chunks: Buffer[] = [];
        const stream = response.Body as Readable;

        for await (const chunk of stream) {
            chunks.push(Buffer.from(chunk));
        }

        return Buffer.concat(chunks);
    } catch {
        return null;
    }
}

/**
 * Delete a backup
 */
export async function deleteBackup(id: string): Promise<boolean> {
    const filename = `${id}.tar.gz`;
    const config = getStorageConfig();

    if (config.storageType === 'local') {
        const fs = await import('fs/promises');
        const path = await import('path');
        const backupPath = path.join(process.cwd(), 'data', 'backups', filename);

        try {
            await fs.unlink(backupPath);
            return true;
        } catch {
            return false;
        }
    }

    // S3/R2 storage
    if (!config.endpoint || !config.accessKeyId || !config.secretAccessKey || !config.bucket) {
        return false;
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
        await client.send(new DeleteObjectCommand({
            Bucket: config.bucket,
            Key: `${BACKUP_PREFIX}${filename}`,
        }));
        return true;
    } catch {
        return false;
    }
}

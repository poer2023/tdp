/**
 * Restore Service
 * Handles backup restoration - database and media files
 */

import prisma from '@/lib/prisma';
import { getStorageConfig } from '@/lib/storage/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import JSZip from 'jszip';
import type { BackupManifest } from './types';
import { BACKUP_TABLES, type BackupTableName } from './types';

export interface RestoreOptions {
    restoreDatabase: boolean;
    restoreMedia: boolean;
}

export interface RestorePreview {
    manifest: BackupManifest;
    database: {
        tables: string[];
        totalRecords: number;
    };
    media: {
        totalFiles: number;
        totalSize: number;
    };
}

export interface RestoreResult {
    success: boolean;
    database: {
        tablesRestored: number;
        recordsRestored: number;
        errors: string[];
    };
    media: {
        filesRestored: number;
        errors: string[];
    };
}

/**
 * Parse and preview backup contents without restoring
 */
export async function previewBackup(zipBuffer: Buffer): Promise<RestorePreview> {
    const zip = await JSZip.loadAsync(zipBuffer);

    // Read manifest
    const manifestFile = zip.file('manifest.json');
    if (!manifestFile) {
        throw new Error('Invalid backup: missing manifest.json');
    }

    const manifestJson = await manifestFile.async('string');
    const manifest: BackupManifest = JSON.parse(manifestJson);

    // Count database records
    let totalRecords = 0;
    const tables: string[] = [];

    for (const tableName of BACKUP_TABLES) {
        const tableFile = zip.file(`database/${tableName}.json`);
        if (tableFile) {
            tables.push(tableName);
            const tableJson = await tableFile.async('string');
            const records = JSON.parse(tableJson);
            totalRecords += Array.isArray(records) ? records.length : 0;
        }
    }

    // Count media files
    const mediaFiles = Object.keys(zip.files).filter(name => name.startsWith('media/') && !name.endsWith('/'));
    let totalSize = 0;
    for (const fileName of mediaFiles) {
        const file = zip.file(fileName);
        if (file) {
            const data = await file.async('nodebuffer');
            totalSize += data.length;
        }
    }

    return {
        manifest,
        database: {
            tables,
            totalRecords,
        },
        media: {
            totalFiles: mediaFiles.length,
            totalSize,
        },
    };
}

/**
 * Restore from backup
 */
export async function restoreFromBackup(
    zipBuffer: Buffer,
    options: RestoreOptions,
    onProgress?: (phase: string, progress: number, message: string) => void
): Promise<RestoreResult> {
    const zip = await JSZip.loadAsync(zipBuffer);

    const result: RestoreResult = {
        success: true,
        database: {
            tablesRestored: 0,
            recordsRestored: 0,
            errors: [],
        },
        media: {
            filesRestored: 0,
            errors: [],
        },
    };

    // Restore database
    if (options.restoreDatabase) {
        onProgress?.('database', 0, 'Restoring database...');

        let tableProgress = 0;
        const totalTables = BACKUP_TABLES.length;

        for (const tableName of BACKUP_TABLES) {
            try {
                const tableFile = zip.file(`database/${tableName}.json`);
                if (tableFile) {
                    const tableJson = await tableFile.async('string');
                    const records = JSON.parse(tableJson);

                    if (Array.isArray(records) && records.length > 0) {
                        const restored = await restoreTable(tableName, records);
                        result.database.recordsRestored += restored;
                        result.database.tablesRestored++;
                    }
                }
            } catch (error) {
                const message = `Failed to restore ${tableName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                result.database.errors.push(message);
                console.error(`[Restore] ${message}`);
            }

            tableProgress++;
            onProgress?.('database', Math.round((tableProgress / totalTables) * 100), `Restored ${tableName}`);
        }
    }

    // Restore media files
    if (options.restoreMedia) {
        onProgress?.('media', 0, 'Restoring media files...');

        const mediaFiles = Object.keys(zip.files).filter(name => name.startsWith('media/') && !name.endsWith('/'));
        let fileProgress = 0;

        for (const fileName of mediaFiles) {
            try {
                const file = zip.file(fileName);
                if (file) {
                    const data = await file.async('nodebuffer');
                    const key = fileName.replace('media/', '');

                    await uploadMediaFile(key, data);
                    result.media.filesRestored++;
                }
            } catch (error) {
                const message = `Failed to restore ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                result.media.errors.push(message);
                console.error(`[Restore] ${message}`);
            }

            fileProgress++;
            onProgress?.('media', Math.round((fileProgress / mediaFiles.length) * 100), `Restored ${fileProgress}/${mediaFiles.length} files`);
        }
    }

    result.success = result.database.errors.length === 0 && result.media.errors.length === 0;

    onProgress?.('complete', 100, 'Restore complete!');

    return result;
}

/**
 * Restore a single table using upsert
 */
async function restoreTable(tableName: BackupTableName, records: unknown[]): Promise<number> {
     
    const model = (prisma as any)[tableName.charAt(0).toLowerCase() + tableName.slice(1)];

    if (!model || typeof model.upsert !== 'function') {
        console.warn(`[Restore] Model ${tableName} does not support upsert`);
        return 0;
    }

    let restored = 0;

    for (const record of records) {
        if (!record || typeof record !== 'object') continue;

        const rec = record as Record<string, unknown>;
        const id = rec.id;

        if (!id) continue;

        try {
            // Convert date strings back to Date objects
            const processedRecord = processDateFields(rec);

            await model.upsert({
                where: { id },
                update: processedRecord,
                create: processedRecord,
            });
            restored++;
        } catch (error) {
            // Skip individual record errors but log them
            console.warn(`[Restore] Failed to upsert record ${id} in ${tableName}:`, error);
        }
    }

    return restored;
}

/**
 * Convert ISO date strings to Date objects
 */
function processDateFields(record: Record<string, unknown>): Record<string, unknown> {
    const dateFields = ['createdAt', 'updatedAt', 'publishedAt', 'expiresAt', 'lastVisit', 'firstVisit', 'watchedAt', 'startTime', 'endTime', 'date', 'happenedAt', 'capturedAt'];
    const processed = { ...record };

    for (const field of dateFields) {
        if (processed[field] && typeof processed[field] === 'string') {
            processed[field] = new Date(processed[field] as string);
        }
    }

    return processed;
}

/**
 * Upload media file to storage
 */
async function uploadMediaFile(key: string, data: Buffer): Promise<void> {
    const config = getStorageConfig();

    if (config.storageType === 'local') {
        const fs = await import('fs/promises');
        const path = await import('path');
        const filePath = path.join(process.cwd(), 'public', 'uploads', key);
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(filePath, data);
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

    // Determine content type from extension
    const ext = key.split('.').pop()?.toLowerCase() || '';
    const contentTypes: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
        'mp4': 'video/mp4',
        'mov': 'video/quicktime',
    };

    await client.send(new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: data,
        ContentType: contentTypes[ext] || 'application/octet-stream',
    }));
}

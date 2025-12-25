/**
 * Database Export Module
 * Exports all Prisma tables to JSON format
 */

import prisma from '@/lib/prisma';
import { BACKUP_TABLES, type BackupTableName } from './types';

export interface DatabaseExportResult {
    tables: Record<string, unknown[]>;
    recordCounts: Record<string, number>;
    totalRecords: number;
    exportedAt: string;
}

/**
 * Export all database tables to JSON
 */
export async function exportDatabase(): Promise<DatabaseExportResult> {
    const tables: Record<string, unknown[]> = {};
    const recordCounts: Record<string, number> = {};
    let totalRecords = 0;

    for (const tableName of BACKUP_TABLES) {
        try {
            const data = await exportTable(tableName);
            tables[tableName] = data;
            recordCounts[tableName] = data.length;
            totalRecords += data.length;
        } catch (error) {
            console.warn(`[Backup] Failed to export table ${tableName}:`, error);
            tables[tableName] = [];
            recordCounts[tableName] = 0;
        }
    }

    return {
        tables,
        recordCounts,
        totalRecords,
        exportedAt: new Date().toISOString(),
    };
}

/**
 * Export a single table
 */
async function exportTable(tableName: BackupTableName): Promise<unknown[]> {
    // Use dynamic access to Prisma client
     
    const model = (prisma as any)[tableName.charAt(0).toLowerCase() + tableName.slice(1)];

    if (!model || typeof (model as { findMany?: unknown }).findMany !== 'function') {
        console.warn(`[Backup] Model ${tableName} not found in Prisma client`);
        return [];
    }

    // For tables with sensitive data, exclude certain fields
    const sensitiveExclusions: Record<string, Record<string, boolean>> = {
        User: { password: true },
        Account: { access_token: true, refresh_token: true, id_token: true },
        Credential: { encryptedValue: true }, // Don't backup encrypted credentials
    };

    const select = sensitiveExclusions[tableName];

    if (select) {
        // Get all records but with fields excluded by not selecting them
        // Prisma doesn't support exclude, so we'll filter after fetch
        const records = await (model as { findMany: () => Promise<unknown[]> }).findMany();
        return records.map((record) => {
            if (!record || typeof record !== 'object') return record;
            const filtered = { ...record } as Record<string, unknown>;
            for (const field of Object.keys(select)) {
                delete filtered[field];
            }
            return filtered;
        });
    }

    return await (model as { findMany: () => Promise<unknown[]> }).findMany();
}

/**
 * Get count of records in each table (for preview)
 */
export async function getDatabaseStats(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};

    for (const tableName of BACKUP_TABLES) {
        try {
             
            const model = (prisma as any)[tableName.charAt(0).toLowerCase() + tableName.slice(1)];
            if (model && typeof (model as { count?: unknown }).count === 'function') {
                counts[tableName] = await (model as { count: () => Promise<number> }).count();
            } else {
                counts[tableName] = 0;
            }
        } catch {
            counts[tableName] = 0;
        }
    }

    return counts;
}

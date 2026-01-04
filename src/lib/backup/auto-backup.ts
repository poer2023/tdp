/**
 * Auto Backup Scheduler
 * Handles automatic backup creation with retention policy
 */

import { createBackup, listBackups, deleteBackup } from './backup-service';
import type { BackupInfo } from './types';

export interface AutoBackupConfig {
    enabled: boolean;
    schedule: 'daily' | 'weekly' | 'monthly';
    retention: number; // Number of backups to keep
    includeMedia: boolean;
    notifyOnFailure: boolean;
}

const DEFAULT_CONFIG: AutoBackupConfig = {
    enabled: false,
    schedule: 'daily',
    retention: 7,
    includeMedia: true,
    notifyOnFailure: true,
};

/**
 * Run automatic backup with retention cleanup
 */
export async function runAutoBackup(config: Partial<AutoBackupConfig> = {}): Promise<{
    success: boolean;
    backup?: BackupInfo;
    deletedBackups?: string[];
    error?: string;
}> {
    const cfg = { ...DEFAULT_CONFIG, ...config };

    try {

        // Create new backup
        const backup = await createBackup({
            includeMedia: cfg.includeMedia,
            onProgress: (phase, progress, message) => {

            },
        });

        // Apply retention policy
        const deletedBackups = await applyRetentionPolicy(cfg.retention);

        return {
            success: true,
            backup,
            deletedBackups,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[AutoBackup] Error:', message);

        return {
            success: false,
            error: message,
        };
    }
}

/**
 * Apply retention policy - keep only the N most recent backups
 */
async function applyRetentionPolicy(retention: number): Promise<string[]> {
    const backups = await listBackups();
    const deletedBackups: string[] = [];

    // Backups are already sorted by createdAt desc
    if (backups.length > retention) {
        const toDelete = backups.slice(retention);

        for (const backup of toDelete) {
            try {
                await deleteBackup(backup.id);
                deletedBackups.push(backup.id);

            } catch (error) {
                console.error(`[AutoBackup] Failed to delete ${backup.filename}:`, error);
            }
        }
    }

    return deletedBackups;
}

/**
 * Get next scheduled backup time
 */
export function getNextBackupTime(schedule: 'daily' | 'weekly' | 'monthly'): Date {
    const now = new Date();
    const next = new Date(now);

    // Set to 3:00 AM
    next.setHours(3, 0, 0, 0);

    // If already past 3 AM today, move to next period
    if (now.getHours() >= 3) {
        switch (schedule) {
            case 'daily':
                next.setDate(next.getDate() + 1);
                break;
            case 'weekly':
                // Next Sunday
                const daysUntilSunday = (7 - next.getDay()) % 7 || 7;
                next.setDate(next.getDate() + daysUntilSunday);
                break;
            case 'monthly':
                // First of next month
                next.setMonth(next.getMonth() + 1, 1);
                break;
        }
    }

    return next;
}

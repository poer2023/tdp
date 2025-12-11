/**
 * Backup System Types
 */

export interface BackupManifest {
    version: string;
    createdAt: string;
    siteUrl?: string;
    database: {
        tables: string[];
        totalRecords: number;
        recordCounts: Record<string, number>;
    };
    media: {
        totalFiles: number;
        totalSize: number;
        storageType: string;
    };
    checksum: string;
}

export interface BackupInfo {
    id: string;
    filename: string;
    size: number;
    createdAt: Date;
    manifest?: BackupManifest;
}

export interface BackupProgress {
    phase: 'database' | 'media' | 'archive' | 'upload' | 'complete';
    progress: number; // 0-100
    message: string;
    error?: string;
}

export interface RestoreOptions {
    restoreDatabase: boolean;
    restoreMedia: boolean;
    overwrite: boolean;
}

export interface RestorePreview {
    database: {
        tables: string[];
        totalRecords: number;
        conflicts: number;
    };
    media: {
        totalFiles: number;
        newFiles: number;
        existingFiles: number;
    };
}

// Tables to backup (excludes sensitive session/token data)
export const BACKUP_TABLES = [
    'User',
    'Account',
    'Post',
    'PostAlias',
    'GalleryImage',
    'Moment',
    'MomentComment',
    'MomentReaction',
    'Project',
    'HeroImage',
    'Friend',
    'Subscription',
    'SubscriptionHistory',
    'DailyStats',
    'PageStats',
    'Visitor',
    'SleepData',
    'DeviceData',
    'SourceData',
    'StepsData',
    'PhotoStats',
    'Game',
    'GameSession',
    'GamePlaytimeSnapshot',
    'MediaWatch',
    'Credential',
    'Monitor',
] as const;

export type BackupTableName = (typeof BACKUP_TABLES)[number];

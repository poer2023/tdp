/**
 * Backup API Routes
 * POST - Create new backup
 * GET - List all backups
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createBackup, listBackups, getDatabaseStats, getMediaStats } from '@/lib/backup';

/**
 * GET /api/admin/backup
 * List all available backups
 */
export async function GET() {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const backups = await listBackups();

        // Also get current stats for display
        const dbStats = await getDatabaseStats();
        const mediaStats = await getMediaStats();

        const totalDbRecords = Object.values(dbStats).reduce((sum, count) => sum + count, 0);

        return NextResponse.json({
            backups,
            stats: {
                database: {
                    tables: Object.keys(dbStats).length,
                    totalRecords: totalDbRecords,
                },
                media: mediaStats,
            },
        });
    } catch (error) {
        console.error('[Backup API] Error listing backups:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to list backups' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/backup
 * Create a new backup
 */
export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json().catch(() => ({}));
        const includeMedia = body.includeMedia !== false; // Default to true

        const backup = await createBackup({ includeMedia });

        return NextResponse.json({
            success: true,
            backup: {
                id: backup.id,
                filename: backup.filename,
                size: backup.size,
                createdAt: backup.createdAt,
                manifest: backup.manifest,
            },
        });
    } catch (error) {
        console.error('[Backup API] Error creating backup:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to create backup' },
            { status: 500 }
        );
    }
}

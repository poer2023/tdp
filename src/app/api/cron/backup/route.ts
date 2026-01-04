/**
 * Cron Backup API Route
 * Called by external cron service (e.g., Vercel Cron, GitHub Actions)
 * 
 * Secure with CRON_SECRET environment variable
 */

import { NextResponse } from 'next/server';
import { runAutoBackup } from '@/lib/backup/auto-backup';

/**
 * GET /api/cron/backup
 * Trigger automatic backup
 * 
 * Headers:
 * - Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: Request) {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
        console.warn('[Cron Backup] CRON_SECRET not configured');
        return NextResponse.json({ error: 'Cron not configured' }, { status: 500 });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {

        const result = await runAutoBackup({
            enabled: true,
            includeMedia: true,
            retention: 7, // Keep last 7 backups
        });

        if (result.success) {
            return NextResponse.json({
                success: true,
                backup: {
                    id: result.backup?.id,
                    filename: result.backup?.filename,
                    size: result.backup?.size,
                },
                deletedBackups: result.deletedBackups,
            });
        } else {
            return NextResponse.json({
                success: false,
                error: result.error,
            }, { status: 500 });
        }
    } catch (error) {
        console.error('[Cron Backup] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Backup failed' },
            { status: 500 }
        );
    }
}

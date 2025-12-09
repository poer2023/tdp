/**
 * Sync Logs API
 * GET /api/admin/sync-logs
 */

import { NextRequest, NextResponse } from "next/server";
import {
    getRecentSyncLogs,
    getSyncLogsByCredential,
    getSyncLogsByPlatform,
    getSyncStats,
} from "@/lib/sync-logger";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const credentialId = searchParams.get('credentialId');
        const platform = searchParams.get('platform');
        const limit = parseInt(searchParams.get('limit') || '50');
        const statsOnly = searchParams.get('stats') === 'true';

        if (statsOnly) {
            const stats = await getSyncStats();
            return NextResponse.json({ success: true, stats });
        }

        let logs;
        if (credentialId) {
            logs = await getSyncLogsByCredential(credentialId, limit);
        } else if (platform) {
            logs = await getSyncLogsByPlatform(platform, limit);
        } else {
            logs = await getRecentSyncLogs(limit);
        }

        return NextResponse.json({
            success: true,
            logs,
            count: logs.length,
        });
    } catch (error) {
        console.error('Sync logs fetch error:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch sync logs',
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}

/**
 * AI Diagnosis Logs API
 * GET /api/admin/ai-logs
 */

import { NextRequest, NextResponse } from "next/server";
import { getRecentDiagnosisLogs, getDiagnosisLogsByPlatform, getAIDiagnosisStats } from "@/lib/ai/diagnosis-logger";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const platform = searchParams.get('platform');
        const limit = parseInt(searchParams.get('limit') || '50');
        const statsOnly = searchParams.get('stats') === 'true';

        if (statsOnly) {
            const stats = await getAIDiagnosisStats();
            return NextResponse.json({ success: true, stats });
        }

        const logs = platform
            ? await getDiagnosisLogsByPlatform(platform, limit)
            : await getRecentDiagnosisLogs(limit);

        return NextResponse.json({
            success: true,
            logs,
            count: logs.length,
        });
    } catch (error) {
        console.error('AI logs fetch error:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch AI diagnosis logs',
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}

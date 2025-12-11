/**
 * Restore API Route
 * POST - Preview or restore from backup file
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { previewBackup, restoreFromBackup } from '@/lib/backup/restore-service';

/**
 * POST /api/admin/backup/restore
 * Preview or restore from uploaded backup
 * 
 * Query params:
 * - preview=true: Only preview, don't restore
 * 
 * Body (multipart/form-data):
 * - file: The backup zip file
 * - restoreDatabase: boolean (default true)
 * - restoreMedia: boolean (default true)
 */
export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const url = new URL(request.url);
        const isPreview = url.searchParams.get('preview') === 'true';

        // Parse multipart form data
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Read file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (isPreview) {
            // Preview mode - just parse and return info
            const preview = await previewBackup(buffer);
            return NextResponse.json({
                success: true,
                preview,
            });
        }

        // Restore mode
        const restoreDatabase = formData.get('restoreDatabase') !== 'false';
        const restoreMedia = formData.get('restoreMedia') !== 'false';

        const result = await restoreFromBackup(buffer, {
            restoreDatabase,
            restoreMedia,
        }, (phase, progress, message) => {
            console.log(`[Restore] ${phase}: ${progress}% - ${message}`);
        });

        return NextResponse.json({
            success: result.success,
            result,
        });
    } catch (error) {
        console.error('[Restore API] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to restore' },
            { status: 500 }
        );
    }
}

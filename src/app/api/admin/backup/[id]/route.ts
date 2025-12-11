/**
 * Backup Download/Delete API Routes
 * GET - Download backup file
 * DELETE - Delete backup
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { downloadBackup, deleteBackup } from '@/lib/backup';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/backup/[id]
 * Download a specific backup
 */
export async function GET(request: Request, { params }: RouteParams) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const data = await downloadBackup(id);

        if (!data) {
            return NextResponse.json({ error: 'Backup not found' }, { status: 404 });
        }

        return new NextResponse(new Uint8Array(data), {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${id}.zip"`,
                'Content-Length': data.length.toString(),
            },
        });
    } catch (error) {
        console.error('[Backup API] Error downloading backup:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to download backup' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/backup/[id]
 * Delete a specific backup
 */
export async function DELETE(request: Request, { params }: RouteParams) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const success = await deleteBackup(id);

        if (!success) {
            return NextResponse.json({ error: 'Failed to delete backup' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[Backup API] Error deleting backup:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to delete backup' },
            { status: 500 }
        );
    }
}

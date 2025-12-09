/**
 * Media Storage API
 * GET /api/admin/media
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const platform = searchParams.get('platform');
        const limit = parseInt(searchParams.get('limit') || '5000'); // Increased default to get all data

        const where: any = {};
        if (platform) {
            where.platform = platform;
        }

        const items = await prisma.mediaWatch.findMany({
            where,
            orderBy: { watchedAt: 'desc' }, // Sort by actual watch time, not sync time
            take: limit,
            select: {
                id: true,
                title: true,
                platform: true,
                type: true,         // Changed from category
                externalId: true,
                cover: true,
                url: true,
                rating: true,
                progress: true,
                season: true,
                episode: true,
                duration: true,
                watchedAt: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return NextResponse.json({
            success: true,
            items,
            count: items.length,
        });
    } catch (error) {
        console.error('Media fetch error:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch media data',
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}

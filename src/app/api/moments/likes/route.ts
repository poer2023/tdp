import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/moments/likes?ids=id1,id2,id3
 * Returns the current user's like status for the given moment IDs.
 * Used for hydrating like states on statically rendered pages.
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const idsParam = searchParams.get("ids");

        if (!idsParam) {
            return NextResponse.json(
                { error: "Missing 'ids' query parameter" },
                { status: 400 }
            );
        }

        const ids = idsParam.split(",").filter(Boolean).slice(0, 100); // Limit to 100 IDs

        if (ids.length === 0) {
            return NextResponse.json({ likedIds: [] });
        }

        // Get the current user session
        const session = await auth();
        const userId = session?.user?.id;

        if (!userId) {
            // Not logged in - no likes
            return NextResponse.json({ likedIds: [] });
        }

        // Query user's likes for these moment IDs
        const likes = await prisma.momentLike.findMany({
            where: {
                userId,
                momentId: { in: ids },
            },
            select: { momentId: true },
        });

        const likedIds = likes.map((like) => like.momentId);

        return NextResponse.json({ likedIds });
    } catch (error) {
        console.error("[GET /api/moments/likes] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

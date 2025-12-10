import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { persistUploadedFile } from "@/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/profile/avatar
 * Upload a new avatar or set avatar URL for the current user
 * 
 * Supports two modes:
 * 1. File upload: FormData with "avatar" file
 * 2. URL update: FormData with "avatarUrl" string (for restoring Google avatar)
 */
export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("avatar") as File | null;
        const avatarUrlParam = formData.get("avatarUrl") as string | null;

        let avatarUrl: string;

        if (file && file.size > 0) {
            // Mode 1: Upload new avatar file
            avatarUrl = await persistUploadedFile(file, "avatars");
        } else if (avatarUrlParam) {
            // Mode 2: Set avatar by URL (e.g., restore Google avatar)
            avatarUrl = avatarUrlParam;
        } else {
            return NextResponse.json({ error: "Missing avatar file or URL" }, { status: 400 });
        }

        // Update user's image in database
        await prisma.user.update({
            where: { id: session.user.id },
            data: { image: avatarUrl },
        });

        return NextResponse.json({ ok: true, avatarUrl }, { status: 200 });
    } catch (err) {
        console.error("Avatar upload error:", err);
        const message = err instanceof Error ? err.message : "Upload failed";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

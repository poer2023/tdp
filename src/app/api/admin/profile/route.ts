import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { persistUploadedFile } from "@/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/profile
 * Update user profile (name, avatar, etc.)
 * 
 * FormData fields:
 * - name: Optional string to update display name
 * - avatar: Optional file to upload new avatar
 * - avatarUrl: Optional string to set avatar URL (e.g., restore Google avatar)
 */
export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const name = formData.get("name") as string | null;
        const file = formData.get("avatar") as File | null;
        const avatarUrlParam = formData.get("avatarUrl") as string | null;

        // Build update data
        const updateData: { name?: string; image?: string } = {};

        // Handle name update
        if (name !== null && name.trim() !== "") {
            updateData.name = name.trim();
        }

        // Handle avatar update
        if (file && file.size > 0) {
            // Upload new avatar file
            updateData.image = await persistUploadedFile(file, "avatars");
        } else if (avatarUrlParam) {
            // Set avatar by URL (e.g., restore Google avatar)
            updateData.image = avatarUrlParam;
        }

        // Check if there's anything to update
        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: "No changes to save" }, { status: 400 });
        }

        // Update user in database
        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: updateData,
            select: {
                name: true,
                image: true,
            },
        });

        return NextResponse.json({
            ok: true,
            name: updatedUser.name,
            avatarUrl: updatedUser.image,
        }, { status: 200 });
    } catch (err) {
        console.error("Profile update error:", err);
        const message = err instanceof Error ? err.message : "Update failed";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

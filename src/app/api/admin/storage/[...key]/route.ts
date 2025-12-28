import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import { getStorageProviderAsync } from "@/lib/storage";

/**
 * DELETE /api/admin/storage/[...key]
 * Delete a file from storage
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ key: string[] }> }
) {
    const session = await auth();
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { key } = await params;
        const fileKey = key.join("/");

        // Security: reject dangerous paths
        if (!fileKey || fileKey.includes("..") || fileKey.startsWith("/")) {
            return NextResponse.json({ error: "Invalid file key" }, { status: 400 });
        }

        const storage = await getStorageProviderAsync();
        await storage.delete(fileKey);

        return NextResponse.json({ success: true, deleted: fileKey });
    } catch (error) {
        console.error("[Storage API] Delete error:", error);
        return NextResponse.json(
            { error: "Failed to delete file" },
            { status: 500 }
        );
    }
}

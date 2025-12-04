import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import { deleteGalleryImage, updateGalleryImage } from "@/lib/gallery";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    throw new Error("UNAUTHORIZED");
  }
}

const revalidateGallery = () => {
  revalidatePath("/gallery");
  revalidatePath("/zh/gallery");
  revalidatePath("/admin/gallery");
};

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const category =
      body.category === "REPOST" || body.category === "AI" || body.category === "ORIGINAL"
        ? body.category
        : undefined;
    const capturedAt =
      typeof body.capturedAt === "string" && body.capturedAt && !Number.isNaN(Date.parse(body.capturedAt))
        ? new Date(body.capturedAt)
        : undefined;

    const image = await updateGalleryImage(id, {
      title: typeof body.title === "string" ? body.title : undefined,
      description: typeof body.description === "string" ? body.description : undefined,
      category,
      capturedAt: capturedAt ?? null,
    });

    revalidateGallery();
    return NextResponse.json({ image });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Admin] update gallery failed", error);
    return NextResponse.json({ error: "Failed to update image" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    await deleteGalleryImage(id);
    revalidateGallery();
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Admin] delete gallery failed", error);
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 });
  }
}

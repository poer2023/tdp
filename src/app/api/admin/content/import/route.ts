import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import { importContent } from "@/lib/content-import";

// Ensure Node.js runtime for Prisma-backed import
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // Check authentication and admin role
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  // Parse query parameters
  const searchParams = req.nextUrl.searchParams;
  const dryRun = searchParams.get("dryRun") === "true";

  try {
    // Get uploaded file
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Convert to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate file type
    if (!file.name.endsWith(".zip")) {
      return NextResponse.json({ error: "File must be a zip archive" }, { status: 400 });
    }

    // Process import
    const result = await importContent(buffer, {
      dryRun,
      adminId: session.user.id,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Import failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

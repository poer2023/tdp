import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole, PostStatus, PostLocale } from "@prisma/client";
import { exportContent } from "@/lib/content-export";

// Ensure Node.js runtime for Prisma-backed export
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  // Check authentication and admin role
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("export route session role", session.user.role);

  if (session.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  // Parse query parameters
  const searchParams = req.nextUrl.searchParams;
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  const statusParam = searchParams.get("statuses");
  const localeParam = searchParams.get("locales");

  // Parse status filter
  let statuses: PostStatus[] | undefined;
  if (statusParam) {
    statuses = statusParam.split(",").map((s) => {
      const upper = s.toUpperCase();
      if (upper === "PUBLISHED") return PostStatus.PUBLISHED;
      if (upper === "DRAFT") return PostStatus.DRAFT;
      return PostStatus.PUBLISHED; // default
    });
  }

  // Parse locale filter
  let locales: PostLocale[] | undefined;
  if (localeParam) {
    locales = localeParam.split(",").map((l) => {
      const upper = l.toUpperCase();
      if (upper === "EN") return PostLocale.EN;
      if (upper === "ZH") return PostLocale.ZH;
      return PostLocale.EN; // default
    });
  }

  try {
    // Generate export
    const zipBuffer = await exportContent({
      ...(from && { from }),
      ...(to && { to }),
      ...(statuses && { statuses }),
      ...(locales && { locales }),
    });

    // Return zip file
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `content-export-${timestamp}.zip`;

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": zipBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Export failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

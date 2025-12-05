/**
 * Public Curated Item API
 * GET /api/curated/[id] - Get a single curated item by ID
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const item = await prisma.shareItem.findUnique({
      where: { id },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error("[Curated API] Error fetching item:", error);
    return NextResponse.json(
      { error: "Failed to fetch curated item" },
      { status: 500 }
    );
  }
}


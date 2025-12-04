import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    throw new Error("UNAUTHORIZED");
  }
}

export async function GET() {
  try {
    await requireAdmin();
    const [skills, routines, steps, photoStats] = await Promise.all([
      prisma.skillData.findMany({ orderBy: { updatedAt: "desc" } }),
      prisma.routineData.findMany({ orderBy: { name: "asc" } }),
      prisma.stepsData.findMany({ orderBy: { date: "asc" } }),
      prisma.photoStats.findMany({ orderBy: { date: "asc" } }),
    ]);

    return NextResponse.json({ skills, routines, steps, photoStats });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Admin] life-data fetch failed", error);
    return NextResponse.json({ error: "Failed to fetch life data" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json().catch(() => ({}));
    const {
      skills = [],
      routines = [],
      steps = [],
      photoStats = [],
    }: {
      skills?: Array<{ id?: string; name: string; level: number; category?: string | null }>;
      routines?: Array<{ id?: string; name: string; value: number; color: string }>;
      steps?: Array<{ id?: string; date: string | Date; steps: number }>;
      photoStats?: Array<{ id?: string; date: string | Date; count: number }>;
    } = body;

    await prisma.$transaction(async (tx) => {
      // Skills: upsert by id when provided, else create
      for (const s of skills) {
        if (s.id) {
          await tx.skillData.update({
            where: { id: s.id },
            data: {
              name: s.name,
              level: s.level,
              category: s.category ?? null,
            },
          });
        } else {
          await tx.skillData.create({
            data: {
              name: s.name,
              level: s.level,
              category: s.category ?? null,
            },
          });
        }
      }

      // Routines
      for (const r of routines) {
        if (r.id) {
          await tx.routineData.update({
            where: { id: r.id },
            data: { name: r.name, value: r.value, color: r.color },
          });
        } else {
          await tx.routineData.create({
            data: { name: r.name, value: r.value, color: r.color },
          });
        }
      }

      // StepsData (unique by date)
      for (const s of steps) {
        const date = new Date(s.date);
        await tx.stepsData.upsert({
          where: { date },
          create: { date, steps: s.steps },
          update: { steps: s.steps },
        });
      }

      // PhotoStats (unique by date)
      for (const p of photoStats) {
        const date = new Date(p.date);
        await tx.photoStats.upsert({
          where: { date },
          create: { date, count: p.count },
          update: { count: p.count },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Admin] life-data update failed", error);
    return NextResponse.json({ error: "Failed to update life data" }, { status: 500 });
  }
}

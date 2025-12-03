"use server";

import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export type SkillPayload = { name: string; level: number; category?: string };
export type RoutinePayload = { name: string; value: number; color: string };
export type DayPayload = { date: string; value: number };

export type LifeLogPayload = {
  skills: SkillPayload[];
  routines: RoutinePayload[];
  steps: DayPayload[];
  photos: DayPayload[];
};

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    throw new Error("未授权");
  }
}

export async function saveLifeLogData(payload: LifeLogPayload) {
  await requireAdmin();

  await prisma.$transaction([
    prisma.skillData.deleteMany({}),
    prisma.routineData.deleteMany({}),
    prisma.stepsData.deleteMany({}),
    prisma.photoStats.deleteMany({}),
  ]);

  if (payload.skills?.length) {
    await prisma.skillData.createMany({
      data: payload.skills.map((item) => ({
        name: item.name,
        level: Math.max(0, Math.min(100, item.level)),
        category: item.category ?? null,
      })),
    });
  }

  if (payload.routines?.length) {
    await prisma.routineData.createMany({
      data: payload.routines.map((item) => ({
        name: item.name,
        value: Math.max(0, item.value),
        color: item.color || "#10b981",
      })),
    });
  }

  if (payload.steps?.length) {
    await prisma.stepsData.createMany({
      data: payload.steps.map((item) => ({
        date: new Date(item.date),
        steps: Math.max(0, item.value),
      })),
      skipDuplicates: true,
    });
  }

  if (payload.photos?.length) {
    await prisma.photoStats.createMany({
      data: payload.photos.map((item) => ({
        date: new Date(item.date),
        count: Math.max(0, item.value),
      })),
      skipDuplicates: true,
    });
  }

  revalidatePath("/admin/data");
  return { status: "success" as const };
}

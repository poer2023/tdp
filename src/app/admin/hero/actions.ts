"use server";

import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export type HeroInput = { url: string; sortOrder?: number; active?: boolean };

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    throw new Error("未授权");
  }
}

export async function addHeroImageAction(input: HeroInput) {
  await requireAdmin();
  if (!input.url.trim()) {
    throw new Error("URL 不能为空");
  }

  const sortOrder =
    typeof input.sortOrder === "number"
      ? input.sortOrder
      : (await prisma.heroImage.count({})) ?? 0;

  await prisma.heroImage.create({
    data: {
      url: input.url.trim(),
      sortOrder,
      active: input.active ?? true,
    },
  });

  revalidatePath("/admin/hero");
}

export async function toggleHeroImageAction(id: string, active: boolean) {
  await requireAdmin();
  if (!id) throw new Error("缺少 ID");

  await prisma.heroImage.update({
    where: { id },
    data: { active },
  });
  revalidatePath("/admin/hero");
}

export async function deleteHeroImageAction(id: string) {
  await requireAdmin();
  if (!id) throw new Error("缺少 ID");

  await prisma.heroImage.delete({ where: { id } });
  revalidatePath("/admin/hero");
}

export async function reorderHeroImages(order: Array<{ id: string; sortOrder: number }>) {
  await requireAdmin();
  const updates = order.map((item) =>
    prisma.heroImage.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } })
  );
  await prisma.$transaction(updates);
  revalidatePath("/admin/hero");
}

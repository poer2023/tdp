"use server";

import { revalidatePath } from "next/cache";
import { MomentStatus, MomentVisibility, UserRole } from "@prisma/client";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export type MomentInput = {
  id?: string;
  content: string;
  tags: string[];
  images: string[];
  visibility: MomentVisibility;
  location?: string;
};

export type MomentActionResult = { status: "success"; id: string } | { status: "error"; message: string };

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    throw new Error("未授权");
  }
  return session.user;
}

function normalizeTags(tags: string[]) {
  return tags.map((tag) => tag.trim()).filter(Boolean);
}

export async function createMomentAction(input: MomentInput): Promise<MomentActionResult> {
  const user = await requireAdmin();
  const tags = normalizeTags(input.tags);

  if (!input.content.trim()) {
    return { status: "error", message: "正文不能为空" };
  }

  const created = await prisma.moment.create({
    data: {
      authorId: user.id,
      content: input.content,
      tags,
      images: input.images.length ? input.images : undefined,
      visibility: input.visibility ?? MomentVisibility.PUBLIC,
      location: input.location ? { name: input.location } : undefined,
      status: MomentStatus.PUBLISHED,
    },
    select: { id: true },
  });

  revalidatePath("/admin/moments");
  revalidatePath("/m");
  return { status: "success", id: created.id };
}

export async function updateMomentAction(input: MomentInput): Promise<MomentActionResult> {
  if (!input.id) return { status: "error", message: "缺少 ID" };
  await requireAdmin();

  const tags = normalizeTags(input.tags);

  await prisma.moment.update({
    where: { id: input.id },
    data: {
      content: input.content,
      tags,
      images: input.images.length ? input.images : undefined,
      visibility: input.visibility ?? MomentVisibility.PUBLIC,
      location: input.location ? { name: input.location } : undefined,
    },
  });

  revalidatePath("/admin/moments");
  revalidatePath(`/admin/moments/${input.id}`);
  return { status: "success", id: input.id };
}

export async function deleteMomentAction(id: string): Promise<MomentActionResult> {
  if (!id) return { status: "error", message: "缺少 ID" };
  await requireAdmin();

  await prisma.moment.delete({ where: { id } });
  revalidatePath("/admin/moments");
  return { status: "success", id };
}

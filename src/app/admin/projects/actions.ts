"use server";

import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export type ProjectInput = {
  id?: string;
  title: string;
  description: string;
  cover?: string | null;
  role?: string | null;
  year?: string | null;
  demoUrl?: string | null;
  repoUrl?: string | null;
  technologies: string[];
  features: string[];
  statsJson?: string;
};

export type ProjectActionResult = { status: "success"; id: string } | { status: "error"; message: string };

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    throw new Error("未授权");
  }
}

function parseList(values: string[]) {
  return values.map((v) => v.trim()).filter(Boolean);
}

function parseStats(raw?: string) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function createProjectAction(input: ProjectInput): Promise<ProjectActionResult> {
  await requireAdmin();
  if (!input.title.trim()) return { status: "error", message: "标题不能为空" };
  if (!input.description.trim()) return { status: "error", message: "描述不能为空" };

  const created = await prisma.project.create({
    data: {
      title: input.title,
      description: input.description,
      imageUrl: input.cover || null,
      role: input.role || null,
      year: input.year || null,
      demoUrl: input.demoUrl || null,
      repoUrl: input.repoUrl || null,
      technologies: parseList(input.technologies),
      features: parseList(input.features),
      stats: parseStats(input.statsJson) ?? undefined,
    },
    select: { id: true },
  });

  revalidatePath("/admin/projects");
  return { status: "success", id: created.id };
}

export async function updateProjectAction(input: ProjectInput): Promise<ProjectActionResult> {
  await requireAdmin();
  if (!input.id) return { status: "error", message: "缺少项目 ID" };

  await prisma.project.update({
    where: { id: input.id },
    data: {
      title: input.title,
      description: input.description,
      imageUrl: input.cover || null,
      role: input.role || null,
      year: input.year || null,
      demoUrl: input.demoUrl || null,
      repoUrl: input.repoUrl || null,
      technologies: parseList(input.technologies),
      features: parseList(input.features),
      stats: parseStats(input.statsJson) ?? undefined,
    },
  });

  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${input.id}`);
  return { status: "success", id: input.id };
}

export async function deleteProjectAction(id: string): Promise<ProjectActionResult> {
  await requireAdmin();
  if (!id) return { status: "error", message: "缺少项目 ID" };

  await prisma.project.delete({ where: { id } });
  revalidatePath("/admin/projects");
  return { status: "success", id };
}

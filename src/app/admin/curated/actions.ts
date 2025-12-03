"use server";

import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export type ShareItemInput = {
  id?: string;
  title: string;
  url: string;
  description?: string;
  tags: string[];
  imageUrl?: string | null;
};

export type ShareItemResult =
  | { status: "success"; id: string; domain: string }
  | { status: "error"; message: string };

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    throw new Error("未授权");
  }
}

function parseTags(tags: string[]) {
  return tags.map((tag) => tag.trim()).filter(Boolean);
}

function extractDomain(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export async function createShareItemAction(input: ShareItemInput): Promise<ShareItemResult> {
  await requireAdmin();
  if (!input.title.trim()) return { status: "error", message: "标题不能为空" };
  if (!input.url.trim()) return { status: "error", message: "URL 不能为空" };

  const domain = extractDomain(input.url);

  const created = await prisma.shareItem.create({
    data: {
      title: input.title,
      url: input.url,
      domain,
      description: input.description ?? "",
      imageUrl: input.imageUrl || null,
      tags: parseTags(input.tags),
    },
    select: { id: true },
  });

  revalidatePath("/admin/curated");
  return { status: "success", id: created.id, domain };
}

export async function updateShareItemAction(input: ShareItemInput): Promise<ShareItemResult> {
  await requireAdmin();
  if (!input.id) return { status: "error", message: "缺少 ID" };
  if (!input.title.trim()) return { status: "error", message: "标题不能为空" };
  if (!input.url.trim()) return { status: "error", message: "URL 不能为空" };

  const domain = extractDomain(input.url);

  await prisma.shareItem.update({
    where: { id: input.id },
    data: {
      title: input.title,
      url: input.url,
      domain,
      description: input.description ?? "",
      imageUrl: input.imageUrl || null,
      tags: parseTags(input.tags),
    },
  });

  revalidatePath("/admin/curated");
  revalidatePath(`/admin/curated/${input.id}`);
  return { status: "success", id: input.id, domain };
}

export async function deleteShareItemAction(id: string): Promise<ShareItemResult> {
  await requireAdmin();
  if (!id) return { status: "error", message: "缺少 ID" };

  await prisma.shareItem.delete({ where: { id } });
  revalidatePath("/admin/curated");
  return { status: "success", id, domain: "" };
}

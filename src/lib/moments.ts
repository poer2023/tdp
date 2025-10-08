import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";

export type MomentVisibility = "PUBLIC" | "UNLISTED" | "PRIVATE";
export type MomentStatus = "DRAFT" | "PUBLISHED" | "SCHEDULED";

export type MomentImage = {
  url: string;
  w?: number | null;
  h?: number | null;
  alt?: string | null;
  previewUrl?: string | null;
};

export type MomentListItem = {
  id: string;
  slug: string | null;
  content: string;
  images: MomentImage[];
  createdAt: Date;
  visibility: MomentVisibility;
  location: unknown | null;
  tags: string[];
  lang: string;
  authorId: string;
};

export async function listMoments(options?: {
  limit?: number;
  cursor?: string | null;
  visibility?: MomentVisibility;
  lang?: string | null;
  tag?: string | null;
  q?: string | null;
}): Promise<MomentListItem[]> {
  const limit = options?.limit ?? 20;
  const cursor = options?.cursor ?? null;
  const now = new Date();
  const where: Prisma.MomentWhereInput = {
    deletedAt: null,
    OR: [{ status: "PUBLISHED" }, { status: "SCHEDULED", scheduledAt: { lte: now } }],
  };
  if (options?.visibility) where.visibility = options.visibility;
  else where.visibility = { in: ["PUBLIC", "UNLISTED"] };
  if (options?.lang) where.lang = options.lang;
  const extraAnd: Prisma.MomentWhereInput[] = [];
  if (options?.tag) extraAnd.push({ tags: { has: options.tag } });
  if (options?.q) extraAnd.push({ content: { contains: options.q, mode: "insensitive" } });
  if (extraAnd.length) {
    if (Array.isArray((where as Prisma.MomentWhereInput).AND)) {
      (where as Prisma.MomentWhereInput).AND = [
        ...((where as Prisma.MomentWhereInput).AND as Prisma.MomentWhereInput[]),
        ...extraAnd,
      ];
    } else {
      (where as Prisma.MomentWhereInput).AND = extraAnd;
    }
  }

  const items = await prisma.moment.findMany({
    where,
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      content: true,
      images: true,
      createdAt: true,
      visibility: true,
      location: true,
      tags: true,
      lang: true,
      authorId: true,
    },
  });
  return items.map((m) => ({
    ...m,
    images: (m.images as MomentImage[] | null) ?? [],
  }));
}

export async function getMomentByIdOrSlug(idOrSlug: string) {
  const now = new Date();
  const m = await prisma.moment.findFirst({
    where: {
      deletedAt: null,
      AND: [
        { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
        { OR: [{ status: "PUBLISHED" }, { status: "SCHEDULED", scheduledAt: { lte: now } }] },
      ],
    },
  });
  if (!m) return null;
  return { ...m, images: (m.images as MomentImage[] | null) ?? [] };
}

export async function softDeleteMoment(id: string, requester: { id: string; role?: string }) {
  const m = await prisma.moment.findUnique({ where: { id } });
  if (!m) throw new Error("not found");
  const can = requester.role === "ADMIN" || requester.id === m.authorId;
  if (!can) throw new Error("forbidden");
  await prisma.moment.update({ where: { id }, data: { deletedAt: new Date() } });
}

export async function restoreMoment(id: string, requester: { id: string; role?: string }) {
  const m = await prisma.moment.findUnique({ where: { id } });
  if (!m) throw new Error("not found");
  const can = requester.role === "ADMIN" || requester.id === m.authorId;
  if (!can) throw new Error("forbidden");
  await prisma.moment.update({ where: { id }, data: { deletedAt: null } });
}

export async function purgeMoment(id: string, requester: { id: string; role?: string }) {
  const m = await prisma.moment.findUnique({ where: { id } });
  if (!m) return;
  const can = requester.role === "ADMIN" || requester.id === m.authorId;
  if (!can) throw new Error("forbidden");
  await prisma.moment.delete({ where: { id } });
}

export async function publishDueScheduled(): Promise<number> {
  const now = new Date();
  const res = await prisma.moment.updateMany({
    where: { status: "SCHEDULED", scheduledAt: { lte: now }, deletedAt: null },
    data: { status: "PUBLISHED" },
  });
  return res.count;
}

export async function createMoment(input: {
  authorId: string;
  content: string;
  images?: MomentImage[];
  visibility?: MomentVisibility;
  tags?: string[];
  location?: { name?: string; lat?: number; lng?: number } | null;
  lang?: string;
  status?: MomentStatus;
}) {
  const moment = await prisma.moment.create({
    data: {
      authorId: input.authorId,
      content: input.content,
      images: (input.images ?? []) as unknown as Prisma.InputJsonValue,
      visibility: input.visibility ?? "PUBLIC",
      tags: input.tags ?? [],
      location: (input.location ?? null) as Prisma.InputJsonValue,
      lang: input.lang ?? "en-US",
      status: input.status ?? "PUBLISHED",
    },
    select: { id: true },
  });

  // Revalidate key pages
  revalidatePath("/m");
  revalidatePath("/zh/m");
  return moment.id;
}

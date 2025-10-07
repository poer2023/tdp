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
};

export async function listMoments(options?: {
  limit?: number;
  cursor?: string | null;
  visibility?: MomentVisibility;
  lang?: string | null;
}): Promise<MomentListItem[]> {
  const limit = options?.limit ?? 20;
  const cursor = options?.cursor ?? null;
  const where: Prisma.MomentWhereInput = {
    status: "PUBLISHED",
  };
  if (options?.visibility) where.visibility = options.visibility;
  else where.visibility = { in: ["PUBLIC", "UNLISTED"] };
  if (options?.lang) where.lang = options.lang;

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
    },
  });
  return items.map((m) => ({
    ...m,
    images: (m.images as MomentImage[] | null) ?? [],
  }));
}

export async function getMomentByIdOrSlug(idOrSlug: string) {
  const m = await prisma.moment.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
  });
  if (!m) return null;
  return { ...m, images: (m.images as MomentImage[] | null) ?? [] };
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

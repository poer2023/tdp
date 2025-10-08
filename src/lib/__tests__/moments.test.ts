import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Prisma } from "@prisma/client";
import {
  listMoments,
  getMomentByIdOrSlug,
  createMoment,
  publishDueScheduled,
  softDeleteMoment,
  restoreMoment,
  purgeMoment,
} from "../moments";

type PrismaMock = {
  moment: {
    findMany: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
};

type CacheModuleMock = {
  revalidatePath: ReturnType<typeof vi.fn>;
};

// Mock prisma on module load with fresh spies
vi.mock("../prisma", () => {
  return {
    default: {
      moment: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        updateMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    },
  };
});

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

describe("moments lib", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const loadPrisma = async () => (await import("../prisma")).default as unknown as PrismaMock;

  it("listMoments builds correct base where and maps images", async () => {
    const now = new Date();
    const prisma = await loadPrisma();
    prisma.moment.findMany.mockResolvedValueOnce([
      {
        id: "m1",
        slug: null,
        content: "hello",
        images: [{ url: "/a.jpg" }],
        createdAt: now,
        visibility: "PUBLIC",
        location: null,
        tags: ["t1"],
        lang: "en-US",
        authorId: "u1",
      },
    ]);

    const res = await listMoments();
    expect(res[0].images[0].url).toBe("/a.jpg");
    const args = prisma.moment.findMany.mock.calls[0]?.[0] as Prisma.MomentFindManyArgs;
    const where = args.where as Prisma.MomentWhereInput;
    expect(where.deletedAt).toBeNull();
    // should have OR with PUBLISHED or SCHEDULED<=now
    expect(Array.isArray(where.OR)).toBe(true);
  });

  it("listMoments applies tag/q filters via AND", async () => {
    const prisma = await loadPrisma();
    prisma.moment.findMany.mockResolvedValueOnce([]);
    await listMoments({ tag: "x", q: "text" });
    const args = prisma.moment.findMany.mock.calls.at(-1)?.[0] as Prisma.MomentFindManyArgs;
    const where = args.where as Prisma.MomentWhereInput;
    expect(Array.isArray(where.AND)).toBe(true);
    const andConditions = (where.AND ?? []) as Prisma.MomentWhereInput[];
    const hasTagFilter = andConditions.some((condition) => {
      const tagsFilter = condition.tags as Prisma.StringNullableListFilter | undefined;
      return tagsFilter?.has === "x";
    });
    expect(hasTagFilter).toBe(true);
    const hasContentFilter = andConditions.some((condition) => {
      const contentFilter = condition.content as Prisma.StringFilter | undefined;
      return contentFilter?.contains === "text";
    });
    expect(hasContentFilter).toBe(true);
  });

  it("getMomentByIdOrSlug combines ORs under AND", async () => {
    const prisma = await loadPrisma();
    prisma.moment.findFirst.mockResolvedValueOnce({ id: "m2", images: null });
    const m = await getMomentByIdOrSlug("m2");
    expect(m?.id).toBe("m2");
    const args = prisma.moment.findFirst.mock.calls[0]?.[0] as Prisma.MomentFindFirstArgs;
    // AND should include [ OR(id|slug), OR(status...) ]
    const where = args.where as Prisma.MomentWhereInput;
    expect(Array.isArray(where.AND)).toBe(true);
  });

  it("createMoment revalidates lists", async () => {
    const prisma = await loadPrisma();
    prisma.moment.create.mockResolvedValueOnce({ id: "m3" });
    const id = await createMoment({ authorId: "u1", content: "hi" });
    expect(id).toBe("m3");
    const cache = (await import("next/cache")) as unknown as CacheModuleMock;
    expect(cache.revalidatePath).toHaveBeenCalledWith("/m");
    expect(cache.revalidatePath).toHaveBeenCalledWith("/zh/m");
  });

  it("publishDueScheduled updates many", async () => {
    const prisma = await loadPrisma();
    prisma.moment.updateMany.mockResolvedValueOnce({ count: 5 });
    const n = await publishDueScheduled();
    expect(n).toBe(5);
  });

  it("soft delete/restore/purge permission checks", async () => {
    const prisma = await loadPrisma();
    prisma.moment.findUnique.mockResolvedValue({ id: "m1", authorId: "owner" });
    await expect(softDeleteMoment("m1", { id: "not-owner" })).rejects.toThrow();
    await expect(softDeleteMoment("m1", { id: "admin", role: "ADMIN" })).resolves.not.toThrow();
    await expect(restoreMoment("m1", { id: "owner" })).resolves.not.toThrow();
    await expect(purgeMoment("m1", { id: "owner" })).resolves.not.toThrow();
  });
});

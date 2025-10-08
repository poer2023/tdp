import { describe, it, expect, vi, beforeEach } from "vitest";
import { assertRateLimit } from "../rate-limit";

type PrismaMock = {
  rateLimitHit: {
    count: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
};

vi.mock("../prisma", () => ({
  default: {
    rateLimitHit: {
      count: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe("rate-limit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const loadPrisma = async () => (await import("../prisma")).default as unknown as PrismaMock;

  it("allows under limit and records hit", async () => {
    const prisma = await loadPrisma();
    prisma.rateLimitHit.count.mockResolvedValueOnce(2);
    prisma.rateLimitHit.create.mockResolvedValueOnce({});
    await expect(assertRateLimit("k", 5, 1000)).resolves.not.toThrow();
    expect(prisma.rateLimitHit.create).toHaveBeenCalled();
  });

  it("throws when exceeded", async () => {
    const prisma = await loadPrisma();
    prisma.rateLimitHit.count.mockResolvedValueOnce(5);
    await expect(assertRateLimit("k", 5, 1000)).rejects.toThrow();
  });
});

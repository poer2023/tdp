import { PrismaClient } from "@prisma/client";
import { mockDeep, mockReset } from "vitest-mock-extended";
import { beforeEach } from "vitest";

// Create a deep mock of Prisma Client with full type safety
export const prismaMock = mockDeep<PrismaClient>();

// Reset mocks between each test to ensure test isolation
beforeEach(() => {
  mockReset(prismaMock);
});

export default prismaMock;

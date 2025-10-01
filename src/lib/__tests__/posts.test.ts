import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseTags, serializeTags } from "../posts";

// Mock Prisma client
vi.mock("../prisma", () => ({
  default: {
    post: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe("Posts Utility Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("parseTags", () => {
    it("should return empty array for null input", () => {
      expect(parseTags(null)).toEqual([]);
    });

    it("should return empty array for undefined input", () => {
      expect(parseTags(undefined)).toEqual([]);
    });

    it("should return empty array for empty string", () => {
      expect(parseTags("")).toEqual([]);
    });

    it("should parse comma-separated tags", () => {
      expect(parseTags("react,next.js,typescript")).toEqual(["react", "next.js", "typescript"]);
    });

    it("should trim whitespace from tags", () => {
      expect(parseTags(" react , next.js , typescript ")).toEqual([
        "react",
        "next.js",
        "typescript",
      ]);
    });

    it("should filter out empty tags", () => {
      expect(parseTags("react,,next.js, ,typescript")).toEqual(["react", "next.js", "typescript"]);
    });
  });

  describe("serializeTags", () => {
    it("should return null for empty array", () => {
      expect(serializeTags([])).toBeNull();
    });

    it("should return null for undefined input", () => {
      expect(serializeTags(undefined)).toBeNull();
    });

    it("should serialize tags to comma-separated string", () => {
      expect(serializeTags(["react", "next.js", "typescript"])).toBe("react,next.js,typescript");
    });

    it("should trim and filter empty tags", () => {
      expect(serializeTags([" react ", "", "next.js", " ", "typescript "])).toBe(
        "react,next.js,typescript"
      );
    });
  });
});

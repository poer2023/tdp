/**
 * Tests for database fallback utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { withDbFallback, shouldSkipDb } from "../db-fallback";

describe("shouldSkipDb", () => {
  const originalEnv = process.env.E2E_SKIP_DB;

  afterEach(() => {
    process.env.E2E_SKIP_DB = originalEnv;
  });

  it('should return true when E2E_SKIP_DB is "1"', () => {
    process.env.E2E_SKIP_DB = "1";
    expect(shouldSkipDb()).toBe(true);
  });

  it('should return true when E2E_SKIP_DB is "true"', () => {
    process.env.E2E_SKIP_DB = "true";
    expect(shouldSkipDb()).toBe(true);
  });

  it('should return true when E2E_SKIP_DB is "yes"', () => {
    process.env.E2E_SKIP_DB = "yes";
    expect(shouldSkipDb()).toBe(true);
  });

  it("should return false when E2E_SKIP_DB is not set", () => {
    delete process.env.E2E_SKIP_DB;
    expect(shouldSkipDb()).toBe(false);
  });

  it('should return false when E2E_SKIP_DB is "0"', () => {
    process.env.E2E_SKIP_DB = "0";
    expect(shouldSkipDb()).toBe(false);
  });

  it('should return false when E2E_SKIP_DB is "false"', () => {
    process.env.E2E_SKIP_DB = "false";
    expect(shouldSkipDb()).toBe(false);
  });
});

describe("withDbFallback", () => {
  const originalEnv = {
    E2E_SKIP_DB: process.env.E2E_SKIP_DB,
    NODE_ENV: process.env.NODE_ENV,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.E2E_SKIP_DB = originalEnv.E2E_SKIP_DB;
    process.env.NODE_ENV = originalEnv.NODE_ENV;
  });

  describe("when E2E_SKIP_DB is enabled", () => {
    beforeEach(() => {
      process.env.E2E_SKIP_DB = "1";
    });

    it("should return fallback value without executing task", async () => {
      const task = vi.fn().mockResolvedValue("task result");
      const fallback = vi.fn().mockReturnValue("fallback result");

      const result = await withDbFallback(task, fallback);

      expect(result).toBe("fallback result");
      expect(task).not.toHaveBeenCalled();
      expect(fallback).toHaveBeenCalledOnce();
    });

    it("should return async fallback value", async () => {
      const task = vi.fn().mockResolvedValue("task result");
      const fallback = vi.fn().mockResolvedValue("async fallback");

      const result = await withDbFallback(task, fallback);

      expect(result).toBe("async fallback");
      expect(task).not.toHaveBeenCalled();
    });

    it("should return undefined when no fallback provided", async () => {
      const task = vi.fn().mockResolvedValue("task result");

      const result = await withDbFallback(task);

      expect(result).toBeUndefined();
      expect(task).not.toHaveBeenCalled();
    });
  });

  describe("when E2E_SKIP_DB is disabled", () => {
    beforeEach(() => {
      delete process.env.E2E_SKIP_DB;
    });

    it("should return task result when successful", async () => {
      const task = vi.fn().mockResolvedValue("task result");
      const fallback = vi.fn().mockReturnValue("fallback result");

      const result = await withDbFallback(task, fallback);

      expect(result).toBe("task result");
      expect(task).toHaveBeenCalledOnce();
      expect(fallback).not.toHaveBeenCalled();
    });

    it("should return fallback value when task throws error", async () => {
      const task = vi.fn().mockRejectedValue(new Error("DB connection failed"));
      const fallback = vi.fn().mockReturnValue("fallback result");

      const result = await withDbFallback(task, fallback, "test context");

      expect(result).toBe("fallback result");
      expect(task).toHaveBeenCalledOnce();
      expect(fallback).toHaveBeenCalledOnce();
    });

    it("should log warning in non-production when task fails", async () => {
      process.env.NODE_ENV = "development";
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const error = new Error("DB timeout");
      const task = vi.fn().mockRejectedValue(error);
      const fallback = vi.fn().mockReturnValue("fallback");

      await withDbFallback(task, fallback, "posts query");

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "[db-fallback] posts query failed, returning fallback value.",
        error
      );

      consoleWarnSpy.mockRestore();
    });

    it("should log warning without context when not provided", async () => {
      process.env.NODE_ENV = "development";
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const error = new Error("DB error");
      const task = vi.fn().mockRejectedValue(error);
      const fallback = vi.fn().mockReturnValue("fallback");

      await withDbFallback(task, fallback);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "[db-fallback] failed, returning fallback value.",
        error
      );

      consoleWarnSpy.mockRestore();
    });

    it("should not log in production environment", async () => {
      process.env.NODE_ENV = "production";
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const task = vi.fn().mockRejectedValue(new Error("DB error"));
      const fallback = vi.fn().mockReturnValue("fallback");

      await withDbFallback(task, fallback, "context");

      expect(consoleWarnSpy).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it("should handle Prisma connection errors", async () => {
      const prismaError = Object.assign(new Error("Connection refused"), {
        code: "P1001",
        clientVersion: "5.0.0",
      });

      const task = vi.fn().mockRejectedValue(prismaError);
      const fallback = vi.fn().mockReturnValue([]);

      const result = await withDbFallback(task, fallback, "gallery query");

      expect(result).toEqual([]);
      expect(fallback).toHaveBeenCalledOnce();
    });

    it("should handle Prisma query timeout errors", async () => {
      const timeoutError = Object.assign(new Error("Query timeout"), {
        code: "P2024",
        clientVersion: "5.0.0",
      });

      const task = vi.fn().mockRejectedValue(timeoutError);
      const fallback = vi.fn().mockReturnValue({ count: 0 });

      const result = await withDbFallback(task, fallback, "count query");

      expect(result).toEqual({ count: 0 });
    });

    it("should handle network errors", async () => {
      const networkError = Object.assign(new Error("ECONNREFUSED"), {
        errno: -61,
        code: "ECONNREFUSED",
      });

      const task = vi.fn().mockRejectedValue(networkError);
      const fallback = vi.fn().mockReturnValue(null);

      const result = await withDbFallback(task, fallback);

      expect(result).toBeNull();
    });
  });

  describe("with complex return types", () => {
    beforeEach(() => {
      delete process.env.E2E_SKIP_DB;
    });

    it("should handle array return types", async () => {
      const task = vi.fn().mockResolvedValue([1, 2, 3]);
      const result = await withDbFallback(task);

      expect(result).toEqual([1, 2, 3]);
    });

    it("should handle object return types", async () => {
      const task = vi.fn().mockResolvedValue({ id: 1, name: "test" });
      const result = await withDbFallback(task);

      expect(result).toEqual({ id: 1, name: "test" });
    });

    it("should handle null return types", async () => {
      const task = vi.fn().mockResolvedValue(null);
      const result = await withDbFallback(task);

      expect(result).toBeNull();
    });

    it("should provide typed fallback for array types", async () => {
      interface Post {
        id: number;
        title: string;
      }

      const task = vi.fn().mockRejectedValue(new Error("DB error"));
      const fallback = vi.fn().mockReturnValue([{ id: 1, title: "Fallback post" }] as Post[]);

      const result = await withDbFallback(task, fallback);

      expect(result).toEqual([{ id: 1, title: "Fallback post" }]);
      expect(Array.isArray(result)).toBe(true);
    });
  });
});

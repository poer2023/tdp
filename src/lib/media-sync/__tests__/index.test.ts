import { describe, it, expect, vi, beforeEach } from "vitest";
import { syncAllPlatforms } from "../index";
import { encryptCredential, decryptCredential, isEncrypted } from "../../encryption";

// Mock Prisma
const mockPrismaFindMany = vi.fn();
const mockPrismaCreate = vi.fn();
const mockPrismaUpdate = vi.fn();
const mockPrismaUpsert = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    externalCredential: {
      findMany: (...args: any[]) => mockPrismaFindMany(...args),
    },
    syncJob: {
      create: (...args: any[]) => mockPrismaCreate(...args),
      update: (...args: any[]) => mockPrismaUpdate(...args),
    },
    mediaWatch: {
      upsert: (...args: any[]) => mockPrismaUpsert(...args),
    },
  },
}));

// Mock media-sync modules
const mockFetchBilibiliHistory = vi.fn();
const mockFetchDoubanWatched = vi.fn();

vi.mock("../bilibili", () => ({
  fetchBilibiliHistory: (...args: any[]) => mockFetchBilibiliHistory(...args),
  normalizeBilibiliItem: (item: any) => ({
    platform: "bilibili",
    externalId: item.history.bvid,
    title: item.title,
    cover: item.cover,
    url: `https://www.bilibili.com/video/${item.history.bvid}`,
    watchedAt: new Date(item.view_at * 1000),
    progress: item.progress,
    duration: item.duration,
    metadata: {},
  }),
}));

vi.mock("../douban", () => ({
  fetchDoubanWatched: (...args: any[]) => mockFetchDoubanWatched(...args),
  normalizeDoubanItem: (item: any) => ({
    platform: "douban",
    externalId: item.id,
    title: item.title,
    cover: item.cover,
    url: `https://movie.douban.com/subject/${item.id}`,
    watchedAt: new Date(item.create_time),
    rating: item.rating,
    metadata: {},
  }),
}));

describe("Media Sync Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set encryption key for tests
    process.env.CREDENTIAL_ENCRYPTION_KEY =
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    // Clear other environment variables
    delete process.env.BILIBILI_SESSDATA;
    delete process.env.BILIBILI_BILI_JCT;
    delete process.env.BILIBILI_BUVID3;
    delete process.env.DOUBAN_USER_ID;
    delete process.env.DOUBAN_COOKIE;
  });

  describe("Credential Decryption Integration", () => {
    it("should decrypt Bilibili cookies and parse correctly", async () => {
      // Create encrypted credential
      const plainCookie = "SESSDATA=test123;bili_jct=abc456;buvid3=xyz789";
      const encryptedCookie = encryptCredential(plainCookie);

      expect(isEncrypted(encryptedCookie)).toBe(true);

      // Setup mock database credentials
      mockPrismaFindMany.mockResolvedValue([
        {
          id: "cred-1",
          platform: "BILIBILI",
          value: encryptedCookie,
          isValid: true,
        },
      ]);

      mockPrismaCreate.mockResolvedValue({ id: "job-1", status: "RUNNING" });
      mockPrismaUpdate.mockResolvedValue({});
      mockFetchBilibiliHistory.mockResolvedValue([
        {
          title: "Test Video",
          cover: "https://example.com/cover.jpg",
          history: { bvid: "BV1xx411c7mD" },
          view_at: 1705305600,
          progress: 100,
          duration: 600,
        },
      ]);
      mockPrismaUpsert.mockResolvedValue({});

      const results = await syncAllPlatforms();

      // Verify decryption and parsing
      expect(mockFetchBilibiliHistory).toHaveBeenCalledWith(
        {
          sessdata: "test123",
          biliJct: "abc456",
          buvid3: "xyz789",
        },
        10
      );

      expect(results).toHaveLength(1);
      expect(results[0].platform).toBe("bilibili");
      expect(results[0].success).toBe(true);
    });

    it("should handle Douban credential decryption", async () => {
      // Create encrypted Douban cookie
      const plainCookie = "dbcl2=mock-cookie-value;bid=another-value";
      const encryptedCookie = encryptCredential(plainCookie);

      expect(isEncrypted(encryptedCookie)).toBe(true);

      // Setup mock database credentials
      mockPrismaFindMany.mockResolvedValue([
        {
          id: "cred-2",
          platform: "DOUBAN",
          value: encryptedCookie,
          metadata: { userId: "123456" },
          isValid: true,
        },
      ]);

      mockPrismaCreate.mockResolvedValue({ id: "job-2", status: "RUNNING" });
      mockPrismaUpdate.mockResolvedValue({});
      mockFetchDoubanWatched.mockResolvedValue([
        {
          id: "1234567",
          title: "Test Movie",
          cover: "https://example.com/movie.jpg",
          create_time: "2025-01-15T10:00:00Z",
          rating: 5,
        },
      ]);
      mockPrismaUpsert.mockResolvedValue({});

      const results = await syncAllPlatforms();

      // Verify decryption
      expect(mockFetchDoubanWatched).toHaveBeenCalledWith(
        {
          userId: "123456",
          cookie: plainCookie, // Decrypted value
        },
        25
      );

      expect(results).toHaveLength(1);
      expect(results[0].platform).toBe("douban");
      expect(results[0].success).toBe(true);
    });

    it("should handle backward compatibility with unencrypted credentials", async () => {
      // Plain (unencrypted) cookie
      const plainCookie = "SESSDATA=plain123;bili_jct=plain456;buvid3=plain789";

      expect(isEncrypted(plainCookie)).toBe(false);

      // Setup mock with plain credential
      mockPrismaFindMany.mockResolvedValue([
        {
          id: "cred-3",
          platform: "BILIBILI",
          value: plainCookie,
          isValid: true,
        },
      ]);

      mockPrismaCreate.mockResolvedValue({ id: "job-3", status: "RUNNING" });
      mockPrismaUpdate.mockResolvedValue({});
      mockFetchBilibiliHistory.mockResolvedValue([
        {
          title: "Legacy Video",
          cover: "https://example.com/legacy.jpg",
          history: { bvid: "BV2xx411c7mE" },
          view_at: 1705305600,
          progress: 50,
          duration: 300,
        },
      ]);
      mockPrismaUpsert.mockResolvedValue({});

      const results = await syncAllPlatforms();

      // Verify plain credential used directly (no decryption)
      expect(mockFetchBilibiliHistory).toHaveBeenCalledWith(
        {
          sessdata: "plain123",
          biliJct: "plain456",
          buvid3: "plain789",
        },
        10
      );

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
    });

    it("should handle mixed encrypted and unencrypted credentials", async () => {
      const encryptedBilibiliCookie = encryptCredential(
        "SESSDATA=enc123;bili_jct=enc456;buvid3=enc789"
      );
      const plainDoubanCookie = "dbcl2=plain-douban";

      // Setup mixed credentials
      mockPrismaFindMany.mockResolvedValue([
        {
          id: "cred-encrypted",
          platform: "BILIBILI",
          value: encryptedBilibiliCookie,
          isValid: true,
        },
        {
          id: "cred-plain",
          platform: "DOUBAN",
          value: plainDoubanCookie,
          metadata: { userId: "999" },
          isValid: true,
        },
      ]);

      mockPrismaCreate.mockResolvedValue({ id: "job-x", status: "RUNNING" });
      mockPrismaUpdate.mockResolvedValue({});
      mockFetchBilibiliHistory.mockResolvedValue([]);
      mockFetchDoubanWatched.mockResolvedValue([]);
      mockPrismaUpsert.mockResolvedValue({});

      const results = await syncAllPlatforms();

      // Verify both platforms synced
      expect(results).toHaveLength(2);
      expect(results.some((r) => r.platform === "bilibili")).toBe(true);
      expect(results.some((r) => r.platform === "douban")).toBe(true);

      // Verify encrypted credential was decrypted
      expect(mockFetchBilibiliHistory).toHaveBeenCalledWith(
        {
          sessdata: "enc123",
          biliJct: "enc456",
          buvid3: "enc789",
        },
        10
      );

      // Verify plain credential used directly
      expect(mockFetchDoubanWatched).toHaveBeenCalledWith(
        {
          userId: "999",
          cookie: plainDoubanCookie,
        },
        25
      );
    });
  });

  describe("Credential Parsing and Validation", () => {
    it("should skip Bilibili credentials missing required cookie fields", async () => {
      const incompleteCookie = encryptCredential("SESSDATA=only-one-field");

      mockPrismaFindMany.mockResolvedValue([
        {
          id: "cred-incomplete",
          platform: "BILIBILI",
          value: incompleteCookie,
          isValid: true,
        },
      ]);

      const results = await syncAllPlatforms();

      // Should not attempt to sync
      expect(mockFetchBilibiliHistory).not.toHaveBeenCalled();
      expect(results).toHaveLength(0);
    });

    it("should skip Douban credentials missing userId in metadata", async () => {
      const validCookie = encryptCredential("dbcl2=valid-cookie");

      mockPrismaFindMany.mockResolvedValue([
        {
          id: "cred-no-userid",
          platform: "DOUBAN",
          value: validCookie,
          metadata: {}, // Missing userId
          isValid: true,
        },
      ]);

      const results = await syncAllPlatforms();

      // Should not attempt to sync
      expect(mockFetchDoubanWatched).not.toHaveBeenCalled();
      expect(results).toHaveLength(0);
    });

    it("should fallback to environment variables when no credentials found", async () => {
      // No database credentials
      mockPrismaFindMany.mockResolvedValue([]);

      // Set environment variables
      process.env.BILIBILI_SESSDATA = "env-sessdata";
      process.env.BILIBILI_BILI_JCT = "env-jct";
      process.env.BILIBILI_BUVID3 = "env-buvid";
      process.env.DOUBAN_USER_ID = "env-user";
      process.env.DOUBAN_COOKIE = "env-cookie";

      mockPrismaCreate.mockResolvedValue({ id: "job-env", status: "RUNNING" });
      mockPrismaUpdate.mockResolvedValue({});
      mockFetchBilibiliHistory.mockResolvedValue([]);
      mockFetchDoubanWatched.mockResolvedValue([]);
      mockPrismaUpsert.mockResolvedValue({});

      const results = await syncAllPlatforms();

      // Verify environment variables used
      expect(mockFetchBilibiliHistory).toHaveBeenCalledWith(
        {
          sessdata: "env-sessdata",
          biliJct: "env-jct",
          buvid3: "env-buvid",
        },
        10
      );

      expect(mockFetchDoubanWatched).toHaveBeenCalledWith(
        {
          userId: "env-user",
          cookie: "env-cookie",
        },
        25
      );

      expect(results).toHaveLength(2);
    });
  });
});

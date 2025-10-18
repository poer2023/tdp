import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../route";

// Mock Prisma client
const mockSyncJobLogFindFirst = vi.fn();
const mockSyncJobFindFirst = vi.fn();

vi.mock("@/lib/prisma", () => ({
  default: {
    syncJobLog: {
      findFirst: (...args: any[]) => mockSyncJobLogFindFirst(...args),
    },
    syncJob: {
      findFirst: (...args: any[]) => mockSyncJobFindFirst(...args),
    },
  },
}));

describe("GET /api/about/sync-status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear E2E_SKIP_DB for normal testing
    vi.stubEnv("E2E_SKIP_DB", "");
  });

  it("should return sync status for all platforms", async () => {
    // Mock SyncJobLog responses for all platforms
    mockSyncJobLogFindFirst
      .mockResolvedValueOnce({
        platform: "BILIBILI",
        status: "success",
        createdAt: new Date("2025-01-15T10:00:00Z"),
      })
      .mockResolvedValueOnce({
        platform: "DOUBAN",
        status: "success",
        createdAt: new Date("2025-01-15T09:00:00Z"),
      })
      .mockResolvedValueOnce({
        platform: "STEAM",
        status: "success",
        createdAt: new Date("2025-01-15T11:00:00Z"),
      })
      .mockResolvedValueOnce({
        platform: "HOYOVERSE",
        status: "failed",
        createdAt: new Date("2025-01-14T10:00:00Z"),
      })
      .mockResolvedValueOnce({
        platform: "JELLYFIN",
        status: "success",
        createdAt: new Date("2025-01-15T08:00:00Z"),
      });

    const response = (await GET()) as Response;
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.platforms).toHaveLength(5);
    expect(data.platforms).toEqual([
      {
        platform: "bilibili",
        lastSyncAt: "2025-01-15T10:00:00.000Z",
        status: "success",
      },
      {
        platform: "douban",
        lastSyncAt: "2025-01-15T09:00:00.000Z",
        status: "success",
      },
      {
        platform: "steam",
        lastSyncAt: "2025-01-15T11:00:00.000Z",
        status: "success",
      },
      {
        platform: "hoyoverse",
        lastSyncAt: "2025-01-14T10:00:00.000Z",
        status: "failed",
      },
      {
        platform: "jellyfin",
        lastSyncAt: "2025-01-15T08:00:00.000Z",
        status: "success",
      },
    ]);
  });

  it("should fallback to SyncJob for media platforms when SyncJobLog is empty", async () => {
    // Mock SyncJobLog returns null for bilibili (media platform)
    mockSyncJobLogFindFirst
      .mockResolvedValueOnce(null) // bilibili - no SyncJobLog
      .mockResolvedValueOnce({
        platform: "DOUBAN",
        status: "success",
        createdAt: new Date("2025-01-15T09:00:00Z"),
      })
      .mockResolvedValueOnce({
        platform: "STEAM",
        status: "success",
        createdAt: new Date("2025-01-15T11:00:00Z"),
      })
      .mockResolvedValueOnce({
        platform: "HOYOVERSE",
        status: "success",
        createdAt: new Date("2025-01-15T10:00:00Z"),
      })
      .mockResolvedValueOnce({
        platform: "JELLYFIN",
        status: "success",
        createdAt: new Date("2025-01-15T08:00:00Z"),
      });

    // Mock SyncJob returns data for bilibili
    mockSyncJobFindFirst.mockResolvedValueOnce({
      platform: "bilibili",
      status: "completed",
      startedAt: new Date("2025-01-15T07:00:00Z"),
    });

    const response = (await GET()) as Response;
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.platforms).toHaveLength(5);

    // Verify bilibili data came from SyncJob fallback
    const bilibiliStatus = data.platforms.find(
      (p: any) => p.platform === "bilibili"
    );
    expect(bilibiliStatus).toEqual({
      platform: "bilibili",
      lastSyncAt: "2025-01-15T07:00:00.000Z",
      status: "completed",
    });

    // Verify SyncJob was called for bilibili
    expect(mockSyncJobFindFirst).toHaveBeenCalledWith({
      where: { platform: "bilibili" },
      orderBy: { startedAt: "desc" },
      select: { platform: true, status: true, startedAt: true },
    });
  });

  it("should exclude platforms with no sync data", async () => {
    // Mock some platforms return null
    mockSyncJobLogFindFirst
      .mockResolvedValueOnce({
        platform: "BILIBILI",
        status: "success",
        createdAt: new Date("2025-01-15T10:00:00Z"),
      })
      .mockResolvedValueOnce(null) // douban - no SyncJobLog
      .mockResolvedValueOnce({
        platform: "STEAM",
        status: "success",
        createdAt: new Date("2025-01-15T11:00:00Z"),
      })
      .mockResolvedValueOnce(null) // hoyoverse - no data
      .mockResolvedValueOnce(null); // jellyfin - no data

    // Mock SyncJob also returns null for douban (media platform fallback)
    mockSyncJobFindFirst.mockResolvedValueOnce(null);

    const response = (await GET()) as Response;
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.platforms).toHaveLength(2); // Only bilibili and steam
    expect(data.platforms).toEqual([
      {
        platform: "bilibili",
        lastSyncAt: "2025-01-15T10:00:00.000Z",
        status: "success",
      },
      {
        platform: "steam",
        lastSyncAt: "2025-01-15T11:00:00.000Z",
        status: "success",
      },
    ]);
  });

  it("should set proper cache headers", async () => {
    mockSyncJobLogFindFirst.mockResolvedValue({
      platform: "BILIBILI",
      status: "success",
      createdAt: new Date("2025-01-15T10:00:00Z"),
    });

    const response = (await GET()) as Response;

    expect(response.headers.get("Cache-Control")).toBe(
      "public, s-maxage=60, stale-while-revalidate=120"
    );
  });

  it("should handle database errors gracefully", async () => {
    mockSyncJobLogFindFirst.mockRejectedValue(
      new Error("Database connection error")
    );

    const response = (await GET()) as Response;
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.platforms).toEqual([]);
  });

  it("should query SyncJobLog with correct parameters", async () => {
    mockSyncJobLogFindFirst.mockResolvedValue({
      platform: "BILIBILI",
      status: "success",
      createdAt: new Date("2025-01-15T10:00:00Z"),
    });

    await GET();

    // Verify first call (bilibili)
    expect(mockSyncJobLogFindFirst).toHaveBeenNthCalledWith(1, {
      where: { platform: "BILIBILI" },
      orderBy: { createdAt: "desc" },
      select: { platform: true, status: true, createdAt: true },
    });
  });

  it("should convert platform names to lowercase", async () => {
    mockSyncJobLogFindFirst
      .mockResolvedValueOnce({
        platform: "BILIBILI",
        status: "success",
        createdAt: new Date("2025-01-15T10:00:00Z"),
      })
      .mockResolvedValueOnce({
        platform: "STEAM",
        status: "success",
        createdAt: new Date("2025-01-15T11:00:00Z"),
      })
      .mockResolvedValue(null);

    const response = (await GET()) as Response;
    const data = await response.json();

    // All platform names should be lowercase
    data.platforms.forEach((platform: any) => {
      expect(platform.platform).toBe(platform.platform.toLowerCase());
    });
  });

  it("should return data in JSON format", async () => {
    mockSyncJobLogFindFirst.mockResolvedValue({
      platform: "STEAM",
      status: "success",
      createdAt: new Date("2025-01-15T10:00:00Z"),
    });

    const response = (await GET()) as Response;
    const contentType = response.headers.get("Content-Type");

    expect(contentType).toContain("application/json");
  });

  it("should handle all platforms returning null gracefully", async () => {
    mockSyncJobLogFindFirst.mockResolvedValue(null);
    mockSyncJobFindFirst.mockResolvedValue(null);

    const response = (await GET()) as Response;
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.platforms).toEqual([]); // Empty array, no platforms
  });

  it("should preserve status values from database", async () => {
    const testStatuses = ["success", "failed", "running", "pending"];

    for (const status of testStatuses) {
      vi.clearAllMocks();

      // Mock all 5 platforms, only steam returns the test status
      mockSyncJobLogFindFirst
        .mockResolvedValueOnce(null) // bilibili
        .mockResolvedValueOnce(null) // douban
        .mockResolvedValueOnce({
          platform: "STEAM",
          status: status,
          createdAt: new Date("2025-01-15T10:00:00Z"),
        }) // steam - test target
        .mockResolvedValueOnce(null) // hoyoverse
        .mockResolvedValueOnce(null); // jellyfin

      const response = (await GET()) as Response;
      const data = await response.json();

      const steamStatus = data.platforms.find(
        (p: any) => p.platform === "steam"
      );
      expect(steamStatus?.status).toBe(status);
    }
  });

  it("should format timestamps as ISO strings", async () => {
    const testDate = new Date("2025-01-15T10:30:45.123Z");

    mockSyncJobLogFindFirst
      .mockResolvedValueOnce({
        platform: "BILIBILI",
        status: "success",
        createdAt: testDate,
      })
      .mockResolvedValue(null); // Other platforms return null

    const response = (await GET()) as Response;
    const data = await response.json();

    const bilibiliStatus = data.platforms.find(
      (p: any) => p.platform === "bilibili"
    );
    expect(bilibiliStatus?.lastSyncAt).toBe(testDate.toISOString());
  });

  it("should skip database queries when E2E_SKIP_DB is set", async () => {
    vi.stubEnv("E2E_SKIP_DB", "1");

    const response = (await GET()) as Response;
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.platforms).toEqual([]);

    // Verify no database queries were made
    expect(mockSyncJobLogFindFirst).not.toHaveBeenCalled();
    expect(mockSyncJobFindFirst).not.toHaveBeenCalled();
  });

  it("should skip database queries when E2E_SKIP_DB is true", async () => {
    vi.stubEnv("E2E_SKIP_DB", "true");

    const response = (await GET()) as Response;
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.platforms).toEqual([]);

    // Verify no database queries were made
    expect(mockSyncJobLogFindFirst).not.toHaveBeenCalled();
    expect(mockSyncJobFindFirst).not.toHaveBeenCalled();
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../route";
import { NextRequest } from "next/server";

// Mock external dependencies
const mockPrismaFindMany = vi.fn();
const mockSyncMedia = vi.fn();
const mockGamingSyncService = vi.fn();

vi.mock("@/lib/prisma", () => ({
  default: {
    externalCredential: {
      findMany: (...args: any[]) => mockPrismaFindMany(...args),
    },
  },
}));

vi.mock("@/lib/media-sync", () => ({
  syncAllPlatforms: (...args: any[]) => mockSyncMedia(...args),
}));

vi.mock("@/lib/gaming/sync-service", () => ({
  GamingSyncService: vi.fn(() => ({
    syncSteamData: mockGamingSyncService,
    syncZZZData: mockGamingSyncService,
  })),
}));

vi.mock("@/lib/encryption", () => ({
  decryptCredential: vi.fn((data: string) => data), // Pass-through for testing
  isEncrypted: vi.fn(() => false),
}));

// Test environment variables
const TEST_CRON_SECRET = "test-cron-secret-12345";

describe("GET /api/cron/sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CRON_SECRET", TEST_CRON_SECRET);
  });

  it("should reject unauthorized requests without CRON_SECRET", async () => {
    const request = new NextRequest("http://localhost:3000/api/cron/sync");

    const response = (await GET(request)) as Response;
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should reject requests with incorrect CRON_SECRET", async () => {
    const request = new NextRequest("http://localhost:3000/api/cron/sync", {
      headers: {
        Authorization: "Bearer wrong-secret",
      },
    });

    const response = (await GET(request)) as Response;
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should accept authorized requests with correct CRON_SECRET", async () => {
    mockPrismaFindMany.mockResolvedValue([]);

    const request = new NextRequest("http://localhost:3000/api/cron/sync", {
      headers: {
        Authorization: `Bearer ${TEST_CRON_SECRET}`,
      },
    });

    const response = (await GET(request)) as Response;

    expect(response.status).toBe(200);
  });

  it("should return empty summary when no credentials with autoSync enabled", async () => {
    mockPrismaFindMany.mockResolvedValue([]);

    const request = new NextRequest("http://localhost:3000/api/cron/sync", {
      headers: {
        Authorization: `Bearer ${TEST_CRON_SECRET}`,
      },
    });

    const response = (await GET(request)) as Response;
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.summary.totalCredentials).toBe(0);
    expect(data.summary.synced).toBe(0);
    expect(data.summary.skipped).toBe(0);
  });

  it("should sync credentials due for hourly frequency", async () => {
    const oneHourAgo = new Date(Date.now() - 61 * 60 * 1000); // 61 minutes ago

    mockPrismaFindMany.mockResolvedValue([
      {
        id: "cred-1",
        platform: "STEAM",
        value: "encrypted-credential",
        metadata: { steamId: "12345" },
        syncFrequency: "hourly",
        syncJobLogs: [{ createdAt: oneHourAgo }],
        syncJobs: [],
      },
    ]);

    mockGamingSyncService.mockResolvedValue({
      success: true,
      platform: "steam",
      message: "Synced successfully",
    });

    const request = new NextRequest("http://localhost:3000/api/cron/sync", {
      headers: {
        Authorization: `Bearer ${TEST_CRON_SECRET}`,
      },
    });

    const response = (await GET(request)) as Response;
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.summary.totalCredentials).toBe(1);
    expect(data.summary.synced).toBe(1);
    expect(data.summary.succeeded).toBe(1);
  });

  it("should skip credentials synced within hourly threshold", async () => {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    mockPrismaFindMany.mockResolvedValue([
      {
        id: "cred-1",
        platform: "STEAM",
        value: "encrypted-credential",
        metadata: { steamId: "12345" },
        syncFrequency: "hourly",
        syncJobLogs: [{ createdAt: thirtyMinutesAgo }],
        syncJobs: [],
      },
    ]);

    const request = new NextRequest("http://localhost:3000/api/cron/sync", {
      headers: {
        Authorization: `Bearer ${TEST_CRON_SECRET}`,
      },
    });

    const response = (await GET(request)) as Response;
    const data = await response.json();

    expect(data.summary.skipped).toBe(1);
    expect(data.summary.synced).toBe(0);
  });

  it("should sync credentials due for daily frequency", async () => {
    const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);

    mockPrismaFindMany.mockResolvedValue([
      {
        id: "cred-1",
        platform: "BILIBILI",
        value: "mock-credential",
        syncFrequency: "daily",
        syncJobLogs: [{ createdAt: twentyFiveHoursAgo }],
        syncJobs: [],
      },
    ]);

    mockSyncMedia.mockResolvedValue([
      { platform: "bilibili", success: true, message: "Synced" },
    ]);

    const request = new NextRequest("http://localhost:3000/api/cron/sync", {
      headers: {
        Authorization: `Bearer ${TEST_CRON_SECRET}`,
      },
    });

    const response = (await GET(request)) as Response;
    const data = await response.json();

    expect(data.summary.synced).toBe(1);
    expect(data.summary.succeeded).toBe(1);
  });

  it("should sync credentials due for weekly frequency", async () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);

    mockPrismaFindMany.mockResolvedValue([
      {
        id: "cred-1",
        platform: "DOUBAN",
        value: "mock-credential",
        syncFrequency: "weekly",
        syncJobLogs: [{ createdAt: eightDaysAgo }],
        syncJobs: [],
      },
    ]);

    mockSyncMedia.mockResolvedValue([
      { platform: "douban", success: true, message: "Synced" },
    ]);

    const request = new NextRequest("http://localhost:3000/api/cron/sync", {
      headers: {
        Authorization: `Bearer ${TEST_CRON_SECRET}`,
      },
    });

    const response = (await GET(request)) as Response;
    const data = await response.json();

    expect(data.summary.synced).toBe(1);
    expect(data.summary.succeeded).toBe(1);
  });

  it("should skip credentials with disabled frequency", async () => {
    mockPrismaFindMany.mockResolvedValue([
      {
        id: "cred-1",
        platform: "STEAM",
        value: "mock",
        syncFrequency: "disabled",
        syncJobLogs: [],
        syncJobs: [],
      },
    ]);

    const request = new NextRequest("http://localhost:3000/api/cron/sync", {
      headers: {
        Authorization: `Bearer ${TEST_CRON_SECRET}`,
      },
    });

    const response = (await GET(request)) as Response;
    const data = await response.json();

    expect(data.summary.skipped).toBe(1);
    expect(data.summary.synced).toBe(0);
  });

  it("should sync never-synced credentials", async () => {
    mockPrismaFindMany.mockResolvedValue([
      {
        id: "cred-1",
        platform: "STEAM",
        value: "encrypted-credential",
        metadata: { steamId: "12345" },
        syncFrequency: "daily",
        syncJobLogs: [], // No previous sync
        syncJobs: [],
      },
    ]);

    mockGamingSyncService.mockResolvedValue({
      success: true,
      platform: "steam",
      message: "First sync",
    });

    const request = new NextRequest("http://localhost:3000/api/cron/sync", {
      headers: {
        Authorization: `Bearer ${TEST_CRON_SECRET}`,
      },
    });

    const response = (await GET(request)) as Response;
    const data = await response.json();

    expect(data.summary.synced).toBe(1);
    expect(data.summary.succeeded).toBe(1);

    // Verify schedule has correct reason
    const schedule = data.schedules.find(
      (s: any) => s.credentialId === "cred-1"
    );
    expect(schedule?.reason).toContain("Never synced before");
  });

  it("should handle sync failures gracefully", async () => {
    mockPrismaFindMany.mockResolvedValue([
      {
        id: "cred-1",
        platform: "STEAM",
        value: "encrypted-credential",
        metadata: { steamId: "12345" },
        syncFrequency: "hourly",
        syncJobLogs: [{ createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) }],
        syncJobs: [],
      },
    ]);

    mockGamingSyncService.mockResolvedValue({
      success: false,
      platform: "steam",
      message: "API error",
    });

    const request = new NextRequest("http://localhost:3000/api/cron/sync", {
      headers: {
        Authorization: `Bearer ${TEST_CRON_SECRET}`,
      },
    });

    const response = (await GET(request)) as Response;
    const data = await response.json();

    expect(data.success).toBe(true); // Overall endpoint success
    expect(data.summary.failed).toBe(1);
    expect(data.summary.succeeded).toBe(0);
  });

  it("should include execution duration in response", async () => {
    mockPrismaFindMany.mockResolvedValue([]);

    const request = new NextRequest("http://localhost:3000/api/cron/sync", {
      headers: {
        Authorization: `Bearer ${TEST_CRON_SECRET}`,
      },
    });

    const response = (await GET(request)) as Response;
    const data = await response.json();

    expect(data.duration).toBeTypeOf("number");
    expect(data.duration).toBeGreaterThanOrEqual(0);
  });

  it("should query credentials with correct filters", async () => {
    mockPrismaFindMany.mockResolvedValue([]);

    const request = new NextRequest("http://localhost:3000/api/cron/sync", {
      headers: {
        Authorization: `Bearer ${TEST_CRON_SECRET}`,
      },
    });

    await GET(request);

    expect(mockPrismaFindMany).toHaveBeenCalledWith({
      where: {
        isValid: true,
        autoSync: true,
      },
      include: {
        syncJobLogs: { orderBy: { createdAt: "desc" }, take: 1 },
        syncJobs: { orderBy: { startedAt: "desc" }, take: 1 },
      },
    });
  });

  it("should return detailed schedule information for each credential", async () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    mockPrismaFindMany.mockResolvedValue([
      {
        id: "cred-1",
        platform: "STEAM",
        value: "encrypted-credential",
        metadata: { steamId: "12345" },
        syncFrequency: "hourly",
        syncJobLogs: [{ createdAt: twoHoursAgo }],
        syncJobs: [],
      },
    ]);

    mockGamingSyncService.mockResolvedValue({
      success: true,
      platform: "steam",
    });

    const request = new NextRequest("http://localhost:3000/api/cron/sync", {
      headers: {
        Authorization: `Bearer ${TEST_CRON_SECRET}`,
      },
    });

    const response = (await GET(request)) as Response;
    const data = await response.json();

    expect(data.schedules).toHaveLength(1);
    expect(data.schedules[0]).toMatchObject({
      credentialId: "cred-1",
      platform: "STEAM",
      frequency: "hourly",
      shouldSync: true,
    });
    expect(data.schedules[0].reason).toBeDefined();
  });
});

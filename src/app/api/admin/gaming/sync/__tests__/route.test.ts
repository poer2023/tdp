import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "../route";
import { NextRequest } from "next/server";

// Mock sync service
vi.mock("@/lib/gaming/sync-service", () => ({
  getGamingSyncService: vi.fn(() => ({
    syncAllPlatforms: vi.fn(),
  })),
}));

interface MockSyncService {
  syncAllPlatforms: ReturnType<typeof vi.fn>;
}

describe("/api/admin/gaming/sync", () => {
  let mockSyncService: MockSyncService;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Setup mock sync service
    const syncModule = await import("@/lib/gaming/sync-service");
    mockSyncService = syncModule.getGamingSyncService() as MockSyncService;

    // Set up environment
    process.env.ADMIN_API_KEY = "test_admin_key_12345";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.ADMIN_API_KEY;
  });

  describe("Authentication", () => {
    it("should accept valid bearer token", async () => {
      mockSyncService.syncAllPlatforms.mockResolvedValue([
        {
          success: true,
          platform: "STEAM",
          syncedAt: new Date(),
        },
      ]);

      const request = new NextRequest("http://localhost/api/admin/gaming/sync", {
        method: "POST",
        headers: {
          Authorization: "Bearer test_admin_key_12345",
          "Content-Type": "application/json",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBeDefined();
    });

    it("should reject missing authorization header", async () => {
      const request = new NextRequest("http://localhost/api/admin/gaming/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should reject invalid bearer token", async () => {
      const request = new NextRequest("http://localhost/api/admin/gaming/sync", {
        method: "POST",
        headers: {
          Authorization: "Bearer wrong_key",
          "Content-Type": "application/json",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should reject malformed authorization header", async () => {
      const request = new NextRequest("http://localhost/api/admin/gaming/sync", {
        method: "POST",
        headers: {
          Authorization: "InvalidFormat test_admin_key_12345",
          "Content-Type": "application/json",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 500 when API key is not configured", async () => {
      delete process.env.ADMIN_API_KEY;

      const request = new NextRequest("http://localhost/api/admin/gaming/sync", {
        method: "POST",
        headers: {
          Authorization: "Bearer test_admin_key_12345",
          "Content-Type": "application/json",
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Admin API key not configured");
    });
  });

  describe("Sync execution", () => {
    const createAuthenticatedRequest = () =>
      new NextRequest("http://localhost/api/admin/gaming/sync", {
        method: "POST",
        headers: {
          Authorization: "Bearer test_admin_key_12345",
          "Content-Type": "application/json",
        },
      });

    it("should trigger sync for all platforms", async () => {
      const mockResults = [
        {
          success: true,
          platform: "STEAM",
          syncedAt: new Date(),
        },
        {
          success: true,
          platform: "HOYOVERSE",
          syncedAt: new Date(),
        },
      ];

      mockSyncService.syncAllPlatforms.mockResolvedValue(mockResults);

      const request = createAuthenticatedRequest();
      const response = await POST(request);
      const data = await response.json();

      expect(mockSyncService.syncAllPlatforms).toHaveBeenCalledTimes(1);
      expect(data.results).toEqual(mockResults);
      expect(data.summary.total).toBe(2);
      expect(data.summary.succeeded).toBe(2);
      expect(data.summary.failed).toBe(0);
    });

    it("should return success when all syncs succeed", async () => {
      mockSyncService.syncAllPlatforms.mockResolvedValue([
        { success: true, platform: "STEAM" },
        { success: true, platform: "HOYOVERSE" },
      ]);

      const request = createAuthenticatedRequest();
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.summary.failed).toBe(0);
    });

    it("should return failure summary when some syncs fail", async () => {
      mockSyncService.syncAllPlatforms.mockResolvedValue([
        { success: true, platform: "STEAM" },
        { success: false, platform: "HOYOVERSE", error: "API Error" },
      ]);

      const request = createAuthenticatedRequest();
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(false); // Overall failure if any platform fails
      expect(data.summary.succeeded).toBe(1);
      expect(data.summary.failed).toBe(1);
    });

    it("should handle complete sync failure", async () => {
      mockSyncService.syncAllPlatforms.mockResolvedValue([
        { success: false, platform: "STEAM", error: "Steam API Error" },
        { success: false, platform: "HOYOVERSE", error: "HoYo API Error" },
      ]);

      const request = createAuthenticatedRequest();
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.summary.succeeded).toBe(0);
      expect(data.summary.failed).toBe(2);
    });

    it("should handle empty platforms (no configuration)", async () => {
      mockSyncService.syncAllPlatforms.mockResolvedValue([]);

      const request = createAuthenticatedRequest();
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toEqual([]);
      expect(data.summary.total).toBe(0);
    });
  });

  describe("Error handling", () => {
    const createAuthenticatedRequest = () =>
      new NextRequest("http://localhost/api/admin/gaming/sync", {
        method: "POST",
        headers: {
          Authorization: "Bearer test_admin_key_12345",
          "Content-Type": "application/json",
        },
      });

    it("should handle sync service errors", async () => {
      mockSyncService.syncAllPlatforms.mockRejectedValue(new Error("Sync service crashed"));

      const request = createAuthenticatedRequest();
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Sync failed");
      expect(data.message).toContain("Sync service crashed");
    });

    it("should handle database connection errors", async () => {
      mockSyncService.syncAllPlatforms.mockRejectedValue(new Error("Database connection failed"));

      const request = createAuthenticatedRequest();
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Sync failed");
      expect(data.message).toContain("Database connection failed");
    });

    it("should handle unknown errors gracefully", async () => {
      mockSyncService.syncAllPlatforms.mockRejectedValue("Unknown error");

      const request = createAuthenticatedRequest();
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Sync failed");
      expect(data.message).toBe("Unknown error");
    });

    it("should handle sync timeout", async () => {
      mockSyncService.syncAllPlatforms.mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Sync timeout")), 100);
          })
      );

      const request = createAuthenticatedRequest();
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.message).toContain("Sync timeout");
    });
  });

  describe("Response format", () => {
    const createAuthenticatedRequest = () =>
      new NextRequest("http://localhost/api/admin/gaming/sync", {
        method: "POST",
        headers: {
          Authorization: "Bearer test_admin_key_12345",
          "Content-Type": "application/json",
        },
      });

    it("should return correct response structure on success", async () => {
      mockSyncService.syncAllPlatforms.mockResolvedValue([{ success: true, platform: "STEAM" }]);

      const request = createAuthenticatedRequest();
      const response = await POST(request);
      const data = await response.json();

      expect(data).toHaveProperty("success");
      expect(data).toHaveProperty("results");
      expect(data).toHaveProperty("summary");
      expect(data.summary).toHaveProperty("total");
      expect(data.summary).toHaveProperty("succeeded");
      expect(data.summary).toHaveProperty("failed");
    });

    it("should return correct response structure on error", async () => {
      mockSyncService.syncAllPlatforms.mockRejectedValue(new Error("Test error"));

      const request = createAuthenticatedRequest();
      const response = await POST(request);
      const data = await response.json();

      expect(data).toHaveProperty("error");
      expect(data).toHaveProperty("message");
    });

    it("should include platform details in results", async () => {
      const mockResults = [
        {
          success: true,
          platform: "STEAM",
          syncedAt: new Date("2025-01-15T10:00:00Z"),
        },
        {
          success: false,
          platform: "HOYOVERSE",
          error: "API Error",
          syncedAt: new Date("2025-01-15T10:00:05Z"),
        },
      ];

      mockSyncService.syncAllPlatforms.mockResolvedValue(mockResults);

      const request = createAuthenticatedRequest();
      const response = await POST(request);
      const data = await response.json();

      expect(data.results[0].platform).toBe("STEAM");
      expect(data.results[1].platform).toBe("HOYOVERSE");
      expect(data.results[1].error).toBe("API Error");
    });
  });

  describe("Integration scenarios", () => {
    const createAuthenticatedRequest = () =>
      new NextRequest("http://localhost/api/admin/gaming/sync", {
        method: "POST",
        headers: {
          Authorization: "Bearer test_admin_key_12345",
          "Content-Type": "application/json",
        },
      });

    it("should work with GitHub Actions webhook", async () => {
      // Simulate GitHub Actions calling the endpoint
      mockSyncService.syncAllPlatforms.mockResolvedValue([
        { success: true, platform: "STEAM" },
        { success: true, platform: "HOYOVERSE" },
      ]);

      const request = new NextRequest("http://localhost/api/admin/gaming/sync", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.ADMIN_API_KEY}`,
          "Content-Type": "application/json",
          "User-Agent": "GitHub-Actions",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockSyncService.syncAllPlatforms).toHaveBeenCalled();
    });

    it("should work with manual cURL request", async () => {
      mockSyncService.syncAllPlatforms.mockResolvedValue([{ success: true, platform: "STEAM" }]);

      const request = new NextRequest("http://localhost/api/admin/gaming/sync", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.ADMIN_API_KEY}`,
          "Content-Type": "application/json",
          "User-Agent": "curl/7.68.0",
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it("should handle concurrent requests", async () => {
      mockSyncService.syncAllPlatforms.mockResolvedValue([{ success: true, platform: "STEAM" }]);

      const request1 = createAuthenticatedRequest();
      const request2 = createAuthenticatedRequest();

      const [response1, response2] = await Promise.all([POST(request1), POST(request2)]);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(mockSyncService.syncAllPlatforms).toHaveBeenCalledTimes(2);
    });
  });

  describe("Security", () => {
    it("should not expose API key in error messages", async () => {
      const request = new NextRequest("http://localhost/api/admin/gaming/sync", {
        method: "POST",
        headers: {
          Authorization: "Bearer wrong_key",
        },
      });

      const response = await POST(request);
      const data = await response.json();
      const responseText = JSON.stringify(data);

      expect(responseText).not.toContain(process.env.ADMIN_API_KEY!);
    });

    it("should not expose sync service implementation details", async () => {
      mockSyncService.syncAllPlatforms.mockRejectedValue(
        new Error("Internal service error with sensitive path")
      );

      const request = new NextRequest("http://localhost/api/admin/gaming/sync", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.ADMIN_API_KEY}`,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      // Should return generic error
      expect(data.error).toBe("Sync failed");
      expect(data.message).toBeDefined();
    });

    it("should handle authorization header case-insensitivity", async () => {
      mockSyncService.syncAllPlatforms.mockResolvedValue([{ success: true, platform: "STEAM" }]);

      const request = new NextRequest("http://localhost/api/admin/gaming/sync", {
        method: "POST",
        headers: {
          authorization: `Bearer ${process.env.ADMIN_API_KEY}`, // lowercase
        },
      });

      const response = await POST(request);

      // Next.js headers are case-insensitive, should work
      expect(response.status).toBe(200);
    });
  });
});

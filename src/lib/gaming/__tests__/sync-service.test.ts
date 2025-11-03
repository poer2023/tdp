import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GamingSyncService, getGamingSyncService } from "../sync-service";
import type { SteamAPIClient } from "../steam-client";
import type { HoYoAPIClient } from "../hoyo-client";
import type { PrismaClient } from "@prisma/client";

// Mock Prisma client with comprehensive type-safe mock
// Inline mockDeep to avoid hoisting issues with vi.mock
vi.mock("@/lib/prisma", async () => {
  const { mockDeep } = await import("vitest-mock-extended");
  const { PrismaClient } = await import("@prisma/client");
  return {
    default: mockDeep<PrismaClient>(),
  };
});

// Mock API clients
vi.mock("../steam-client");
vi.mock("../hoyo-client");

describe("GamingSyncService", () => {
  let service: GamingSyncService;
  let mockSteamClient: Partial<SteamAPIClient>;
  let mockHoYoClient: Partial<HoYoAPIClient>;
  let mockPrisma: typeof import("@/lib/prisma").default;

  const mockSteamId = "76561198012345678";
  const mockHoYoUid = "100123456";

  beforeEach(async () => {
    vi.clearAllMocks();

    // Setup mock Prisma
    const prismaModule = await import("@/lib/prisma");
    mockPrisma = prismaModule.default;

    // Configure externalCredential mock (critical for syncAllPlatforms)
    // Cast to DeepMockProxy to access mock methods
    const { DeepMockProxy } = await import("vitest-mock-extended");
    (mockPrisma as any).externalCredential.findMany.mockResolvedValue([]);

    // Setup mock Steam client
    mockSteamClient = {
      getPlayerSummary: vi.fn(),
      getOwnedGames: vi.fn(),
      getRecentlyPlayedGames: vi.fn(),
      getPlayerAchievements: vi.fn(),
    };

    // Setup mock HoYo client
    mockHoYoClient = {
      getZZZIndex: vi.fn(),
      getZZZShiyuDefence: vi.fn(),
      estimatePlaytime: vi.fn(),
      calculateActivityScore: vi.fn(),
    };

    // Create service instance with mocked dependencies
    service = new GamingSyncService();
    // Inject mocks (you may need to adjust this based on actual implementation)
    (service as unknown as { steamClient: Partial<SteamAPIClient> }).steamClient = mockSteamClient;
    (service as unknown as { hoyoClient: Partial<HoYoAPIClient> }).hoyoClient = mockHoYoClient;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("syncSteamData", () => {
    it("should sync Steam data successfully", async () => {
      // Mock Steam API responses
      mockSteamClient.getPlayerSummary = vi.fn().mockResolvedValue({
        steamId: mockSteamId,
        personaName: "TestUser",
        profileUrl: "https://steamcommunity.com/id/testuser",
        avatar: "https://avatar.url/test.jpg",
      });

      mockSteamClient.getOwnedGames = vi.fn().mockResolvedValue([
        {
          appId: 730,
          name: "Counter-Strike: Global Offensive",
          playtimeForever: 12000,
          playtime2Weeks: 120,
        },
      ]);

      mockSteamClient.getRecentlyPlayedGames = vi.fn().mockResolvedValue([
        {
          appId: 730,
          name: "Counter-Strike: Global Offensive",
          playtimeForever: 12000,
          playtime2Weeks: 120,
        },
      ]);

      mockSteamClient.getPlayerAchievements = vi.fn().mockResolvedValue([
        {
          apiName: "WIN_BOMB_PLANT",
          achieved: true,
          unlockTime: 1609459200,
          name: "Win Bomb Plant",
        },
      ]);

      // Mock Prisma operations
      mockPrisma.steamProfile.upsert.mockResolvedValue({
        id: "profile_1",
        steamId: mockSteamId,
      });

      mockPrisma.game.upsert.mockResolvedValue({
        id: "game_1",
        platformId: "730",
        platform: "STEAM",
      });

      mockPrisma.gameSession.findFirst.mockResolvedValue(null);
      mockPrisma.gameSession.create.mockResolvedValue({
        id: "session_1",
      });

      mockPrisma.gameAchievement.upsert.mockResolvedValue({
        id: "achievement_1",
      });

      mockPrisma.gamingSyncLog.create.mockResolvedValue({
        id: "log_1",
        status: "RUNNING",
      });

      mockPrisma.gamingSyncLog.update.mockResolvedValue({
        id: "log_1",
        status: "SUCCESS",
      });

      const result = await service.syncSteamData(mockSteamId);

      expect(result.success).toBe(true);
      expect(result.platform).toBe("STEAM");
      expect(mockPrisma.steamProfile.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { steamId: mockSteamId },
        })
      );
      expect(mockPrisma.game.upsert).toHaveBeenCalled();
      expect(mockPrisma.gameSession.create).toHaveBeenCalled();
      expect(mockPrisma.gameAchievement.upsert).toHaveBeenCalled();
    });

    it("should handle Steam API failure gracefully", async () => {
      mockSteamClient.getPlayerSummary = vi.fn().mockRejectedValue(new Error("Steam API Error"));

      mockPrisma.gamingSyncLog.create.mockResolvedValue({
        id: "log_1",
        status: "RUNNING",
      });

      mockPrisma.gamingSyncLog.update.mockResolvedValue({
        id: "log_1",
        status: "FAILED",
      });

      const result = await service.syncSteamData(mockSteamId);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Steam API Error");
      expect(mockPrisma.gamingSyncLog.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "FAILED",
          }),
        })
      );
    });

    it("should handle no recent games", async () => {
      mockSteamClient.getPlayerSummary = vi.fn().mockResolvedValue({
        steamId: mockSteamId,
        personaName: "TestUser",
      });

      mockSteamClient.getOwnedGames = vi.fn().mockResolvedValue([]);
      mockSteamClient.getRecentlyPlayedGames = vi.fn().mockResolvedValue([]);

      mockPrisma.steamProfile.upsert.mockResolvedValue({
        id: "profile_1",
      });

      mockPrisma.gamingSyncLog.create.mockResolvedValue({
        id: "log_1",
      });

      mockPrisma.gamingSyncLog.update.mockResolvedValue({
        id: "log_1",
        status: "SUCCESS",
      });

      const result = await service.syncSteamData(mockSteamId);

      expect(result.success).toBe(true);
      expect(mockPrisma.gameSession.create).not.toHaveBeenCalled();
    });

    it("should skip achievements for games without any", async () => {
      mockSteamClient.getPlayerSummary = vi.fn().mockResolvedValue({
        steamId: mockSteamId,
        personaName: "TestUser",
      });

      mockSteamClient.getOwnedGames = vi.fn().mockResolvedValue([
        {
          appId: 999,
          name: "Game Without Achievements",
          playtimeForever: 100,
        },
      ]);

      mockSteamClient.getRecentlyPlayedGames = vi.fn().mockResolvedValue([]);
      mockSteamClient.getPlayerAchievements = vi.fn().mockResolvedValue([]);

      mockPrisma.steamProfile.upsert.mockResolvedValue({ id: "profile_1" });
      mockPrisma.game.upsert.mockResolvedValue({ id: "game_1" });
      mockPrisma.gamingSyncLog.create.mockResolvedValue({ id: "log_1" });
      mockPrisma.gamingSyncLog.update.mockResolvedValue({ id: "log_1" });

      const result = await service.syncSteamData(mockSteamId);

      expect(result.success).toBe(true);
      expect(mockPrisma.gameAchievement.upsert).not.toHaveBeenCalled();
    });
  });

  describe("syncZZZData", () => {
    it("should sync ZZZ data successfully", async () => {
      const mockIndexData = {
        stats: {
          active_days: 45,
          avatar_num: 12,
          world_level_name: "绳网等级 40",
          cur_head_icon_url: "https://example.com/avatar.png",
        },
        avatar_list: [
          {
            id: 1,
            name_mi18n: "丽娜",
            full_name_mi18n: "丽娜·路易斯",
            rarity: "S",
            element_type: 1,
          },
          {
            id: 2,
            name_mi18n: "安比",
            full_name_mi18n: "安比·德玛拉",
            rarity: "A",
            element_type: 2,
          },
        ],
      };

      const mockShiyuData = {
        has_data: true,
        ratings: { "1": 1 },
        floors: [{ floor_id: 1, rating: "S" }],
      };

      mockHoYoClient.getZZZIndex = vi.fn().mockResolvedValue(mockIndexData);
      mockHoYoClient.getZZZShiyuDefence = vi.fn().mockResolvedValue(mockShiyuData);
      mockHoYoClient.estimatePlaytime = vi.fn().mockReturnValue({
        estimatedHours: 108,
        confidence: "high",
      });
      mockHoYoClient.calculateActivityScore = vi.fn().mockReturnValue(85);

      mockPrisma.hoyoProfile.upsert.mockResolvedValue({
        id: "hoyo_profile_1",
        uid: mockHoYoUid,
      });

      mockPrisma.game.upsert.mockResolvedValue({
        id: "zzz_game_1",
        platformId: "zzz",
        platform: "HOYOVERSE",
      });

      mockPrisma.gameSession.create.mockResolvedValue({
        id: "session_1",
      });

      mockPrisma.gamingSyncLog.create.mockResolvedValue({
        id: "log_1",
      });

      mockPrisma.gamingSyncLog.update.mockResolvedValue({
        id: "log_1",
        status: "SUCCESS",
      });

      const result = await service.syncZZZData(mockHoYoUid);

      expect(result.success).toBe(true);
      expect(result.platform).toBe("HOYOVERSE");
      expect(mockPrisma.hoyoProfile.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { uid: mockHoYoUid },
        })
      );
      expect(mockPrisma.game.upsert).toHaveBeenCalled();
      expect(mockHoYoClient.estimatePlaytime).toHaveBeenCalledWith(mockIndexData);
    });

    it("should handle HoYo API failure gracefully", async () => {
      mockHoYoClient.getZZZIndex = vi.fn().mockRejectedValue(new Error("HoYo API Error"));

      mockPrisma.gamingSyncLog.create.mockResolvedValue({
        id: "log_1",
      });

      mockPrisma.gamingSyncLog.update.mockResolvedValue({
        id: "log_1",
        status: "FAILED",
      });

      const result = await service.syncZZZData(mockHoYoUid);

      expect(result.success).toBe(false);
      expect(result.error).toContain("HoYo API Error");
    });

    it("should handle missing Shiyu Defence data", async () => {
      const mockIndexData = {
        stats: {
          active_days: 10,
          avatar_num: 3,
          world_level_name: "绳网等级 10",
          cur_head_icon_url: "",
        },
        avatar_list: [],
      };

      mockHoYoClient.getZZZIndex = vi.fn().mockResolvedValue(mockIndexData);
      mockHoYoClient.getZZZShiyuDefence = vi.fn().mockResolvedValue(null);
      mockHoYoClient.estimatePlaytime = vi.fn().mockReturnValue({
        estimatedHours: 18,
        confidence: "medium",
      });
      mockHoYoClient.calculateActivityScore = vi.fn().mockReturnValue(35);

      mockPrisma.hoyoProfile.upsert.mockResolvedValue({ id: "profile_1" });
      mockPrisma.game.upsert.mockResolvedValue({ id: "game_1" });
      mockPrisma.gameSession.create.mockResolvedValue({ id: "session_1" });
      mockPrisma.gamingSyncLog.create.mockResolvedValue({ id: "log_1" });
      mockPrisma.gamingSyncLog.update.mockResolvedValue({ id: "log_1" });

      const result = await service.syncZZZData(mockHoYoUid);

      expect(result.success).toBe(true);
      expect(mockHoYoClient.calculateActivityScore).toHaveBeenCalledWith(mockIndexData, null);
    });

    it("should create game sessions with estimated playtime", async () => {
      const mockIndexData = {
        stats: {
          active_days: 30,
          avatar_num: 8,
          world_level_name: "绳网等级 30",
          cur_head_icon_url: "",
        },
        avatar_list: [],
      };

      mockHoYoClient.getZZZIndex = vi.fn().mockResolvedValue(mockIndexData);
      mockHoYoClient.getZZZShiyuDefence = vi.fn().mockResolvedValue(null);
      mockHoYoClient.estimatePlaytime = vi.fn().mockReturnValue({
        estimatedHours: 55,
        confidence: "medium",
      });

      mockPrisma.hoyoProfile.upsert.mockResolvedValue({ id: "profile_1" });
      mockPrisma.game.upsert.mockResolvedValue({ id: "game_1" });
      mockPrisma.gameSession.create.mockResolvedValue({ id: "session_1" });
      mockPrisma.gamingSyncLog.create.mockResolvedValue({ id: "log_1" });
      mockPrisma.gamingSyncLog.update.mockResolvedValue({ id: "log_1" });

      const result = await service.syncZZZData(mockHoYoUid);

      expect(result.success).toBe(true);
      expect(mockPrisma.gameSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            duration: 55 * 60, // Hours to minutes
          }),
        })
      );
    });
  });

  describe("syncAllPlatforms", () => {
    it("should sync all platforms successfully", async () => {
      process.env.STEAM_USER_ID = mockSteamId;
      process.env.HOYO_UID = mockHoYoUid;

      // Mock successful Steam sync
      vi.spyOn(service, "syncSteamData").mockResolvedValue({
        success: true,
        platform: "STEAM",
        syncedAt: new Date(),
      });

      // Mock successful ZZZ sync
      vi.spyOn(service, "syncZZZData").mockResolvedValue({
        success: true,
        platform: "HOYOVERSE",
        syncedAt: new Date(),
      });

      const results = await service.syncAllPlatforms();

      expect(results).toHaveLength(2);
      expect(results[0].platform).toBe("STEAM");
      expect(results[1].platform).toBe("HOYOVERSE");
      expect(results.every((r) => r.success)).toBe(true);
    });

    it("should handle partial platform failures", async () => {
      process.env.STEAM_USER_ID = mockSteamId;
      process.env.HOYO_UID = mockHoYoUid;

      vi.spyOn(service, "syncSteamData").mockResolvedValue({
        success: true,
        platform: "STEAM",
        syncedAt: new Date(),
      });

      vi.spyOn(service, "syncZZZData").mockResolvedValue({
        success: false,
        platform: "HOYOVERSE",
        error: "API Error",
        syncedAt: new Date(),
      });

      const results = await service.syncAllPlatforms();

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
    });

    it("should skip platforms without configuration", async () => {
      delete process.env.STEAM_USER_ID;
      delete process.env.HOYO_UID;

      const results = await service.syncAllPlatforms();

      expect(results).toHaveLength(0);
    });

    it("should handle configuration errors", async () => {
      delete process.env.STEAM_API_KEY;
      delete process.env.HOYO_COOKIE;

      const results = await service.syncAllPlatforms();

      // Should gracefully handle missing API configurations
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe("getGamingSyncService", () => {
    it("should return service instance", () => {
      const service = getGamingSyncService();

      expect(service).toBeInstanceOf(GamingSyncService);
    });

    it("should return same instance on multiple calls (singleton)", () => {
      const service1 = getGamingSyncService();
      const service2 = getGamingSyncService();

      expect(service1).toBe(service2);
    });
  });

  describe("Error handling and edge cases", () => {
    it("should handle database connection failure", async () => {
      mockPrisma.steamProfile.upsert.mockRejectedValue(new Error("Database connection failed"));

      mockSteamClient.getPlayerSummary = vi.fn().mockResolvedValue({
        steamId: mockSteamId,
        personaName: "Test",
      });

      mockPrisma.gamingSyncLog.create.mockResolvedValue({ id: "log_1" });
      mockPrisma.gamingSyncLog.update.mockResolvedValue({ id: "log_1" });

      const result = await service.syncSteamData(mockSteamId);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Database connection failed");
    });

    it("should handle concurrent sync operations", async () => {
      process.env.STEAM_USER_ID = mockSteamId;
      process.env.HOYO_UID = mockHoYoUid;

      vi.spyOn(service, "syncSteamData").mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  success: true,
                  platform: "STEAM",
                  syncedAt: new Date(),
                }),
              100
            )
          )
      );

      vi.spyOn(service, "syncZZZData").mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  success: true,
                  platform: "HOYOVERSE",
                  syncedAt: new Date(),
                }),
              50
            )
          )
      );

      const results = await service.syncAllPlatforms();

      expect(results).toHaveLength(2);
      expect(results.every((r) => r.success)).toBe(true);
    });

    it("should log sync duration", async () => {
      const startTime = Date.now();

      mockSteamClient.getPlayerSummary = vi.fn().mockResolvedValue({
        steamId: mockSteamId,
        personaName: "Test",
      });

      mockSteamClient.getOwnedGames = vi.fn().mockResolvedValue([]);
      mockSteamClient.getRecentlyPlayedGames = vi.fn().mockResolvedValue([]);

      mockPrisma.steamProfile.upsert.mockResolvedValue({ id: "profile_1" });
      mockPrisma.gamingSyncLog.create.mockResolvedValue({ id: "log_1" });
      mockPrisma.gamingSyncLog.update.mockResolvedValue({ id: "log_1" });

      await service.syncSteamData(mockSteamId);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(mockPrisma.gamingSyncLog.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            duration: expect.any(Number),
          }),
        })
      );
    });
  });
});

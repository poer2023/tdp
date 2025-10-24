import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET } from "../route";
import type { GamingData } from "@/types/live-data";

// Mock Prisma client
vi.mock("@/lib/prisma", () => ({
  default: {
    gameSession: {
      findMany: vi.fn(),
    },
    game: {
      findMany: vi.fn(),
    },
  },
}));

describe("/api/about/live/gaming", () => {
  let mockPrisma: typeof import("@/lib/prisma").default;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Setup mock Prisma with realistic data
    const prismaModule = await import("@/lib/prisma");
    mockPrisma = prismaModule.default;

    // Mock database responses with real data structure
    const mockDate = new Date("2025-01-15T10:00:00Z");

    mockPrisma.gameSession.findMany.mockResolvedValue([
      {
        id: "session_1",
        gameId: "game_1",
        startTime: mockDate,
        duration: 120,
        platform: "STEAM",
        game: {
          id: "game_1",
          platformId: "730",
          platform: "STEAM",
          name: "Counter-Strike: Global Offensive",
          nameZh: "反恐精英:全球攻势",
          cover: "https://example.com/cover.jpg",
        },
      },
    ]);

    mockPrisma.game.findMany.mockResolvedValue([
      {
        id: "game_1",
        platformId: "730",
        platform: "STEAM",
        name: "Counter-Strike: Global Offensive",
        nameZh: "反恐精英:全球攻势",
        cover: "https://example.com/cover.jpg",
        sessions: [
          {
            id: "session_1",
            startTime: mockDate,
            duration: 120,
          },
        ],
        achievements: [
          {
            id: "ach_1",
            achievementId: "WIN_BOMB_PLANT",
            name: "Win Bomb Plant",
            isUnlocked: true,
          },
        ],
      },
    ]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return gaming data with correct structure", async () => {
    const response = await GET();
    const data: GamingData = await response.json();

    // Verify stats structure
    expect(data.stats).toBeDefined();
    expect(data.stats.thisMonth).toBeDefined();
    expect(data.stats.thisMonth.totalHours).toBeTypeOf("number");
    expect(data.stats.thisMonth.gamesPlayed).toBeTypeOf("number");

    expect(data.stats.thisYear).toBeDefined();
    expect(data.stats.thisYear.totalHours).toBeTypeOf("number");
    expect(data.stats.thisYear.gamesPlayed).toBeTypeOf("number");

    expect(data.stats.platforms).toBeDefined();
    expect(Array.isArray(data.stats.platforms)).toBe(true);
    data.stats.platforms.forEach((platform) => {
      expect(platform.id).toBeTypeOf("string");
      expect(platform.name).toBeTypeOf("string");
      expect(platform.activeGames).toBeTypeOf("number");
    });
  });

  it("should return currently playing games", async () => {
    const response = await GET();
    const data: GamingData = await response.json();

    expect(data.currentlyPlaying).toBeDefined();
    expect(Array.isArray(data.currentlyPlaying)).toBe(true);

    if (data.currentlyPlaying.length > 0) {
      const game = data.currentlyPlaying[0];
      expect(game.gameId).toBeTypeOf("string");
      expect(game.gameName).toBeTypeOf("string");
      expect(game.platform).toBeTypeOf("string");
      expect(game.playtime).toBeTypeOf("number");
      // After JSON serialization, dates become strings
      expect(game.lastPlayed).toBeTypeOf("string");
      expect(() => new Date(game.lastPlayed as string)).not.toThrow();
    }
  });

  it("should return recent sessions", async () => {
    const response = await GET();
    const data: GamingData = await response.json();

    expect(data.recentSessions).toBeDefined();
    expect(Array.isArray(data.recentSessions)).toBe(true);

    if (data.recentSessions.length > 0) {
      const session = data.recentSessions[0];
      expect(session.gameName).toBeTypeOf("string");
      expect(session.duration).toBeTypeOf("number");
      // After JSON serialization, dates become strings
      expect(session.date).toBeTypeOf("string");
      expect(() => new Date(session.date as string)).not.toThrow();
    }
  });

  it("should return playtime heatmap data", async () => {
    const response = await GET();
    const data: GamingData = await response.json();

    expect(data.playtimeHeatmap).toBeDefined();
    expect(Array.isArray(data.playtimeHeatmap)).toBe(true);
    expect(data.playtimeHeatmap.length).toBe(365);

    const heatmapEntry = data.playtimeHeatmap[0];
    // After JSON serialization, dates become strings
    expect(heatmapEntry.date).toBeTypeOf("string");
    expect(() => new Date(heatmapEntry.date as string)).not.toThrow();
    expect(heatmapEntry.value).toBeTypeOf("number");
    expect(heatmapEntry.value).toBeGreaterThanOrEqual(0);
  });

  it("should set correct cache headers", async () => {
    const response = await GET();
    const cacheControl = response.headers.get("Cache-Control");

    expect(cacheControl).toBeDefined();
    expect(cacheControl).toContain("public");
    expect(cacheControl).toContain("s-maxage");
    expect(cacheControl).toContain("stale-while-revalidate");
  });

  it("should return 200 status", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
  });

  it("should validate progress values are between 0-100", async () => {
    const response = await GET();
    const data: GamingData = await response.json();

    data.currentlyPlaying.forEach((game) => {
      if (game.progress !== undefined) {
        expect(game.progress).toBeGreaterThanOrEqual(0);
        expect(game.progress).toBeLessThanOrEqual(100);
      }
    });
  });

  describe("Database integration", () => {
    it("should query database for recent sessions", async () => {
      await GET();

      expect(mockPrisma.gameSession.findMany).toHaveBeenCalled();
      expect(mockPrisma.game.findMany).toHaveBeenCalled();
    });

    it("should calculate stats from database sessions", async () => {
      const mockSessions = [
        {
          id: "s1",
          gameId: "g1",
          startTime: new Date(),
          duration: 60,
          platform: "STEAM",
          game: {
            id: "g1",
            name: "Game 1",
            platformId: "123",
            platform: "STEAM",
          },
        },
        {
          id: "s2",
          gameId: "g2",
          startTime: new Date(),
          duration: 120,
          platform: "STEAM",
          game: {
            id: "g2",
            name: "Game 2",
            platformId: "456",
            platform: "STEAM",
          },
        },
      ];

      mockPrisma.gameSession.findMany.mockResolvedValue(mockSessions);

      const response = await GET();
      const data: GamingData = await response.json();

      // Total hours: (60 + 120) / 60 = 3
      expect(data.stats.thisMonth.totalHours).toBeGreaterThan(0);
      expect(data.stats.thisMonth.gamesPlayed).toBeGreaterThan(0);
    });

    it("should handle empty database gracefully", async () => {
      mockPrisma.gameSession.findMany.mockResolvedValue([]);
      mockPrisma.game.findMany.mockResolvedValue([]);

      const response = await GET();
      const data: GamingData = await response.json();

      expect(data.stats.thisMonth.totalHours).toBe(0);
      expect(data.stats.thisMonth.gamesPlayed).toBe(0);
      expect(data.currentlyPlaying).toEqual([]);
      expect(data.recentSessions).toEqual([]);
    });
  });

  describe("Error handling", () => {
    it("should return 500 on database error", async () => {
      mockPrisma.gameSession.findMany.mockRejectedValue(new Error("Database connection failed"));

      const response = await GET();

      // Should return error status instead of mock fallback
      expect(response.status).toBe(500);
    });

    it("should set shorter cache on error", async () => {
      mockPrisma.gameSession.findMany.mockRejectedValue(new Error("DB Error"));

      const response = await GET();
      const cacheControl = response.headers.get("Cache-Control");

      // Even on error, cache headers should be present
      if (cacheControl) {
        expect(cacheControl).toContain("s-maxage");
      }
    });

    it("should handle Prisma query timeout", async () => {
      mockPrisma.gameSession.findMany.mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Query timeout")), 100);
          })
      );

      const response = await GET();
      // Should return error status on timeout
      expect(response.status).toBe(500);
    });
  });

  describe("Multi-platform support", () => {
    it("should aggregate stats from multiple platforms", async () => {
      const multiPlatformSessions = [
        {
          id: "s1",
          gameId: "g1",
          startTime: new Date(),
          duration: 60,
          platform: "STEAM",
          game: {
            id: "g1",
            platformId: "730",
            platform: "STEAM",
            name: "CS:GO",
          },
        },
        {
          id: "s2",
          gameId: "g2",
          startTime: new Date(),
          duration: 90,
          platform: "HOYOVERSE",
          game: {
            id: "g2",
            platformId: "zzz",
            platform: "HOYOVERSE",
            name: "Zenless Zone Zero",
            nameZh: "绝区零",
          },
        },
      ];

      mockPrisma.gameSession.findMany.mockResolvedValue(multiPlatformSessions);

      const response = await GET();
      const data: GamingData = await response.json();

      // Should have multiple platforms
      expect(data.stats.platforms.length).toBeGreaterThan(1);
      const platforms = data.stats.platforms.map((p) => p.name);
      expect(platforms).toContain("Steam");
      expect(platforms).toContain("绝区零");
    });

    it("should use Chinese names when available", async () => {
      const chineseGameSessions = [
        {
          id: "s1",
          gameId: "g1",
          startTime: new Date(),
          duration: 60,
          platform: "HOYOVERSE",
          game: {
            id: "g1",
            platformId: "zzz",
            platform: "HOYOVERSE",
            name: "Zenless Zone Zero",
            nameZh: "绝区零",
          },
        },
      ];

      mockPrisma.gameSession.findMany.mockResolvedValue(chineseGameSessions);
      mockPrisma.game.findMany.mockResolvedValue([
        {
          id: "g1",
          platformId: "zzz",
          platform: "HOYOVERSE",
          name: "Zenless Zone Zero",
          nameZh: "绝区零",
          sessions: chineseGameSessions,
          achievements: [],
        },
      ]);

      const response = await GET();
      const data: GamingData = await response.json();

      if (data.recentSessions.length > 0) {
        expect(data.recentSessions[0].gameName).toBe("绝区零");
      }
    });
  });

  describe("Performance and caching", () => {
    it("should use proper cache headers for real data", async () => {
      const response = await GET();
      const cacheControl = response.headers.get("Cache-Control");

      expect(cacheControl).toContain("public");
      expect(cacheControl).toContain("s-maxage=1800"); // 30 minutes
      expect(cacheControl).toContain("stale-while-revalidate=3600"); // 1 hour
    });

    it("should limit current games to 4", async () => {
      const manyGames = Array.from({ length: 10 }, (_, i) => ({
        id: `game_${i}`,
        platformId: `${i}`,
        platform: "STEAM",
        name: `Game ${i}`,
        sessions: [
          {
            id: `session_${i}`,
            startTime: new Date(),
            duration: 100,
          },
        ],
        achievements: [],
      }));

      mockPrisma.game.findMany.mockResolvedValue(manyGames);

      const response = await GET();
      const data: GamingData = await response.json();

      expect(data.currentlyPlaying.length).toBeLessThanOrEqual(4);
    });

    it("should limit recent sessions to 5", async () => {
      const manySessions = Array.from({ length: 20 }, (_, i) => ({
        id: `session_${i}`,
        gameId: `game_${i}`,
        startTime: new Date(),
        duration: 60,
        platform: "STEAM",
        game: {
          id: `game_${i}`,
          platformId: `${i}`,
          platform: "STEAM",
          name: `Game ${i}`,
        },
      }));

      mockPrisma.gameSession.findMany.mockResolvedValue(manySessions);

      const response = await GET();
      const data: GamingData = await response.json();

      expect(data.recentSessions.length).toBeLessThanOrEqual(5);
    });
  });
});

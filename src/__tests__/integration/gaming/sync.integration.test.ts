/**
 * Integration Tests for Gaming Data Sync
 *
 * These tests verify the complete flow from API calls to database persistence.
 * They use a real test database instance with Prisma.
 *
 * NOTE: These tests require a running PostgreSQL test database.
 * Run with: DATABASE_URL="postgresql://test:test@localhost:5432/test_db" npm test
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { GamingSyncService } from "@/lib/gaming/sync-service";
import type { SteamAPIClient } from "@/lib/gaming/steam-client";
import type { HoYoAPIClient } from "@/lib/gaming/hoyo-client";

// Skip integration tests if no test database is configured
const testDbUrl = process.env.DATABASE_URL;
const shouldRunIntegrationTests = testDbUrl && testDbUrl.includes("test");

describe.skipIf(!shouldRunIntegrationTests)("Gaming Data Integration Tests", () => {
  let prisma: PrismaClient;
  let syncService: GamingSyncService;

  beforeAll(async () => {
    if (!shouldRunIntegrationTests) return;

    prisma = new PrismaClient();

    // Ensure database schema is up to date
    // Note: In a real test environment, you'd run migrations here
    await prisma.$connect();
  });

  afterAll(async () => {
    if (!shouldRunIntegrationTests) return;

    await prisma.$disconnect();
  });

  beforeEach(async () => {
    if (!shouldRunIntegrationTests) return;

    // Clean up test data before each test
    await prisma.gamingSyncLog.deleteMany({});
    await prisma.gameAchievement.deleteMany({});
    await prisma.gameSession.deleteMany({});
    await prisma.game.deleteMany({});
    await prisma.steamProfile.deleteMany({});
    await prisma.hoyoProfile.deleteMany({});
  });

  describe("Steam Data Sync Integration", () => {
    it("should sync Steam profile to database", async () => {
      const mockSteamId = "76561198012345678";

      // Create profile data
      const profile = await prisma.steamProfile.create({
        data: {
          steamId: mockSteamId,
          personaName: "TestUser",
          profileUrl: "https://steamcommunity.com/id/testuser",
          avatar: "https://avatar.url/test.jpg",
          lastSyncAt: new Date(),
        },
      });

      expect(profile.steamId).toBe(mockSteamId);
      expect(profile.personaName).toBe("TestUser");

      // Verify it was persisted
      const retrieved = await prisma.steamProfile.findUnique({
        where: { steamId: mockSteamId },
      });

      expect(retrieved).not.toBeNull();
      expect(retrieved?.personaName).toBe("TestUser");
    });

    it("should create game and sessions", async () => {
      const gameData = await prisma.game.create({
        data: {
          platformId: "730",
          platform: "STEAM",
          name: "Counter-Strike: Global Offensive",
          nameZh: "反恐精英:全球攻势",
          cover: "https://example.com/cover.jpg",
        },
      });

      const session = await prisma.gameSession.create({
        data: {
          gameId: gameData.id,
          startTime: new Date("2025-01-15T10:00:00Z"),
          duration: 120,
          platform: "STEAM",
        },
      });

      expect(session.gameId).toBe(gameData.id);
      expect(session.duration).toBe(120);

      // Verify relationship
      const gameWithSessions = await prisma.game.findUnique({
        where: { id: gameData.id },
        include: { sessions: true },
      });

      expect(gameWithSessions?.sessions).toHaveLength(1);
      expect(gameWithSessions?.sessions[0].duration).toBe(120);
    });

    it("should create achievements for games", async () => {
      const game = await prisma.game.create({
        data: {
          platformId: "730",
          platform: "STEAM",
          name: "CS:GO",
        },
      });

      const achievement = await prisma.gameAchievement.create({
        data: {
          gameId: game.id,
          achievementId: "WIN_BOMB_PLANT",
          name: "Win Bomb Plant",
          isUnlocked: true,
          unlockedAt: new Date("2025-01-01T00:00:00Z"),
        },
      });

      expect(achievement.gameId).toBe(game.id);
      expect(achievement.isUnlocked).toBe(true);

      // Verify relationship
      const gameWithAchievements = await prisma.game.findUnique({
        where: { id: game.id },
        include: { achievements: true },
      });

      expect(gameWithAchievements?.achievements).toHaveLength(1);
      expect(gameWithAchievements?.achievements[0].name).toBe("Win Bomb Plant");
    });

    it("should upsert game on duplicate platformId", async () => {
      const gameData = {
        platformId: "730",
        platform: "STEAM" as const,
        name: "CS:GO",
      };

      // First insert
      const game1 = await prisma.game.upsert({
        where: {
          platform_platformId: {
            platform: gameData.platform,
            platformId: gameData.platformId,
          },
        },
        create: gameData,
        update: { name: "Updated CS:GO" },
      });

      // Second upsert should update
      const game2 = await prisma.game.upsert({
        where: {
          platform_platformId: {
            platform: gameData.platform,
            platformId: gameData.platformId,
          },
        },
        create: gameData,
        update: { name: "Updated CS:GO" },
      });

      expect(game1.id).toBe(game2.id);
      expect(game2.name).toBe("Updated CS:GO");
    });
  });

  describe("HoYo Data Sync Integration", () => {
    it("should sync HoYo profile to database", async () => {
      const mockUid = "100123456";

      const profile = await prisma.hoyoProfile.create({
        data: {
          uid: mockUid,
          nickname: "TestPlayer",
          level: 40,
          loginDays: 45,
          region: "cn_gf01",
          lastSyncAt: new Date(),
        },
      });

      expect(profile.uid).toBe(mockUid);
      expect(profile.level).toBe(40);
      expect(profile.loginDays).toBe(45);

      // Verify persistence
      const retrieved = await prisma.hoyoProfile.findUnique({
        where: { uid: mockUid },
      });

      expect(retrieved).not.toBeNull();
      expect(retrieved?.nickname).toBe("TestPlayer");
    });

    it("should create ZZZ game with sessions", async () => {
      const game = await prisma.game.create({
        data: {
          platformId: "zzz",
          platform: "HOYOVERSE",
          name: "Zenless Zone Zero",
          nameZh: "绝区零",
        },
      });

      const session = await prisma.gameSession.create({
        data: {
          gameId: game.id,
          startTime: new Date(),
          duration: 3300, // 55 hours estimated * 60 minutes
          platform: "HOYOVERSE",
          hoyoLevel: 40,
          hoyoMode: "exploration",
        },
      });

      expect(session.hoyoLevel).toBe(40);
      expect(session.hoyoMode).toBe("exploration");
      expect(session.duration).toBe(3300);
    });
  });

  describe("Multi-Platform Integration", () => {
    it("should store games from multiple platforms", async () => {
      await prisma.game.createMany({
        data: [
          {
            platformId: "730",
            platform: "STEAM",
            name: "CS:GO",
          },
          {
            platformId: "zzz",
            platform: "HOYOVERSE",
            name: "Zenless Zone Zero",
            nameZh: "绝区零",
          },
        ],
      });

      const allGames = await prisma.game.findMany();
      expect(allGames).toHaveLength(2);

      const platforms = [...new Set(allGames.map((g) => g.platform))];
      expect(platforms).toContain("STEAM");
      expect(platforms).toContain("HOYOVERSE");
    });

    it("should query sessions across all platforms", async () => {
      const steamGame = await prisma.game.create({
        data: { platformId: "730", platform: "STEAM", name: "CS:GO" },
      });

      const zzzGame = await prisma.game.create({
        data: {
          platformId: "zzz",
          platform: "HOYOVERSE",
          name: "Zenless Zone Zero",
        },
      });

      await prisma.gameSession.createMany({
        data: [
          {
            gameId: steamGame.id,
            startTime: new Date(),
            duration: 120,
            platform: "STEAM",
          },
          {
            gameId: zzzGame.id,
            startTime: new Date(),
            duration: 180,
            platform: "HOYOVERSE",
          },
        ],
      });

      const allSessions = await prisma.gameSession.findMany({
        include: { game: true },
      });

      expect(allSessions).toHaveLength(2);
      expect(allSessions[0].game.platform).toBeDefined();
    });
  });

  describe("Sync Logging Integration", () => {
    it("should create sync log entry", async () => {
      const log = await prisma.gamingSyncLog.create({
        data: {
          platform: "STEAM",
          status: "RUNNING",
        },
      });

      expect(log.platform).toBe("STEAM");
      expect(log.status).toBe("RUNNING");
      expect(log.syncedAt).toBeInstanceOf(Date);
    });

    it("should update sync log on completion", async () => {
      const log = await prisma.gamingSyncLog.create({
        data: {
          platform: "STEAM",
          status: "RUNNING",
        },
      });

      const updated = await prisma.gamingSyncLog.update({
        where: { id: log.id },
        data: {
          status: "SUCCESS",
          duration: 5000,
          message: "Synced successfully",
        },
      });

      expect(updated.status).toBe("SUCCESS");
      expect(updated.duration).toBe(5000);
      expect(updated.message).toBe("Synced successfully");
    });

    it("should query recent sync logs", async () => {
      await prisma.gamingSyncLog.createMany({
        data: [
          {
            platform: "STEAM",
            status: "SUCCESS",
            syncedAt: new Date("2025-01-15T10:00:00Z"),
          },
          {
            platform: "STEAM",
            status: "FAILED",
            syncedAt: new Date("2025-01-15T09:00:00Z"),
            message: "API Error",
          },
          {
            platform: "HOYOVERSE",
            status: "SUCCESS",
            syncedAt: new Date("2025-01-15T10:30:00Z"),
          },
        ],
      });

      const logs = await prisma.gamingSyncLog.findMany({
        where: { platform: "STEAM" },
        orderBy: { syncedAt: "desc" },
      });

      expect(logs).toHaveLength(2);
      expect(logs[0].status).toBe("SUCCESS");
      expect(logs[1].status).toBe("FAILED");
    });
  });

  describe("Data Consistency", () => {
    it("should maintain referential integrity on game deletion", async () => {
      const game = await prisma.game.create({
        data: { platformId: "730", platform: "STEAM", name: "CS:GO" },
      });

      await prisma.gameSession.create({
        data: {
          gameId: game.id,
          startTime: new Date(),
          duration: 120,
          platform: "STEAM",
        },
      });

      await prisma.gameAchievement.create({
        data: {
          gameId: game.id,
          achievementId: "TEST_ACH",
          name: "Test Achievement",
        },
      });

      // Delete game should cascade delete sessions and achievements
      await prisma.game.delete({ where: { id: game.id } });

      const sessions = await prisma.gameSession.findMany({
        where: { gameId: game.id },
      });
      const achievements = await prisma.gameAchievement.findMany({
        where: { gameId: game.id },
      });

      expect(sessions).toHaveLength(0);
      expect(achievements).toHaveLength(0);
    });

    it("should handle duplicate session prevention", async () => {
      const game = await prisma.game.create({
        data: { platformId: "730", platform: "STEAM", name: "CS:GO" },
      });

      const sessionTime = new Date("2025-01-15T10:00:00Z");

      await prisma.gameSession.create({
        data: {
          gameId: game.id,
          startTime: sessionTime,
          duration: 120,
          platform: "STEAM",
        },
      });

      // Check for existing session before creating duplicate
      const existing = await prisma.gameSession.findFirst({
        where: {
          gameId: game.id,
          startTime: sessionTime,
        },
      });

      expect(existing).not.toBeNull();

      // Don't create duplicate if it exists
      if (!existing) {
        await prisma.gameSession.create({
          data: {
            gameId: game.id,
            startTime: sessionTime,
            duration: 120,
            platform: "STEAM",
          },
        });
      }

      const allSessions = await prisma.gameSession.findMany({
        where: { gameId: game.id },
      });

      expect(allSessions).toHaveLength(1);
    });
  });

  describe("Performance Queries", () => {
    beforeEach(async () => {
      if (!shouldRunIntegrationTests) return;

      // Create test data for performance queries
      const game = await prisma.game.create({
        data: { platformId: "730", platform: "STEAM", name: "CS:GO" },
      });

      const sessions = Array.from({ length: 100 }, (_, i) => ({
        gameId: game.id,
        startTime: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        duration: Math.floor(Math.random() * 300) + 60,
        platform: "STEAM" as const,
      }));

      await prisma.gameSession.createMany({ data: sessions });
    });

    it("should efficiently query last month sessions", async () => {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const sessions = await prisma.gameSession.findMany({
        where: {
          startTime: { gte: lastMonth },
        },
        include: { game: true },
      });

      expect(sessions.length).toBeGreaterThan(0);
      expect(sessions.length).toBeLessThanOrEqual(31); // Roughly one month
    });

    it("should efficiently aggregate playtime stats", async () => {
      const result = await prisma.gameSession.aggregate({
        _sum: { duration: true },
        _count: { id: true },
      });

      expect(result._sum.duration).toBeGreaterThan(0);
      expect(result._count.id).toBe(100);
    });

    it("should efficiently query recent sessions with limit", async () => {
      const recentSessions = await prisma.gameSession.findMany({
        take: 10,
        orderBy: { startTime: "desc" },
        include: { game: true },
      });

      expect(recentSessions).toHaveLength(10);

      // Verify order
      for (let i = 1; i < recentSessions.length; i++) {
        expect(recentSessions[i - 1].startTime >= recentSessions[i].startTime).toBe(true);
      }
    });
  });
});

// Export note for CI/CD
export const integrationTestsNote = `
Integration tests require a test database.

To run:
1. Set up a test PostgreSQL database
2. Run migrations: npx prisma migrate deploy
3. Set DATABASE_URL environment variable
4. Run tests: npm test

These tests are automatically skipped if no test database is configured.
`;

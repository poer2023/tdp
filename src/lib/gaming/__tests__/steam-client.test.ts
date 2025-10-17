import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  SteamAPIClient,
  getSteamClient,
  type SteamGame,
  type SteamPlayerSummary,
  type SteamAchievement,
} from "../steam-client";

describe("SteamAPIClient", () => {
  let client: SteamAPIClient;
  const mockApiKey = "test_api_key_12345";
  const mockSteamId = "76561198012345678";
  const mockAppId = 730; // CS:GO

  beforeEach(() => {
    client = new SteamAPIClient(mockApiKey);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getOwnedGames", () => {
    it("should fetch owned games successfully", async () => {
      const mockResponse = {
        response: {
          game_count: 2,
          games: [
            {
              appid: 730,
              name: "Counter-Strike: Global Offensive",
              playtime_forever: 12000,
              playtime_2weeks: 120,
              img_icon_url: "icon_hash",
              img_logo_url: "logo_hash",
            },
            {
              appid: 440,
              name: "Team Fortress 2",
              playtime_forever: 5000,
              img_icon_url: "tf2_icon",
              img_logo_url: "tf2_logo",
            },
          ],
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const games = await client.getOwnedGames(mockSteamId);

      expect(games).toHaveLength(2);
      expect(games[0]).toMatchObject({
        appId: 730,
        name: "Counter-Strike: Global Offensive",
        playtimeForever: 12000,
        playtime2Weeks: 120,
      });
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining(`key=${mockApiKey}`));
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining(`steamid=${mockSteamId}`));
    });

    it("should return empty array for private profile", async () => {
      const mockResponse = {
        response: {
          game_count: 0,
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const games = await client.getOwnedGames(mockSteamId);

      expect(games).toEqual([]);
    });

    it("should handle API failure gracefully", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: "Forbidden",
      });

      await expect(client.getOwnedGames(mockSteamId)).rejects.toThrow(
        /Failed to fetch owned games/
      );
    });

    it("should handle network error", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      await expect(client.getOwnedGames(mockSteamId)).rejects.toThrow("Network error");
    });

    it("should handle malformed response", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ invalid: "data" }),
      });

      const games = await client.getOwnedGames(mockSteamId);

      expect(games).toEqual([]);
    });
  });

  describe("getRecentlyPlayedGames", () => {
    it("should fetch recently played games successfully", async () => {
      const mockResponse = {
        response: {
          total_count: 1,
          games: [
            {
              appid: 730,
              name: "Counter-Strike: Global Offensive",
              playtime_2weeks: 120,
              playtime_forever: 12000,
              img_icon_url: "icon_hash",
              img_logo_url: "logo_hash",
            },
          ],
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const games = await client.getRecentlyPlayedGames(mockSteamId);

      expect(games).toHaveLength(1);
      expect(games[0]).toMatchObject({
        appId: 730,
        playtime2Weeks: 120,
      });
    });

    it("should return empty array when no recent games", async () => {
      const mockResponse = {
        response: {
          total_count: 0,
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const games = await client.getRecentlyPlayedGames(mockSteamId);

      expect(games).toEqual([]);
    });
  });

  describe("getPlayerSummary", () => {
    it("should fetch player summary successfully", async () => {
      const mockResponse = {
        response: {
          players: [
            {
              steamid: mockSteamId,
              personaname: "TestUser",
              profileurl: "https://steamcommunity.com/id/testuser",
              avatar: "https://avatar.url/small.jpg",
              avatarmedium: "https://avatar.url/medium.jpg",
              avatarfull: "https://avatar.url/full.jpg",
            },
          ],
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const summary = await client.getPlayerSummary(mockSteamId);

      expect(summary).toMatchObject({
        steamId: mockSteamId,
        personaName: "TestUser",
        profileUrl: "https://steamcommunity.com/id/testuser",
        avatar: "https://avatar.url/small.jpg",
      });
    });

    it("should return null for non-existent player", async () => {
      const mockResponse = {
        response: {
          players: [],
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const summary = await client.getPlayerSummary(mockSteamId);

      expect(summary).toBeNull();
    });

    it("should handle API failure", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(client.getPlayerSummary(mockSteamId)).rejects.toThrow();
    });
  });

  describe("getPlayerAchievements", () => {
    it("should fetch achievements successfully", async () => {
      const mockResponse = {
        playerstats: {
          steamID: mockSteamId,
          gameName: "Counter-Strike: Global Offensive",
          achievements: [
            {
              apiname: "WIN_BOMB_PLANT",
              achieved: 1,
              unlocktime: 1609459200,
              name: "Win Bomb Plant",
              description: "Win round by planting bomb",
            },
            {
              apiname: "HEADSHOT_KILLS",
              achieved: 0,
              unlocktime: 0,
              name: "Headshot Master",
              description: "Get 100 headshot kills",
            },
          ],
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const achievements = await client.getPlayerAchievements(mockSteamId, mockAppId);

      expect(achievements).toHaveLength(2);
      expect(achievements[0]).toMatchObject({
        apiName: "WIN_BOMB_PLANT",
        achieved: true,
        unlockTime: 1609459200,
        name: "Win Bomb Plant",
      });
      expect(achievements[1].achieved).toBe(false);
    });

    it("should return empty array for game without achievements", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
      });

      const achievements = await client.getPlayerAchievements(mockSteamId, mockAppId);

      expect(achievements).toEqual([]);
    });

    it("should return empty array when achievements are private", async () => {
      const mockResponse = {
        playerstats: {
          error: "Profile is private",
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const achievements = await client.getPlayerAchievements(mockSteamId, mockAppId);

      expect(achievements).toEqual([]);
    });
  });

  describe("getGameDetails", () => {
    it("should fetch game details successfully", async () => {
      const mockResponse = {
        [mockAppId]: {
          success: true,
          data: {
            name: "Counter-Strike: Global Offensive",
            header_image: "https://cdn.cloudflare.steamstatic.com/steam/apps/730/header.jpg",
            short_description: "Counter-Strike: Global Offensive",
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const details = await client.getGameDetails(mockAppId);

      expect(details).toMatchObject({
        name: "Counter-Strike: Global Offensive",
        cover: expect.stringContaining("header.jpg"),
        description: "Counter-Strike: Global Offensive",
      });
    });

    it("should return null for non-existent game", async () => {
      const mockResponse = {
        [mockAppId]: {
          success: false,
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const details = await client.getGameDetails(mockAppId);

      expect(details).toBeNull();
    });

    it("should handle rate limiting", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
      });

      const details = await client.getGameDetails(mockAppId);

      expect(details).toBeNull();
    });
  });

  describe("URL helpers", () => {
    it("should generate correct game icon URL", () => {
      const iconHash = "abc123";
      const url = client.getGameIconURL(mockAppId, iconHash);

      expect(url).toBe(
        `https://media.steampowered.com/steamcommunity/public/images/apps/${mockAppId}/${iconHash}.jpg`
      );
    });

    it("should generate correct game logo URL", () => {
      const logoHash = "xyz789";
      const url = client.getGameLogoURL(mockAppId, logoHash);

      expect(url).toBe(
        `https://media.steampowered.com/steamcommunity/public/images/apps/${mockAppId}/${logoHash}.jpg`
      );
    });
  });

  describe("getSteamClient", () => {
    it("should throw error when API key is not configured", () => {
      const originalEnv = process.env.STEAM_API_KEY;
      delete process.env.STEAM_API_KEY;

      expect(() => getSteamClient()).toThrow("STEAM_API_KEY not configured");

      process.env.STEAM_API_KEY = originalEnv;
    });

    it("should return client instance when configured", () => {
      process.env.STEAM_API_KEY = mockApiKey;

      const client = getSteamClient();

      expect(client).toBeInstanceOf(SteamAPIClient);
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle empty game list", async () => {
      const mockResponse = {
        response: {
          game_count: 0,
          games: [],
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const games = await client.getOwnedGames(mockSteamId);

      expect(games).toEqual([]);
    });

    it("should handle missing optional fields in games", async () => {
      const mockResponse = {
        response: {
          game_count: 1,
          games: [
            {
              appid: 730,
              name: "Counter-Strike: Global Offensive",
              playtime_forever: 12000,
              // Missing playtime_2weeks, img_icon_url, img_logo_url
            },
          ],
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const games = await client.getOwnedGames(mockSteamId);

      expect(games).toHaveLength(1);
      expect(games[0].playtime2Weeks).toBeUndefined();
      expect(games[0].imgIconUrl).toBeUndefined();
    });

    it("should handle JSON parse error", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      });

      await expect(client.getOwnedGames(mockSteamId)).rejects.toThrow("Invalid JSON");
    });

    it("should handle timeout", async () => {
      global.fetch = vi.fn().mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Timeout")), 100);
          })
      );

      await expect(client.getOwnedGames(mockSteamId)).rejects.toThrow("Timeout");
    });
  });
});

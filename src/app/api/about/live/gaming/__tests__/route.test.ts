import { describe, it, expect } from "vitest";
import { GET } from "../route";
import type { GamingData } from "@/types/live-data";

describe("/api/about/live/gaming", () => {
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
});

import { describe, it, expect } from "vitest";
import { GET } from "../route";
import type { DevData } from "@/types/live-data";

describe("/api/about/live/dev", () => {
  it("should return dev data with correct structure", async () => {
    const response = await GET();
    const data: DevData = await response.json();

    // Verify stats structure
    expect(data.stats).toBeDefined();
    expect(data.stats.thisWeek).toBeDefined();
    expect(data.stats.thisWeek.commits).toBeTypeOf("number");
    expect(data.stats.thisWeek.repos).toBeTypeOf("number");

    expect(data.stats.thisMonth).toBeDefined();
    expect(data.stats.thisMonth.commits).toBeTypeOf("number");
    expect(data.stats.thisMonth.pullRequests).toBeTypeOf("number");

    expect(data.stats.thisYear).toBeDefined();
    expect(data.stats.thisYear.stars).toBeTypeOf("number");
    expect(data.stats.thisYear.repos).toBeTypeOf("number");

    expect(data.stats.currentStreak).toBeTypeOf("number");
    expect(data.stats.currentStreak).toBeGreaterThanOrEqual(0);
  });

  it("should return contribution heatmap with 365 days", async () => {
    const response = await GET();
    const data: DevData = await response.json();

    expect(data.contributionHeatmap).toBeDefined();
    expect(Array.isArray(data.contributionHeatmap)).toBe(true);
    expect(data.contributionHeatmap.length).toBe(365);

    const heatmapEntry = data.contributionHeatmap[0];
    expect(heatmapEntry.date).toBeInstanceOf(Date);
    expect(heatmapEntry.value).toBeTypeOf("number");
    expect(heatmapEntry.value).toBeGreaterThanOrEqual(0);
  });

  it("should return active repositories", async () => {
    const response = await GET();
    const data: DevData = await response.json();

    expect(data.activeRepos).toBeDefined();
    expect(Array.isArray(data.activeRepos)).toBe(true);

    if (data.activeRepos.length > 0) {
      const repo = data.activeRepos[0];
      expect(repo.name).toBeTypeOf("string");
      expect(repo.fullName).toBeTypeOf("string");
      expect(repo.language).toBeTypeOf("string");
      expect(repo.commitsThisMonth).toBeTypeOf("number");
      expect(repo.lastCommit).toBeDefined();
      expect(repo.lastCommit.message).toBeTypeOf("string");
      expect(repo.lastCommit.date).toBeInstanceOf(Date);
    }
  });

  it("should return programming languages usage", async () => {
    const response = await GET();
    const data: DevData = await response.json();

    expect(data.languages).toBeDefined();
    expect(Array.isArray(data.languages)).toBe(true);

    if (data.languages && data.languages.length > 0) {
      const lang = data.languages[0];
      expect(lang.name).toBeTypeOf("string");
      expect(lang.hours).toBeTypeOf("number");
      expect(lang.percentage).toBeTypeOf("number");
      expect(lang.percentage).toBeGreaterThanOrEqual(0);
      expect(lang.percentage).toBeLessThanOrEqual(100);
    }
  });

  it("should have language percentages sum to 100 or less", async () => {
    const response = await GET();
    const data: DevData = await response.json();

    if (data.languages && data.languages.length > 0) {
      const totalPercentage = data.languages.reduce((sum, lang) => sum + lang.percentage, 0);
      expect(totalPercentage).toBeLessThanOrEqual(100);
      expect(totalPercentage).toBeGreaterThan(0);
    }
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
});

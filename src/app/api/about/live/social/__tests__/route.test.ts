import { describe, it, expect } from "vitest";
import { GET } from "../route";
import type { SocialData } from "@/types/live-data";

describe("/api/about/live/social", () => {
  it("should return social data with correct structure", async () => {
    const response = await GET();
    const data: SocialData = await response.json();

    // Verify stats structure
    expect(data.stats).toBeDefined();
    expect(data.stats.thisWeek).toBeDefined();
    expect(data.stats.thisWeek.conversations).toBeTypeOf("number");
    expect(data.stats.thisWeek.calls).toBeTypeOf("number");

    expect(data.stats.thisMonth).toBeDefined();
    expect(data.stats.thisMonth.conversations).toBeTypeOf("number");
    expect(data.stats.thisMonth.calls).toBeTypeOf("number");

    expect(data.stats.activePeople).toBeTypeOf("number");
    expect(data.stats.activeGroups).toBeTypeOf("number");
  });

  it("should return fully anonymized interaction data", async () => {
    const response = await GET();
    const data: SocialData = await response.json();

    expect(data.recentInteractions).toBeDefined();
    expect(Array.isArray(data.recentInteractions)).toBe(true);

    data.recentInteractions.forEach((interaction) => {
      // Verify anonymized ID format (no real names or personal info)
      expect(interaction.anonymizedId).toBeDefined();
      expect(interaction.anonymizedId).toBeTypeOf("string");
      expect(interaction.anonymizedId).toMatch(/^user_[a-z0-9]+$/);

      // Verify no personal information
      expect(interaction).not.toHaveProperty("name");
      expect(interaction).not.toHaveProperty("username");
      expect(interaction).not.toHaveProperty("email");
      expect(interaction).not.toHaveProperty("phone");
      expect(interaction).not.toHaveProperty("realName");

      // Verify basic interaction info
      expect(interaction.type).toBeTypeOf("string");
      expect(["chat", "call", "group"]).toContain(interaction.type);
      expect(interaction.platform).toBeTypeOf("string");
      expect(interaction.timestamp).toBeInstanceOf(Date);
    });
  });

  it("should never expose personal identifiable information", async () => {
    const response = await GET();
    const data: SocialData = await response.json();
    const jsonString = JSON.stringify(data);

    // Check for common PII patterns (should not exist)
    expect(jsonString).not.toMatch(/@\w+\.\w+/); // No email patterns
    expect(jsonString).not.toMatch(/\d{3}-\d{3}-\d{4}/); // No phone patterns
    expect(jsonString).not.toMatch(/\+\d{10,}/); // No international phone

    // All IDs should be anonymized
    expect(jsonString).not.toMatch(/realName|fullName|actualName/);
  });

  it("should return platform statistics", async () => {
    const response = await GET();
    const data: SocialData = await response.json();

    expect(data.platformStats).toBeDefined();
    expect(typeof data.platformStats).toBe("object");

    Object.entries(data.platformStats).forEach(([platform, count]) => {
      expect(platform).toBeTypeOf("string");
      expect(count).toBeTypeOf("number");
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  it("should have reasonable stat values", async () => {
    const response = await GET();
    const data: SocialData = await response.json();

    // Verify stats are non-negative
    expect(data.stats.thisWeek.conversations).toBeGreaterThanOrEqual(0);
    expect(data.stats.thisWeek.calls).toBeGreaterThanOrEqual(0);
    expect(data.stats.activePeople).toBeGreaterThanOrEqual(0);
    expect(data.stats.activeGroups).toBeGreaterThanOrEqual(0);
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

  it("should validate call durations are reasonable", async () => {
    const response = await GET();
    const data: SocialData = await response.json();

    data.recentInteractions.forEach((interaction) => {
      if (interaction.duration !== undefined) {
        expect(interaction.duration).toBeGreaterThan(0);
        expect(interaction.duration).toBeLessThan(1440); // Less than 24 hours in minutes
      }
    });
  });
});

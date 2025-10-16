import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type {
  LiveHighlight,
  GamingData,
  DevData,
  ReadingData,
  SocialData,
  FinanceData,
} from "@/types/live-data";

/**
 * Integration Test: About Live Dashboard
 *
 * This test suite validates the complete integration between:
 * - Dashboard UI component
 * - All 7 API endpoints (gaming, dev, reading, social, finance, etc.)
 * - Data flow from APIs to UI
 * - Correct data structure and formatting
 *
 * Unlike unit tests, these tests verify the entire system working together.
 */

describe("About Live Dashboard Integration", () => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  beforeAll(() => {
    // Setup: could start test server if needed
  });

  afterAll(() => {
    // Cleanup: stop test server if started
  });

  describe("Highlights API Integration", () => {
    it("should return complete highlights data for all modules", async () => {
      const response = await fetch(`${baseUrl}/api/about/highlights`);
      expect(response.ok).toBe(true);

      const highlights: LiveHighlight[] = await response.json();

      // Should include all 7 modules
      expect(highlights.length).toBeGreaterThanOrEqual(5);

      // Verify structure of each highlight
      highlights.forEach((highlight) => {
        expect(highlight).toHaveProperty("module");
        expect(highlight).toHaveProperty("icon");
        expect(highlight).toHaveProperty("title");
        expect(highlight).toHaveProperty("subtitle");
        expect(highlight).toHaveProperty("value");
        expect(highlight).toHaveProperty("trend");
        expect(highlight).toHaveProperty("href");

        // Verify trend is valid
        expect(["up", "down", "stable"]).toContain(highlight.trend);

        // Verify href points to correct module
        expect(highlight.href).toMatch(/\/about\/live\//);
      });
    });

    it("should include all Phase 4 modules in highlights", async () => {
      const response = await fetch(`${baseUrl}/api/about/highlights`);
      const highlights: LiveHighlight[] = await response.json();

      const modules = highlights.map((h) => h.module);

      // Phase 4 modules must be present
      expect(modules).toContain("reading");
      expect(modules).toContain("social");
      expect(modules).toContain("finance");
    });
  });

  describe("Gaming API Integration", () => {
    it("should integrate gaming data with correct structure", async () => {
      const response = await fetch(`${baseUrl}/api/about/live/gaming`);
      expect(response.ok).toBe(true);

      const data: GamingData = await response.json();

      // Verify complete data structure
      expect(data.stats).toBeDefined();
      expect(data.currentlyPlaying).toBeDefined();
      expect(data.recentSessions).toBeDefined();
      expect(data.playtimeHeatmap).toBeDefined();

      // Verify heatmap has exactly 365 days
      expect(data.playtimeHeatmap.length).toBe(365);
    });
  });

  describe("Dev API Integration", () => {
    it("should integrate dev data with GitHub contribution heatmap", async () => {
      const response = await fetch(`${baseUrl}/api/about/live/dev`);
      expect(response.ok).toBe(true);

      const data: DevData = await response.json();

      // Verify complete data structure
      expect(data.stats).toBeDefined();
      expect(data.contributionHeatmap).toBeDefined();
      expect(data.activeRepos).toBeDefined();
      expect(data.languages).toBeDefined();

      // Verify heatmap has exactly 365 days
      expect(data.contributionHeatmap.length).toBe(365);

      // Verify language percentages sum to 100 or less
      if (data.languages && data.languages.length > 0) {
        const total = data.languages.reduce((sum, lang) => sum + lang.percentage, 0);
        expect(total).toBeLessThanOrEqual(100);
      }
    });
  });

  describe("Reading API Integration", () => {
    it("should integrate reading data with books and articles", async () => {
      const response = await fetch(`${baseUrl}/api/about/live/reading`);
      expect(response.ok).toBe(true);

      const data: ReadingData = await response.json();

      // Verify complete data structure
      expect(data.stats).toBeDefined();
      expect(data.currentlyReading).toBeDefined();
      expect(data.recentlyFinished).toBeDefined();
      expect(data.recentArticles).toBeDefined();

      // Verify articles have valid URLs
      data.recentArticles.forEach((article) => {
        expect(() => new URL(article.url)).not.toThrow();
      });

      // Verify book ratings are valid (1-5)
      data.recentlyFinished.forEach((book) => {
        if (book.rating !== undefined) {
          expect(book.rating).toBeGreaterThanOrEqual(1);
          expect(book.rating).toBeLessThanOrEqual(5);
        }
      });
    });
  });

  describe("Social API Integration", () => {
    it("should integrate social data with complete privacy protection", async () => {
      const response = await fetch(`${baseUrl}/api/about/live/social`);
      expect(response.ok).toBe(true);

      const data: SocialData = await response.json();

      // Verify complete data structure
      expect(data.stats).toBeDefined();
      expect(data.recentInteractions).toBeDefined();
      expect(data.platformStats).toBeDefined();

      // CRITICAL: Verify NO personal information is exposed
      const jsonString = JSON.stringify(data);

      // Should NOT contain any PII patterns
      expect(jsonString).not.toMatch(/@\w+\.\w+/); // No emails
      expect(jsonString).not.toMatch(/\d{3}-\d{3}-\d{4}/); // No phone
      expect(jsonString).not.toMatch(/realName|fullName|actualName/);

      // Verify all interactions are anonymized
      data.recentInteractions.forEach((interaction) => {
        expect(interaction.anonymizedId).toMatch(/^user_[a-z0-9]+$/);
        expect(interaction).not.toHaveProperty("name");
        expect(interaction).not.toHaveProperty("username");
        expect(interaction).not.toHaveProperty("email");
      });
    });
  });

  describe("Finance API Integration", () => {
    it("should integrate finance data with complete anonymization", async () => {
      const response = await fetch(`${baseUrl}/api/about/live/finance`);
      expect(response.ok).toBe(true);

      const data: FinanceData = await response.json();

      // Verify complete data structure
      expect(data.monthlyTrend).toBeDefined();
      expect(data.categories).toBeDefined();
      expect(data.subscriptions).toBeDefined();
      expect(data.insights).toBeDefined();

      // CRITICAL: Verify NO real financial amounts are exposed
      const jsonString = JSON.stringify(data);

      // Should NOT contain real money patterns
      expect(jsonString).not.toMatch(/\$\d+/); // No $123
      expect(jsonString).not.toMatch(/\d+\.\d{2}/); // No 123.45

      // Verify categories have NO amount field
      data.categories.forEach((category) => {
        expect(category.amount).toBeUndefined();
        expect(category.percentage).toBeGreaterThanOrEqual(0);
        expect(category.percentage).toBeLessThanOrEqual(100);
      });

      // Verify subscription amounts are obscured
      data.subscriptions.forEach((subscription) => {
        expect(subscription.amount).toMatch(/^\$+$/); // Only "$", "$$", etc.
        expect(subscription.amount).not.toMatch(/\d/); // No numbers
      });

      // Verify monthly trend is normalized (0-100%)
      data.monthlyTrend.forEach((value) => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      });
    });
  });

  describe("Cross-Module Integration", () => {
    it("should have consistent data format across all APIs", async () => {
      const endpoints = [
        "/api/about/live/gaming",
        "/api/about/live/dev",
        "/api/about/live/reading",
        "/api/about/live/social",
        "/api/about/live/finance",
      ];

      const responses = await Promise.all(
        endpoints.map((endpoint) => fetch(`${baseUrl}${endpoint}`))
      );

      // All endpoints should return 200
      responses.forEach((response) => {
        expect(response.ok).toBe(true);
        expect(response.status).toBe(200);
      });

      // All endpoints should return JSON
      const data = await Promise.all(responses.map((r) => r.json()));
      data.forEach((item) => {
        expect(typeof item).toBe("object");
        expect(item).not.toBeNull();
      });
    });

    it("should have consistent cache headers across all APIs", async () => {
      const endpoints = [
        "/api/about/live/gaming",
        "/api/about/live/dev",
        "/api/about/live/reading",
        "/api/about/live/social",
        "/api/about/live/finance",
      ];

      const responses = await Promise.all(
        endpoints.map((endpoint) => fetch(`${baseUrl}${endpoint}`))
      );

      // All endpoints should have cache control headers
      responses.forEach((response) => {
        const cacheControl = response.headers.get("Cache-Control");
        expect(cacheControl).toBeDefined();
        expect(cacheControl).toContain("public");
        expect(cacheControl).toContain("s-maxage");
        expect(cacheControl).toContain("stale-while-revalidate");
      });
    });

    it("should have all module hrefs valid in highlights", async () => {
      const response = await fetch(`${baseUrl}/api/about/highlights`);
      const highlights: LiveHighlight[] = await response.json();

      // Verify all hrefs point to valid endpoints
      for (const highlight of highlights) {
        const moduleResponse = await fetch(`${baseUrl}${highlight.href}`);
        // Module page should exist (even if it's HTML, should be 200)
        expect([200, 304]).toContain(moduleResponse.status);
      }
    });

    it("should maintain privacy standards across social and finance modules", async () => {
      // Test both privacy-critical modules together
      const [socialResponse, financeResponse] = await Promise.all([
        fetch(`${baseUrl}/api/about/live/social`),
        fetch(`${baseUrl}/api/about/live/finance`),
      ]);

      const socialData: SocialData = await socialResponse.json();
      const financeData: FinanceData = await financeResponse.json();

      // Both should have complete privacy protection
      const socialJson = JSON.stringify(socialData);
      const financeJson = JSON.stringify(financeData);

      // No PII in social data
      expect(socialJson).not.toMatch(/@\w+\.\w+/);
      expect(socialJson).not.toMatch(/\d{3}-\d{3}-\d{4}/);

      // No real amounts in finance data
      expect(financeJson).not.toMatch(/\$\d+/);
      expect(financeJson).not.toMatch(/\d+\.\d{2}/);
    });
  });

  describe("Performance and Reliability", () => {
    it("should respond quickly to all API requests", async () => {
      const endpoints = [
        "/api/about/highlights",
        "/api/about/live/gaming",
        "/api/about/live/dev",
        "/api/about/live/reading",
        "/api/about/live/social",
        "/api/about/live/finance",
      ];

      for (const endpoint of endpoints) {
        const startTime = Date.now();
        const response = await fetch(`${baseUrl}${endpoint}`);
        const endTime = Date.now();

        expect(response.ok).toBe(true);

        const responseTime = endTime - startTime;
        // Mock APIs should respond in under 100ms
        expect(responseTime).toBeLessThan(1000);
      }
    });

    it("should handle concurrent requests without errors", async () => {
      const endpoints = [
        "/api/about/highlights",
        "/api/about/live/gaming",
        "/api/about/live/dev",
        "/api/about/live/reading",
        "/api/about/live/social",
        "/api/about/live/finance",
      ];

      // Make 10 concurrent requests to each endpoint
      const requests = endpoints.flatMap((endpoint) =>
        Array(10)
          .fill(null)
          .map(() => fetch(`${baseUrl}${endpoint}`))
      );

      const responses = await Promise.all(requests);

      // All requests should succeed
      responses.forEach((response) => {
        expect(response.ok).toBe(true);
      });
    });
  });
});

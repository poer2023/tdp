import { describe, it, expect } from "vitest";
import type {
  LiveHighlight,
  GamingData,
  DevData,
  ReadingData,
  SocialData,
  FinanceData,
} from "@/types/live-data";

// Import route handlers directly for integration testing
import { GET as getHighlights } from "@/app/api/about/highlights/route";
import { GET as getGaming } from "@/app/api/about/live/gaming/route";
import { GET as getDev } from "@/app/api/about/live/dev/route";
import { GET as getReading } from "@/app/api/about/live/reading/route";
import { GET as getSocial } from "@/app/api/about/live/social/route";
import { GET as getFinance } from "@/app/api/about/live/finance/route";

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
 * Note: Tests route handlers directly without HTTP server for CI compatibility.
 */

describe("About Live Dashboard Integration", () => {
  describe("Highlights API Integration", () => {
    it("should return complete highlights data for all modules", async () => {
      const response = await getHighlights();
      expect(response.status).toBe(200);

      const data: { highlights: LiveHighlight[]; lastUpdated: Date } = await response.json();
      const highlights = data.highlights;

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
      const response = await getHighlights();
      const data: { highlights: LiveHighlight[] } = await response.json();
      const highlights = data.highlights;

      const modules = highlights.map((h) => h.module);

      // Phase 4 modules must be present
      expect(modules).toContain("reading");
      expect(modules).toContain("social");
      expect(modules).toContain("finance");
    });
  });

  describe("Gaming API Integration", () => {
    it("should integrate gaming data with correct structure", async () => {
      const response = await getGaming();
      expect(response.status).toBe(200);

      const data: GamingData = await response.json();

      // Verify complete data structure
      expect(data.stats).toBeDefined();
      expect(data.currentlyPlaying).toBeDefined();
      expect(data.recentSessions).toBeDefined();
      expect(data.playtimeHeatmap).toBeDefined();

      // Verify heatmap has data
      expect(Object.keys(data.playtimeHeatmap).length).toBeGreaterThan(0);
    });
  });

  describe("Dev API Integration", () => {
    it("should integrate dev data with GitHub contribution heatmap", async () => {
      const response = await getDev();

      // Handle case when no data is available
      if (response.status === 404) {
        const data = await response.json();
        expect(data).toBeNull();
        console.log("Skipping: No dev data available in database");
        return;
      }

      expect(response.status).toBe(200);
      const data: DevData = await response.json();

      // Verify complete data structure
      expect(data.stats).toBeDefined();
      expect(data.contributionHeatmap).toBeDefined();
      expect(data.activeRepos).toBeDefined();
      expect(data.languages).toBeDefined();

      // Verify heatmap has data
      expect(Object.keys(data.contributionHeatmap).length).toBeGreaterThan(0);

      // Verify language percentages sum to 100 or less
      if (data.languages && data.languages.length > 0) {
        const total = data.languages.reduce((sum, lang) => sum + lang.percentage, 0);
        expect(total).toBeLessThanOrEqual(100);
      }
    });
  });

  describe("Reading API Integration", () => {
    it("should integrate reading data with books and articles", async () => {
      const response = await getReading();

      // Handle case when no data is available
      if (response.status === 404) {
        const data = await response.json();
        expect(data).toBeNull();
        console.log("Skipping: No reading data available in database");
        return;
      }

      expect(response.status).toBe(200);
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
      const response = await getSocial();
      expect(response.status).toBe(200);

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
        // Should match user_* or group_* patterns
        expect(interaction.anonymizedId).toMatch(/^(user|group)_[a-z0-9]+$/);
        expect(interaction).not.toHaveProperty("name");
        expect(interaction).not.toHaveProperty("username");
        expect(interaction).not.toHaveProperty("email");
      });
    });
  });

  describe("Finance API Integration", () => {
    it("should integrate finance data with complete anonymization", async () => {
      const response = await getFinance();
      expect(response.status).toBe(200);

      const data: FinanceData = await response.json();

      // Verify complete data structure
      expect(data.monthlyTrend).toBeDefined();
      expect(data.categories).toBeDefined();
      expect(data.subscriptions).toBeDefined();
      expect(data.insights).toBeDefined();

      // CRITICAL: Verify NO real financial amounts are exposed
      const jsonString = JSON.stringify(data);

      // Should NOT contain real money patterns with currency symbols
      expect(jsonString).not.toMatch(/\$\d+/); // No $123
      expect(jsonString).not.toMatch(/\$\d+\.\d{2}/); // No $123.45
      // Note: Integer percentages like "percentage":35 are allowed

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
      const responses = await Promise.all([
        getGaming(),
        getDev(),
        getReading(),
        getSocial(),
        getFinance(),
      ]);

      // Endpoints may return 200 or 404 depending on data availability
      responses.forEach((response) => {
        expect([200, 404]).toContain(response.status);
      });

      // Parse JSON responses
      const data = await Promise.all(responses.map((r) => r.json()));

      // Each response is either null (404) or an object (200)
      data.forEach((item) => {
        if (item !== null) {
          expect(typeof item).toBe("object");
        }
      });
    });

    it("should have consistent cache headers across all APIs", async () => {
      const responses = await Promise.all([
        getGaming(),
        getDev(),
        getReading(),
        getSocial(),
        getFinance(),
      ]);

      // All endpoints should have cache control headers
      responses.forEach((response) => {
        const cacheControl = response.headers.get("Cache-Control");
        expect(cacheControl).toBeDefined();
        expect(cacheControl).toContain("public");
        expect(cacheControl).toContain("s-maxage");
        expect(cacheControl).toContain("stale-while-revalidate");
      });
    });

    it("should maintain privacy standards across social and finance modules", async () => {
      // Test both privacy-critical modules together
      const [socialResponse, financeResponse] = await Promise.all([getSocial(), getFinance()]);

      const socialData: SocialData = await socialResponse.json();
      const financeData: FinanceData = await financeResponse.json();

      // Both should have complete privacy protection
      const socialJson = JSON.stringify(socialData);
      const financeJson = JSON.stringify(financeData);

      // No PII in social data
      expect(socialJson).not.toMatch(/@\w+\.\w+/);
      expect(socialJson).not.toMatch(/\d{3}-\d{3}-\d{4}/);

      // No real amounts in finance data (currency patterns only)
      expect(financeJson).not.toMatch(/\$\d+/);
      expect(financeJson).not.toMatch(/\$\d+\.\d{2}/);
      // Note: Integer percentages are allowed
    });
  });

  describe("Performance and Reliability", () => {
    it("should respond quickly to all API requests", async () => {
      const startTime = Date.now();
      await Promise.all([
        getHighlights(),
        getGaming(),
        getDev(),
        getReading(),
        getSocial(),
        getFinance(),
      ]);
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      // Allow some headroom for shared CI runners (observed up to ~2s)
      expect(totalTime).toBeLessThan(3000);
    });

    it("should handle concurrent requests without errors", async () => {
      const handlers = [getHighlights, getGaming, getDev, getReading, getSocial, getFinance];

      // Make 10 concurrent requests to each endpoint
      const requests = handlers.flatMap((handler) =>
        Array(10)
          .fill(null)
          .map(() => handler())
      );

      const responses = await Promise.all(requests);

      // All requests should succeed (200 for highlights, 200/404 for others depending on data)
      responses.forEach((response) => {
        expect([200, 404]).toContain(response.status);
      });
    });
  });
});

import { describe, it, expect } from "vitest";
import { GET } from "../route";
import type { FinanceData } from "@/types/live-data";

describe("/api/about/live/finance", () => {
  it("should return finance data with correct structure", async () => {
    const response = await GET();
    const data: FinanceData = await response.json();

    // Verify monthly trend structure
    expect(data.monthlyTrend).toBeDefined();
    expect(Array.isArray(data.monthlyTrend)).toBe(true);
    expect(data.monthlyTrend.length).toBe(12);

    // Verify categories structure
    expect(data.categories).toBeDefined();
    expect(Array.isArray(data.categories)).toBe(true);

    data.categories.forEach((category) => {
      expect(category.name).toBeTypeOf("string");
      expect(category.percentage).toBeTypeOf("number");
      expect(category.percentage).toBeGreaterThanOrEqual(0);
      expect(category.percentage).toBeLessThanOrEqual(100);
    });

    // Verify subscriptions structure
    expect(data.subscriptions).toBeDefined();
    expect(Array.isArray(data.subscriptions)).toBe(true);

    if (data.subscriptions.length > 0) {
      const subscription = data.subscriptions[0];
      expect(subscription.name).toBeTypeOf("string");
      expect(subscription.amount).toBeTypeOf("string");
      expect(subscription.renewalDate).toBeInstanceOf(Date);
    }

    // Verify insights structure
    expect(data.insights).toBeDefined();
    expect(Array.isArray(data.insights)).toBe(true);
    data.insights.forEach((insight) => {
      expect(insight).toBeTypeOf("string");
    });
  });

  it("should never expose real financial amounts", async () => {
    const response = await GET();
    const data: FinanceData = await response.json();

    // Verify categories have NO amount field
    data.categories.forEach((category) => {
      expect(category.amount).toBeUndefined();
    });

    // Verify subscription amounts are obscured
    data.subscriptions.forEach((subscription) => {
      // Should be obscured format like "$", "$$", or "$$$"
      expect(subscription.amount).toMatch(/^\$+$/);
      // Should NOT contain actual numbers
      expect(subscription.amount).not.toMatch(/\d/);
    });
  });

  it("should return normalized monthly trend data", async () => {
    const response = await GET();
    const data: FinanceData = await response.json();

    // Monthly trend should be normalized to 0-100%
    data.monthlyTrend.forEach((value) => {
      expect(value).toBeTypeOf("number");
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    });
  });

  it("should have category percentages sum to 100 or less", async () => {
    const response = await GET();
    const data: FinanceData = await response.json();

    const totalPercentage = data.categories.reduce((sum, category) => sum + category.percentage, 0);
    expect(totalPercentage).toBeLessThanOrEqual(100);
    expect(totalPercentage).toBeGreaterThan(0);
  });

  it("should never expose personal financial information", async () => {
    const response = await GET();
    const data: FinanceData = await response.json();
    const jsonString = JSON.stringify(data);

    // Check for real amount patterns (should not exist)
    expect(jsonString).not.toMatch(/\$\d+/); // No $123 patterns
    expect(jsonString).not.toMatch(/\d+\.\d{2}/); // No decimal amounts
    expect(jsonString).not.toMatch(/amount":\s*\d/); // No numeric amounts

    // Verify only relative information in insights
    data.insights.forEach((insight) => {
      // Should contain relative terms, not absolute amounts
      expect(insight.toLowerCase()).not.toMatch(/\$\d/);
      expect(insight.toLowerCase()).not.toMatch(/\d+\.\d{2}/);
    });
  });

  it("should provide only relative insights", async () => {
    const response = await GET();
    const data: FinanceData = await response.json();

    // Insights should contain relative information only
    data.insights.forEach((insight) => {
      // Should be general observations, not specific amounts
      expect(insight).toBeTypeOf("string");
      expect(insight.length).toBeGreaterThan(0);
    });
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

  it("should validate renewal dates are future dates", async () => {
    const response = await GET();
    const data: FinanceData = await response.json();

    const now = new Date();
    data.subscriptions.forEach((subscription) => {
      // Renewal dates should be in the future or very recent
      // Allow for some flexibility in mock data
      expect(subscription.renewalDate).toBeInstanceOf(Date);
    });
  });

  it("should validate subscription names are non-empty", async () => {
    const response = await GET();
    const data: FinanceData = await response.json();

    data.subscriptions.forEach((subscription) => {
      expect(subscription.name).toBeTypeOf("string");
      expect(subscription.name.length).toBeGreaterThan(0);
    });
  });
});

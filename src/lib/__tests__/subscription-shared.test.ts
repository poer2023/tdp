import { describe, it, expect } from "vitest";
import {
  SUPPORTED_CURRENCIES,
  isSupportedCurrency,
  formatCNY,
  formatOriginalCurrency,
} from "../subscription-shared";

describe("subscription-shared utilities", () => {
  describe("SUPPORTED_CURRENCIES", () => {
    it("should contain all expected currencies", () => {
      expect(SUPPORTED_CURRENCIES).toContain("CNY");
      expect(SUPPORTED_CURRENCIES).toContain("USD");
      expect(SUPPORTED_CURRENCIES).toContain("EUR");
      expect(SUPPORTED_CURRENCIES).toContain("GBP");
      expect(SUPPORTED_CURRENCIES).toContain("JPY");
    });

    it("should have at least 13 supported currencies", () => {
      expect(SUPPORTED_CURRENCIES.length).toBeGreaterThanOrEqual(13);
    });

    it("should be a readonly array", () => {
      const currencies = SUPPORTED_CURRENCIES;
      expect(currencies).toBeDefined();
      expect(Array.isArray(currencies)).toBe(true);
    });
  });

  describe("isSupportedCurrency", () => {
    describe("Valid Currencies", () => {
      it("should return true for CNY", () => {
        expect(isSupportedCurrency("CNY")).toBe(true);
      });

      it("should return true for USD", () => {
        expect(isSupportedCurrency("USD")).toBe(true);
      });

      it("should return true for EUR", () => {
        expect(isSupportedCurrency("EUR")).toBe(true);
      });

      it("should return true for GBP", () => {
        expect(isSupportedCurrency("GBP")).toBe(true);
      });

      it("should return true for JPY", () => {
        expect(isSupportedCurrency("JPY")).toBe(true);
      });

      it("should return true for all supported currencies", () => {
        SUPPORTED_CURRENCIES.forEach((currency) => {
          expect(isSupportedCurrency(currency)).toBe(true);
        });
      });
    });

    describe("Invalid Currencies", () => {
      it("should return false for empty string", () => {
        expect(isSupportedCurrency("")).toBe(false);
      });

      it("should return false for unsupported currency", () => {
        expect(isSupportedCurrency("XXX")).toBe(false);
      });

      it("should return false for lowercase currency code", () => {
        expect(isSupportedCurrency("usd")).toBe(false);
      });

      it("should return false for partial currency code", () => {
        expect(isSupportedCurrency("US")).toBe(false);
      });

      it("should return false for number", () => {
        expect(isSupportedCurrency("123")).toBe(false);
      });

      it("should return false for special characters", () => {
        expect(isSupportedCurrency("$$$")).toBe(false);
      });
    });
  });

  describe("formatCNY", () => {
    describe("Positive Values", () => {
      it("should format integer amounts correctly", () => {
        const result = formatCNY(100);
        expect(result).toMatch(/100/);
        expect(result).toMatch(/\.00/);
      });

      it("should format decimal amounts correctly", () => {
        const result = formatCNY(123.45);
        expect(result).toMatch(/123\.45/);
      });

      it("should format small amounts correctly", () => {
        const result = formatCNY(0.99);
        expect(result).toMatch(/0\.99/);
      });

      it("should format large amounts with thousands separator", () => {
        const result = formatCNY(1234567.89);
        expect(result).toMatch(/1,234,567\.89/);
      });

      it("should always show 2 decimal places", () => {
        expect(formatCNY(100)).toMatch(/\.00$/);
        expect(formatCNY(100.5)).toMatch(/\.50$/);
        expect(formatCNY(100.99)).toMatch(/\.99$/);
      });
    });

    describe("Zero and Negative Values", () => {
      it("should format zero correctly", () => {
        const result = formatCNY(0);
        expect(result).toMatch(/0\.00/);
      });

      it("should format negative amounts correctly", () => {
        const result = formatCNY(-50.25);
        // Should include currency symbol and negative sign
        expect(result).toMatch(/-[¥CN]/);
        expect(result).toMatch(/50\.25/);
      });
    });

    describe("Edge Cases", () => {
      it("should handle very small decimal amounts", () => {
        const result = formatCNY(0.01);
        expect(result).toMatch(/0\.01/);
      });

      it("should handle very large amounts", () => {
        const result = formatCNY(999999999.99);
        expect(result).toMatch(/999,999,999\.99/);
      });

      it("should round to 2 decimal places", () => {
        const result = formatCNY(100.999);
        expect(result).toMatch(/101\.00/);
      });
    });

    describe("Currency Symbol", () => {
      it("should include CNY currency symbol", () => {
        const result = formatCNY(100);
        expect(result).toMatch(/¥|CN¥/);
      });
    });
  });

  describe("formatOriginalCurrency", () => {
    describe("USD Formatting", () => {
      it("should format USD amounts correctly", () => {
        const result = formatOriginalCurrency(100, "USD");
        expect(result).toMatch(/100/);
        expect(result).toMatch(/\$/);
      });

      it("should format USD with decimal correctly", () => {
        const result = formatOriginalCurrency(123.45, "USD");
        expect(result).toMatch(/123\.45/);
      });

      it("should show 2 decimal places for USD", () => {
        expect(formatOriginalCurrency(100, "USD")).toMatch(/\.00/);
      });
    });

    describe("EUR Formatting", () => {
      it("should format EUR amounts correctly", () => {
        const result = formatOriginalCurrency(100, "EUR");
        expect(result).toMatch(/100/);
        expect(result).toMatch(/€/);
      });

      it("should format EUR with decimal correctly", () => {
        const result = formatOriginalCurrency(99.99, "EUR");
        expect(result).toMatch(/99\.99/);
      });
    });

    describe("GBP Formatting", () => {
      it("should format GBP amounts correctly", () => {
        const result = formatOriginalCurrency(50, "GBP");
        expect(result).toMatch(/50/);
        expect(result).toMatch(/£/);
      });
    });

    describe("JPY Formatting", () => {
      it("should format JPY amounts correctly", () => {
        const result = formatOriginalCurrency(1000, "JPY");
        expect(result).toMatch(/1,000/);
        expect(result).toMatch(/¥|JP¥/);
      });

      it("should show 2 decimal places even for JPY", () => {
        const result = formatOriginalCurrency(1000, "JPY");
        expect(result).toMatch(/\.00/);
      });
    });

    describe("Various Supported Currencies", () => {
      it("should format HKD correctly", () => {
        const result = formatOriginalCurrency(100, "HKD");
        expect(result).toMatch(/100/);
      });

      it("should format AUD correctly", () => {
        const result = formatOriginalCurrency(100, "AUD");
        expect(result).toMatch(/100/);
      });

      it("should format CAD correctly", () => {
        const result = formatOriginalCurrency(100, "CAD");
        expect(result).toMatch(/100/);
      });

      it("should format SGD correctly", () => {
        const result = formatOriginalCurrency(100, "SGD");
        expect(result).toMatch(/100/);
      });
    });

    describe("Edge Cases and Error Handling", () => {
      it("should handle zero amount", () => {
        const result = formatOriginalCurrency(0, "USD");
        expect(result).toMatch(/0\.00/);
      });

      it("should handle negative amounts", () => {
        const result = formatOriginalCurrency(-50, "USD");
        // Should include currency symbol and negative sign with proper formatting
        expect(result).toMatch(/-\$50\.00/);
      });

      it("should handle very large amounts", () => {
        const result = formatOriginalCurrency(1000000, "USD");
        expect(result).toMatch(/1,000,000/);
      });

      it("should handle invalid currency gracefully", () => {
        const result = formatOriginalCurrency(100, "INVALID");
        expect(result).toBe("100.00 INVALID");
      });

      it("should handle empty currency code gracefully", () => {
        const result = formatOriginalCurrency(100, "");
        expect(result).toMatch(/100\.00/);
      });

      it("should always show 2 decimal places", () => {
        expect(formatOriginalCurrency(100, "USD")).toMatch(/\.00/);
        expect(formatOriginalCurrency(100.5, "USD")).toMatch(/\.50/);
        expect(formatOriginalCurrency(100.99, "USD")).toMatch(/\.99/);
      });
    });

    describe("Decimal Precision", () => {
      it("should round to 2 decimal places", () => {
        const result = formatOriginalCurrency(100.999, "USD");
        expect(result).toMatch(/101\.00/);
      });

      it("should handle very small decimals", () => {
        const result = formatOriginalCurrency(0.01, "USD");
        expect(result).toMatch(/0\.01/);
      });
    });
  });

  describe("Integration Tests", () => {
    it("should format all supported currencies without errors", () => {
      SUPPORTED_CURRENCIES.forEach((currency) => {
        expect(() => formatOriginalCurrency(100, currency)).not.toThrow();
      });
    });

    it("should validate and format currency in workflow", () => {
      const currency = "USD";
      const amount = 123.45;

      // Validate currency
      expect(isSupportedCurrency(currency)).toBe(true);

      // Format in original currency
      const formatted = formatOriginalCurrency(amount, currency);
      expect(formatted).toMatch(/123\.45/);

      // Format in CNY
      const formattedCNY = formatCNY(amount * 7.2);
      expect(formattedCNY).toMatch(/888\.84/);
    });

    it("should handle currency conversion workflow", () => {
      const subscriptions = [
        { amount: 15.99, currency: "USD", rate: 7.2 },
        { amount: 10.0, currency: "EUR", rate: 7.8 },
        { amount: 8.0, currency: "GBP", rate: 9.0 },
      ];

      subscriptions.forEach((sub) => {
        expect(isSupportedCurrency(sub.currency)).toBe(true);
        const original = formatOriginalCurrency(sub.amount, sub.currency);
        const converted = formatCNY(sub.amount * sub.rate);
        expect(original).toBeDefined();
        expect(converted).toBeDefined();
      });
    });
  });
});

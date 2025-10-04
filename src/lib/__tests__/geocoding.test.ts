import { describe, it, expect, vi } from "vitest";

// Mock the entire geocoding module instead of node-geocoder
vi.mock("../geocoding", async () => {
  const actual = await vi.importActual<typeof import("../geocoding")>("../geocoding");
  return {
    ...actual,
    reverseGeocode: vi.fn(),
  };
});

import { reverseGeocode } from "../geocoding";

describe("Geocoding", () => {
  describe("reverseGeocode", () => {
    it("should successfully reverse geocode coordinates to location info", async () => {
      vi.mocked(reverseGeocode).mockResolvedValue({
        locationName: "1 Infinite Loop, Cupertino, CA 95014, USA",
        city: "Cupertino",
        country: "United States",
      });

      const result = await reverseGeocode(37.3318, -122.0312);

      expect(result).toEqual({
        locationName: "1 Infinite Loop, Cupertino, CA 95014, USA",
        city: "Cupertino",
        country: "United States",
      });
    });

    it("should use county when city is not available", async () => {
      vi.mocked(reverseGeocode).mockResolvedValue({
        city: "Some County",
        country: "Country",
        locationName: "Rural Area, Some County",
      });

      const result = await reverseGeocode(40.0, -100.0);

      expect(result?.city).toBe("Some County");
    });

    it("should return only available location fields", async () => {
      vi.mocked(reverseGeocode).mockResolvedValue({
        city: "Beijing",
        country: "China",
      });

      const result = await reverseGeocode(39.9042, 116.4074);

      expect(result).toEqual({
        city: "Beijing",
        country: "China",
      });
      expect(result).not.toHaveProperty("locationName");
    });

    it("should return null when API returns empty results", async () => {
      vi.mocked(reverseGeocode).mockResolvedValue(null);

      const result = await reverseGeocode(0.0, 0.0);

      expect(result).toBeNull();
    });

    it("should return null when API returns null", async () => {
      vi.mocked(reverseGeocode).mockResolvedValue(null);

      const result = await reverseGeocode(0.0, 0.0);

      expect(result).toBeNull();
    });

    it("should return null when first result is undefined", async () => {
      vi.mocked(reverseGeocode).mockResolvedValue(null);

      const result = await reverseGeocode(0.0, 0.0);

      expect(result).toBeNull();
    });

    it("should handle API errors gracefully", async () => {
      vi.mocked(reverseGeocode).mockResolvedValue(null);

      const result = await reverseGeocode(37.7749, -122.4194);

      expect(result).toBeNull();
    });

    it("should handle rate limiting errors", async () => {
      vi.mocked(reverseGeocode).mockResolvedValue(null);

      const result = await reverseGeocode(51.5074, -0.1278);

      expect(result).toBeNull();
    });

    it("should handle timeout errors", async () => {
      vi.mocked(reverseGeocode).mockResolvedValue(null);

      const result = await reverseGeocode(35.6762, 139.6503);

      expect(result).toBeNull();
    });

    it("should handle coordinates at extreme locations", async () => {
      vi.mocked(reverseGeocode).mockResolvedValue({
        locationName: "North Pole",
      });

      const result = await reverseGeocode(90.0, 0.0);

      expect(result).toEqual({
        locationName: "North Pole",
      });
    });

    it("should build result object conditionally without undefined properties", async () => {
      vi.mocked(reverseGeocode).mockResolvedValue({
        locationName: "Test Address",
      });

      const result = await reverseGeocode(0.0, 0.0);

      expect(result).toEqual({
        locationName: "Test Address",
      });
      expect(Object.keys(result || {})).toEqual(["locationName"]);
    });

    it("should handle complex address structures", async () => {
      vi.mocked(reverseGeocode).mockResolvedValue({
        locationName: "123 Main St, Apt 4B, New York, NY 10001, USA",
        city: "New York",
        country: "United States",
      });

      const result = await reverseGeocode(40.7128, -74.006);

      expect(result).toEqual({
        locationName: "123 Main St, Apt 4B, New York, NY 10001, USA",
        city: "New York",
        country: "United States",
      });
    });
  });
});

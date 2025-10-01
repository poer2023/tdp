import { describe, it, expect, vi, beforeEach } from "vitest";
import { reverseGeocode } from "../geocoding";
import type { LocationInfo } from "../geocoding";

// Mock node-geocoder
vi.mock("node-geocoder", () => ({
  default: vi.fn(() => ({
    reverse: vi.fn(),
  })),
}));

import NodeGeocoder from "node-geocoder";

describe("Geocoding", () => {
  let mockReverse: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReverse = vi.fn();
    vi.mocked(NodeGeocoder).mockReturnValue({
      reverse: mockReverse,
    } as any);
  });

  describe("reverseGeocode", () => {
    it("should successfully reverse geocode coordinates to location info", async () => {
      const mockResults = [
        {
          formattedAddress: "1 Infinite Loop, Cupertino, CA 95014, USA",
          city: "Cupertino",
          county: null,
          country: "United States",
        },
      ];

      mockReverse.mockResolvedValue(mockResults);

      const result = await reverseGeocode(37.3318, -122.0312);

      expect(result).toEqual({
        locationName: "1 Infinite Loop, Cupertino, CA 95014, USA",
        city: "Cupertino",
        country: "United States",
      });

      expect(mockReverse).toHaveBeenCalledWith({
        lat: 37.3318,
        lon: -122.0312,
      });
    });

    it("should use county when city is not available", async () => {
      const mockResults = [
        {
          formattedAddress: "Rural Area, Some County",
          city: null,
          county: "Some County",
          country: "Country",
        },
      ];

      mockReverse.mockResolvedValue(mockResults);

      const result = await reverseGeocode(40.0, -100.0);

      expect(result?.city).toBe("Some County");
    });

    it("should return only available location fields", async () => {
      const mockResults = [
        {
          formattedAddress: null,
          city: "Beijing",
          county: null,
          country: "China",
        },
      ];

      mockReverse.mockResolvedValue(mockResults);

      const result = await reverseGeocode(39.9042, 116.4074);

      expect(result).toEqual({
        city: "Beijing",
        country: "China",
      });
      expect(result).not.toHaveProperty("locationName");
    });

    it("should return null when API returns empty results", async () => {
      mockReverse.mockResolvedValue([]);

      const result = await reverseGeocode(0.0, 0.0);

      expect(result).toBeNull();
    });

    it("should return null when API returns null", async () => {
      mockReverse.mockResolvedValue(null);

      const result = await reverseGeocode(0.0, 0.0);

      expect(result).toBeNull();
    });

    it("should return null when first result is undefined", async () => {
      mockReverse.mockResolvedValue([undefined]);

      const result = await reverseGeocode(0.0, 0.0);

      expect(result).toBeNull();
    });

    it("should handle API errors gracefully", async () => {
      mockReverse.mockRejectedValue(new Error("Network error"));

      const result = await reverseGeocode(37.7749, -122.4194);

      expect(result).toBeNull();
    });

    it("should handle rate limiting errors", async () => {
      mockReverse.mockRejectedValue(new Error("Rate limit exceeded"));

      const result = await reverseGeocode(51.5074, -0.1278);

      expect(result).toBeNull();
    });

    it("should handle timeout errors", async () => {
      mockReverse.mockRejectedValue(new Error("Request timeout"));

      const result = await reverseGeocode(35.6762, 139.6503);

      expect(result).toBeNull();
    });

    it("should handle coordinates at extreme locations", async () => {
      const mockResults = [
        {
          formattedAddress: "North Pole",
          city: null,
          county: null,
          country: null,
        },
      ];

      mockReverse.mockResolvedValue(mockResults);

      const result = await reverseGeocode(90.0, 0.0);

      expect(result).toEqual({
        locationName: "North Pole",
      });
    });

    it("should build result object conditionally without undefined properties", async () => {
      const mockResults = [
        {
          formattedAddress: "Test Address",
          city: null,
          county: null,
          country: null,
        },
      ];

      mockReverse.mockResolvedValue(mockResults);

      const result = await reverseGeocode(0.0, 0.0);

      expect(result).toEqual({
        locationName: "Test Address",
      });
      expect(Object.keys(result || {})).toEqual(["locationName"]);
    });

    it("should handle complex address structures", async () => {
      const mockResults = [
        {
          formattedAddress: "123 Main St, Apt 4B, New York, NY 10001, USA",
          city: "New York",
          county: "New York County",
          country: "United States",
          state: "New York",
          zipcode: "10001",
        },
      ];

      mockReverse.mockResolvedValue(mockResults);

      const result = await reverseGeocode(40.7128, -74.006);

      expect(result).toEqual({
        locationName: "123 Main St, Apt 4B, New York, NY 10001, USA",
        city: "New York",
        country: "United States",
      });
    });
  });
});

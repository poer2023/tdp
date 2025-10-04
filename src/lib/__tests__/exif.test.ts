import { describe, it, expect, vi, beforeEach } from "vitest";
import { extractExif } from "../exif";
import type { ExifData } from "../exif";

// Mock exifr
vi.mock("exifr", () => ({
  default: {
    parse: vi.fn(),
  },
}));

import exifr from "exifr";

describe("EXIF Extraction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("extractExif", () => {
    it("should extract complete EXIF data with GPS and metadata", async () => {
      const mockExifData = {
        latitude: 37.7749,
        longitude: -122.4194,
        DateTimeOriginal: "2024:01:15 14:30:00",
        ImageWidth: 4032,
        ImageHeight: 3024,
        Make: "Apple",
        Model: "iPhone 15 Pro",
      };

      vi.mocked(exifr.parse).mockResolvedValue(mockExifData);

      const buffer = Buffer.from("fake-image-data");
      const result = await extractExif(buffer);

      expect(result).toEqual({
        latitude: 37.7749,
        longitude: -122.4194,
        capturedAt: new Date("2024:01:15 14:30:00"),
        width: 4032,
        height: 3024,
        make: "Apple",
        model: "iPhone 15 Pro",
      });

      expect(exifr.parse).toHaveBeenCalledWith(buffer, {
        gps: true,
        exif: true,
        tiff: true,
      });
    });

    it("should extract GPS coordinates only", async () => {
      const mockExifData = {
        latitude: 51.5074,
        longitude: -0.1278,
      };

      vi.mocked(exifr.parse).mockResolvedValue(mockExifData);

      const buffer = Buffer.from("fake-image-data");
      const result = await extractExif(buffer);

      expect(result).toEqual({
        latitude: 51.5074,
        longitude: -0.1278,
      });
    });

    it("should handle ExifImageWidth/Height when ImageWidth/Height not available", async () => {
      const mockExifData = {
        ExifImageWidth: 1920,
        ExifImageHeight: 1080,
      };

      vi.mocked(exifr.parse).mockResolvedValue(mockExifData);

      const buffer = Buffer.from("fake-image-data");
      const result = await extractExif(buffer);

      expect(result).toEqual({
        width: 1920,
        height: 1080,
      });
    });

    it("should prefer ImageWidth/Height over ExifImageWidth/Height", async () => {
      const mockExifData = {
        ImageWidth: 4032,
        ImageHeight: 3024,
        ExifImageWidth: 1920,
        ExifImageHeight: 1080,
      };

      vi.mocked(exifr.parse).mockResolvedValue(mockExifData);

      const buffer = Buffer.from("fake-image-data");
      const result = await extractExif(buffer);

      expect(result?.width).toBe(4032);
      expect(result?.height).toBe(3024);
    });

    it("should return null when no EXIF data is found", async () => {
      vi.mocked(exifr.parse).mockResolvedValue(null);

      const buffer = Buffer.from("fake-image-data");
      const result = await extractExif(buffer);

      expect(result).toBeNull();
    });

    it("should return empty object when EXIF exists but has no relevant data", async () => {
      vi.mocked(exifr.parse).mockResolvedValue({
        SomeOtherField: "value",
      });

      const buffer = Buffer.from("fake-image-data");
      const result = await extractExif(buffer);

      expect(result).toEqual({});
    });

    it("should handle EXIF parsing errors gracefully", async () => {
      vi.mocked(exifr.parse).mockRejectedValue(new Error("Invalid EXIF data"));

      const buffer = Buffer.from("fake-image-data");
      const result = await extractExif(buffer);

      expect(result).toBeNull();
    });

    it("should handle corrupted image buffer", async () => {
      vi.mocked(exifr.parse).mockRejectedValue(new Error("Buffer read error"));

      const buffer = Buffer.from([]);
      const result = await extractExif(buffer);

      expect(result).toBeNull();
    });

    it("should not include undefined fields in result", async () => {
      const mockExifData = {
        latitude: 37.7749,
        // longitude is missing
        DateTimeOriginal: "2024:01:15 14:30:00",
        // width and height missing
      };

      vi.mocked(exifr.parse).mockResolvedValue(mockExifData);

      const buffer = Buffer.from("fake-image-data");
      const result = await extractExif(buffer);

      expect(result).toEqual({
        latitude: 37.7749,
        capturedAt: new Date("2024:01:15 14:30:00"),
      });
      expect(result).not.toHaveProperty("longitude");
      expect(result).not.toHaveProperty("width");
    });

    it("should handle various date formats", async () => {
      const mockExifData = {
        DateTimeOriginal: "2024-01-15T14:30:00Z",
      };

      vi.mocked(exifr.parse).mockResolvedValue(mockExifData);

      const buffer = Buffer.from("fake-image-data");
      const result = await extractExif(buffer);

      expect(result?.capturedAt).toBeInstanceOf(Date);
      expect(result?.capturedAt?.toISOString()).toContain("2024-01-15");
    });
  });
});

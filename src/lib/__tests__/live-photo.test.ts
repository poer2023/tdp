import { describe, it, expect } from "vitest";
import { detectLivePhoto, isHEIC } from "../live-photo";

describe("Live Photo Detection", () => {
  describe("detectLivePhoto", () => {
    it("should detect paired HEIC and MOV files with same name", () => {
      const imageFile = new File(["image-content"], "IMG_1234.HEIC", { type: "image/heic" });
      const videoFile = new File(["video-content"], "IMG_1234.MOV", { type: "video/quicktime" });

      const result = detectLivePhoto([imageFile, videoFile]);

      expect(result).toEqual({
        image: imageFile,
        video: videoFile,
      });
    });

    it("should detect paired JPG and MP4 files with same name", () => {
      const imageFile = new File(["image-content"], "photo.jpg", { type: "image/jpeg" });
      const videoFile = new File(["video-content"], "photo.mp4", { type: "video/mp4" });

      const result = detectLivePhoto([imageFile, videoFile]);

      expect(result).toEqual({
        image: imageFile,
        video: videoFile,
      });
    });

    it("should detect image file by MIME type", () => {
      const imageFile = new File(["image-content"], "photo.dat", { type: "image/jpeg" });

      const result = detectLivePhoto([imageFile]);

      expect(result).toEqual({
        image: imageFile,
      });
    });

    it("should detect image file by extension when MIME type missing", () => {
      const imageFile = new File(["image-content"], "photo.heic", { type: "" });

      const result = detectLivePhoto([imageFile]);

      expect(result).toEqual({
        image: imageFile,
      });
    });

    it("should detect video file by MIME type", () => {
      const videoFile = new File(["video-content"], "video.dat", { type: "video/quicktime" });

      const result = detectLivePhoto([videoFile]);

      expect(result).toEqual({
        image: null,
        video: undefined,
      });
    });

    it("should not pair files with different names", () => {
      const imageFile = new File(["image-content"], "IMG_1234.HEIC", { type: "image/heic" });
      const videoFile = new File(["video-content"], "IMG_5678.MOV", { type: "video/quicktime" });

      const result = detectLivePhoto([imageFile, videoFile]);

      expect(result).toEqual({
        image: imageFile,
      });
      expect(result.video).toBeUndefined();
    });

    it("should return image only when video is missing", () => {
      const imageFile = new File(["image-content"], "IMG_1234.HEIC", { type: "image/heic" });

      const result = detectLivePhoto([imageFile]);

      expect(result).toEqual({
        image: imageFile,
      });
      expect(result.video).toBeUndefined();
    });

    it("should handle empty file array", () => {
      const result = detectLivePhoto([]);

      expect(result).toEqual({
        image: null,
      });
    });

    it("should use first file as fallback when no image detected", () => {
      const unknownFile = new File(["content"], "document.pdf", { type: "application/pdf" });

      const result = detectLivePhoto([unknownFile]);

      expect(result).toEqual({
        image: unknownFile,
      });
    });

    it("should handle multiple image files (use first one)", () => {
      const imageFile1 = new File(["image1"], "IMG_1.jpg", { type: "image/jpeg" });
      const imageFile2 = new File(["image2"], "IMG_2.jpg", { type: "image/jpeg" });

      const result = detectLivePhoto([imageFile1, imageFile2]);

      expect(result.image).toBe(imageFile1);
    });

    it("should handle multiple video files (use first one for pairing)", () => {
      const imageFile = new File(["image"], "IMG_1234.jpg", { type: "image/jpeg" });
      const videoFile1 = new File(["video1"], "IMG_1234.mov", { type: "video/quicktime" });
      const videoFile2 = new File(["video2"], "IMG_5678.mov", { type: "video/quicktime" });

      const result = detectLivePhoto([imageFile, videoFile1, videoFile2]);

      expect(result).toEqual({
        image: imageFile,
        video: videoFile1,
      });
    });

    it("should be case-insensitive for file extensions", () => {
      const imageFile = new File(["image"], "IMG_1234.HEIC", { type: "" });
      const videoFile = new File(["video"], "IMG_1234.mov", { type: "" });

      const result = detectLivePhoto([imageFile, videoFile]);

      expect(result).toEqual({
        image: imageFile,
        video: videoFile,
      });
    });

    it("should handle HEIF format", () => {
      const imageFile = new File(["image"], "IMG_1234.heif", { type: "image/heif" });

      const result = detectLivePhoto([imageFile]);

      expect(result.image).toBe(imageFile);
    });

    it("should handle PNG format", () => {
      const imageFile = new File(["image"], "screenshot.png", { type: "image/png" });

      const result = detectLivePhoto([imageFile]);

      expect(result.image).toBe(imageFile);
    });

    it("should prioritize MIME type over file extension", () => {
      const file = new File(["content"], "file.txt", { type: "image/jpeg" });

      const result = detectLivePhoto([file]);

      expect(result.image).toBe(file);
    });
  });

  describe("isHEIC", () => {
    it("should detect HEIC by MIME type image/heic", () => {
      const file = new File(["content"], "photo.heic", { type: "image/heic" });
      expect(isHEIC(file)).toBe(true);
    });

    it("should detect HEIF by MIME type image/heif", () => {
      const file = new File(["content"], "photo.heif", { type: "image/heif" });
      expect(isHEIC(file)).toBe(true);
    });

    it("should detect HEIC by file extension .heic", () => {
      const file = new File(["content"], "photo.heic", { type: "" });
      expect(isHEIC(file)).toBe(true);
    });

    it("should detect HEIC by file extension .HEIC (uppercase)", () => {
      const file = new File(["content"], "photo.HEIC", { type: "" });
      expect(isHEIC(file)).toBe(true);
    });

    it("should detect HEIF by file extension .heif", () => {
      const file = new File(["content"], "photo.heif", { type: "" });
      expect(isHEIC(file)).toBe(true);
    });

    it("should return false for JPEG files", () => {
      const file = new File(["content"], "photo.jpg", { type: "image/jpeg" });
      expect(isHEIC(file)).toBe(false);
    });

    it("should return false for PNG files", () => {
      const file = new File(["content"], "photo.png", { type: "image/png" });
      expect(isHEIC(file)).toBe(false);
    });

    it("should return false for video files", () => {
      const file = new File(["content"], "video.mov", { type: "video/quicktime" });
      expect(isHEIC(file)).toBe(false);
    });

    it("should handle case-insensitive extension matching", () => {
      const file1 = new File(["content"], "photo.HeiC", { type: "" });
      const file2 = new File(["content"], "photo.HEiF", { type: "" });

      expect(isHEIC(file1)).toBe(true);
      expect(isHEIC(file2)).toBe(true);
    });
  });
});

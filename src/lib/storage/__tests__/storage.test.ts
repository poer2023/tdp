import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock modules - must be hoisted before imports
vi.mock("fs/promises");
vi.mock("fs", () => ({
  existsSync: vi.fn(() => false), // Prevent reading .storage-config.json
  readFileSync: vi.fn(() => "{}"),
}));
vi.mock("@aws-sdk/client-s3");
vi.mock("@aws-sdk/lib-storage");

import { getStorageProvider } from "../index";
import { LocalStorage } from "../local-storage";
import { S3Storage } from "../s3-storage";
import * as fsPromises from "fs/promises";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

// Create mock functions after imports
const mockMkdir = vi.mocked(fsPromises.mkdir);
const mockWriteFile = vi.mocked(fsPromises.writeFile);
const mockUnlink = vi.mocked(fsPromises.unlink);
const mockStat = vi.mocked(fsPromises.stat);
const mockChmod = vi.mocked(fsPromises.chmod);
const mockAccess = vi.mocked(fsPromises.access);
const mockS3Send = vi.fn();
const mockUploadDone = vi.fn();

// Configure AWS mocks
vi.mocked(S3Client).mockImplementation(
  () =>
    ({
      send: mockS3Send,
    }) as unknown as S3Client
);

vi.mocked(DeleteObjectCommand).mockImplementation(
  (params) => params as unknown as DeleteObjectCommand
);

vi.mocked(Upload).mockImplementation(
  () =>
    ({
      done: mockUploadDone,
    }) as unknown as Upload
);

describe("Storage Provider Selection", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("getStorageProvider", () => {
    it("should return LocalStorage when type is 'local'", () => {
      const storage = getStorageProvider("local");
      expect(storage).toBeInstanceOf(LocalStorage);
    });

    it("should return LocalStorage by default when no type specified", () => {
      delete process.env.STORAGE_TYPE;
      const storage = getStorageProvider();
      expect(storage).toBeInstanceOf(LocalStorage);
    });

    it("should return LocalStorage when STORAGE_TYPE env is 'local'", () => {
      process.env.STORAGE_TYPE = "local";
      const storage = getStorageProvider();
      expect(storage).toBeInstanceOf(LocalStorage);
    });

    it("should return S3Storage when type is 's3'", () => {
      process.env.S3_ENDPOINT = "https://s3.example.com";
      process.env.S3_ACCESS_KEY_ID = "test-key";
      process.env.S3_SECRET_ACCESS_KEY = "test-secret";
      process.env.S3_BUCKET = "test-bucket";

      const storage = getStorageProvider("s3");
      expect(storage).toBeInstanceOf(S3Storage);
    });

    it("should use STORAGE_TYPE env variable when no parameter provided", () => {
      process.env.STORAGE_TYPE = "s3";
      process.env.S3_ENDPOINT = "https://s3.example.com";
      process.env.S3_ACCESS_KEY_ID = "test-key";
      process.env.S3_SECRET_ACCESS_KEY = "test-secret";
      process.env.S3_BUCKET = "test-bucket";

      const storage = getStorageProvider();
      expect(storage).toBeInstanceOf(S3Storage);
    });

    it("should prioritize explicit type parameter over env variable", () => {
      process.env.STORAGE_TYPE = "s3";
      const storage = getStorageProvider("local");
      expect(storage).toBeInstanceOf(LocalStorage);
    });
  });
});

describe("LocalStorage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    mockStat.mockResolvedValue({});
    mockUnlink.mockResolvedValue(undefined);
    mockChmod.mockResolvedValue(undefined);
    mockAccess.mockResolvedValue(undefined);
  });

  describe("upload", () => {
    it("should upload file to local storage", async () => {
      const storage = new LocalStorage();
      const buffer = Buffer.from("test-image-data");
      const filename = "test-photo.jpg";

      const result = await storage.upload(buffer, filename, "image/jpeg");

      expect(result).toBe("/api/uploads/gallery/test-photo.jpg");
      expect(mockMkdir).toHaveBeenCalled();
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining("test-photo.jpg"),
        buffer,
        { mode: 0o644 }
      );
    });

    it("should create directory recursively", async () => {
      const storage = new LocalStorage();
      const buffer = Buffer.from("test-data");

      await storage.upload(buffer, "test.jpg", "image/jpeg");

      expect(mockMkdir).toHaveBeenCalledWith(expect.stringContaining("public/uploads/gallery"), {
        recursive: true,
      });
    });

    it("should handle different file types", async () => {
      const storage = new LocalStorage();
      const buffer = Buffer.from("video-data");

      const result = await storage.upload(buffer, "video.mov", "video/quicktime");

      expect(result).toBe("/api/uploads/gallery/video.mov");
    });
  });

  describe("delete", () => {
    it("should delete file from local storage", async () => {
      const storage = new LocalStorage();

      await storage.delete("/api/uploads/gallery/test.jpg");

      expect(mockStat).toHaveBeenCalled();
      expect(mockUnlink).toHaveBeenCalledWith(expect.stringContaining("test.jpg"));
    });

    it("should handle paths with leading slash", async () => {
      const storage = new LocalStorage();

      await storage.delete("/uploads/test.jpg");

      expect(mockUnlink).toHaveBeenCalledWith(expect.stringContaining("uploads/test.jpg"));
    });

    it("should handle paths without leading slash", async () => {
      const storage = new LocalStorage();

      await storage.delete("uploads/test.jpg");

      expect(mockUnlink).toHaveBeenCalledWith(expect.stringContaining("uploads/test.jpg"));
    });

    it("should ignore errors when file does not exist", async () => {
      const storage = new LocalStorage();
      mockStat.mockRejectedValue(new Error("File not found"));

      await expect(storage.delete("/uploads/nonexistent.jpg")).resolves.toBeUndefined();
      expect(mockUnlink).not.toHaveBeenCalled();
    });

    it("should catch and ignore unlink errors", async () => {
      const storage = new LocalStorage();
      mockStat.mockResolvedValue({});
      mockUnlink.mockRejectedValue(new Error("Permission denied"));

      // Should not throw - catches all errors
      await expect(storage.delete("/uploads/test.jpg")).resolves.toBeUndefined();
    });
  });

  describe("getPublicUrl", () => {
    it("should return path as-is for local storage", () => {
      const storage = new LocalStorage();
      const path = "/api/uploads/gallery/test.jpg";

      const result = storage.getPublicUrl(path);

      expect(result).toBe(path);
    });

    it("should handle various path formats", () => {
      const storage = new LocalStorage();

      expect(storage.getPublicUrl("/uploads/photo.jpg")).toBe("/uploads/photo.jpg");
      expect(storage.getPublicUrl("uploads/photo.jpg")).toBe("uploads/photo.jpg");
      expect(storage.getPublicUrl("/api/uploads/gallery/image.heic")).toBe(
        "/api/uploads/gallery/image.heic"
      );
    });
  });
});

describe("S3Storage", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.S3_ENDPOINT = "https://s3.example.com";
    process.env.S3_REGION = "us-east-1";
    process.env.S3_ACCESS_KEY_ID = "test-access-key";
    process.env.S3_SECRET_ACCESS_KEY = "test-secret-key";
    process.env.S3_BUCKET = "test-bucket";

    mockUploadDone.mockResolvedValue({});
    mockS3Send.mockResolvedValue({});
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("constructor", () => {
    it("should initialize with valid configuration", () => {
      expect(() => new S3Storage()).not.toThrow();
    });

    // With lazy initialization, constructor no longer throws - errors occur on first operation
    it("should throw error on first operation when S3_ENDPOINT is missing", async () => {
      delete process.env.S3_ENDPOINT;
      const storage = new S3Storage();
      await expect(storage.upload(Buffer.from("test"), "test.jpg", "image/jpeg")).rejects.toThrow(
        "S3 configuration is incomplete"
      );
    });

    it("should throw error on first operation when S3_ACCESS_KEY_ID is missing", async () => {
      delete process.env.S3_ACCESS_KEY_ID;
      const storage = new S3Storage();
      await expect(storage.upload(Buffer.from("test"), "test.jpg", "image/jpeg")).rejects.toThrow(
        "S3 configuration is incomplete"
      );
    });

    it("should throw error on first operation when S3_SECRET_ACCESS_KEY is missing", async () => {
      delete process.env.S3_SECRET_ACCESS_KEY;
      const storage = new S3Storage();
      await expect(storage.upload(Buffer.from("test"), "test.jpg", "image/jpeg")).rejects.toThrow(
        "S3 configuration is incomplete"
      );
    });

    it("should throw error on first operation when S3_BUCKET is missing", async () => {
      delete process.env.S3_BUCKET;
      const storage = new S3Storage();
      await expect(storage.upload(Buffer.from("test"), "test.jpg", "image/jpeg")).rejects.toThrow(
        "S3 configuration is incomplete"
      );
    });

    it("should use 'auto' as default region", () => {
      delete process.env.S3_REGION;
      expect(() => new S3Storage()).not.toThrow();
    });

    it("should accept custom region", () => {
      process.env.S3_REGION = "eu-west-1";
      expect(() => new S3Storage()).not.toThrow();
    });
  });

  describe("upload", () => {
    it("should upload file to S3", async () => {
      const storage = new S3Storage();
      const buffer = Buffer.from("test-image-data");
      const filename = "test-photo.jpg";

      const result = await storage.upload(buffer, filename, "image/jpeg");

      expect(result).toBe("gallery/test-photo.jpg");
      expect(mockUploadDone).toHaveBeenCalled();
    });

    it("should use correct S3 key format", async () => {
      const storage = new S3Storage();
      const buffer = Buffer.from("data");

      const result = await storage.upload(buffer, "photo123.heic", "image/heic");

      expect(result).toBe("gallery/photo123.heic");
    });
  });

  describe("delete", () => {
    it("should delete file from S3", async () => {
      const storage = new S3Storage();

      await storage.delete("gallery/test.jpg");

      expect(mockS3Send).toHaveBeenCalled();
    });

    it("should handle deletion errors gracefully", async () => {
      const storage = new S3Storage();
      mockS3Send.mockRejectedValue(new Error("Network error"));
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => { });

      await expect(storage.delete("gallery/test.jpg")).resolves.toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to delete from S3:", expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });

  describe("getPublicUrl", () => {
    it("should return CDN URL when S3_CDN_URL is set", () => {
      process.env.S3_CDN_URL = "https://cdn.example.com";
      const storage = new S3Storage();

      const url = storage.getPublicUrl("gallery/test.jpg");

      expect(url).toBe("https://cdn.example.com/gallery/test.jpg");
    });

    it("should return S3 endpoint URL when CDN is not configured", () => {
      delete process.env.S3_CDN_URL;
      const storage = new S3Storage();

      const url = storage.getPublicUrl("gallery/test.jpg");

      expect(url).toBe("https://s3.example.com/test-bucket/gallery/test.jpg");
    });

    it("should handle various key formats", () => {
      const storage = new S3Storage();

      expect(storage.getPublicUrl("gallery/photo.jpg")).toContain("gallery/photo.jpg");
      expect(storage.getPublicUrl("gallery/video.mov")).toContain("gallery/video.mov");
    });
  });
});

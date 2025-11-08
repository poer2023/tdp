import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  listGalleryImages,
  getGalleryImageById,
  getAdjacentImageIds,
  addGalleryImage,
  deleteGalleryImage,
} from "../gallery";
import type { CreateGalleryImageInput } from "../gallery";

// Mock Prisma client
vi.mock("../prisma", () => ({
  default: {
    galleryImage: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

import prisma from "../prisma";

describe("Gallery Data Operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listGalleryImages", () => {
    it("should list all gallery images without limit", async () => {
      const mockImages = [
        {
          id: "img1",
          title: "Photo 1",
          description: "Description 1",
          filePath: "/uploads/photo1.jpg",
          postId: null,
          createdAt: new Date("2024-01-15"),
          latitude: 37.7749,
          longitude: -122.4194,
          locationName: "San Francisco",
          city: "San Francisco",
          country: "USA",
          livePhotoVideoPath: null,
          isLivePhoto: false,
          fileSize: 1024000,
          width: 4032,
          height: 3024,
          mimeType: "image/jpeg",
          capturedAt: new Date("2024-01-14"),
          storageType: "local",
        },
      ];

      vi.mocked(prisma.galleryImage.findMany).mockResolvedValue(mockImages);

      const result = await listGalleryImages();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: "img1",
        title: "Photo 1",
        latitude: 37.7749,
      });
      expect(prisma.galleryImage.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: "desc" },
      });
    });

    it("should list gallery images with limit", async () => {
      const mockImages = [
        {
          id: "img1",
          title: "Photo 1",
          description: null,
          filePath: "/uploads/photo1.jpg",
          postId: null,
          createdAt: new Date("2024-01-15"),
          latitude: null,
          longitude: null,
          locationName: null,
          city: null,
          country: null,
          livePhotoVideoPath: null,
          isLivePhoto: false,
          fileSize: null,
          width: null,
          height: null,
          mimeType: null,
          capturedAt: null,
          storageType: "local",
        },
      ];

      vi.mocked(prisma.galleryImage.findMany).mockResolvedValue(mockImages);

      const result = await listGalleryImages(10);

      expect(result).toHaveLength(1);
      expect(prisma.galleryImage.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: "desc" },
        take: 10,
      });
    });

    it("should convert dates to ISO strings", async () => {
      const mockImages = [
        {
          id: "img1",
          title: null,
          description: null,
          filePath: "/uploads/photo1.jpg",
          postId: null,
          createdAt: new Date("2024-01-15T10:30:00Z"),
          latitude: null,
          longitude: null,
          locationName: null,
          city: null,
          country: null,
          livePhotoVideoPath: null,
          isLivePhoto: false,
          fileSize: null,
          width: null,
          height: null,
          mimeType: null,
          capturedAt: new Date("2024-01-14T15:45:00Z"),
          storageType: "local",
        },
      ];

      vi.mocked(prisma.galleryImage.findMany).mockResolvedValue(mockImages);

      const result = await listGalleryImages();

      expect(result[0].createdAt).toContain("2024-01-15");
      expect(result[0].capturedAt).toContain("2024-01-14");
    });
  });

  describe("getGalleryImageById", () => {
    it("should return image by ID", async () => {
      const mockImage = {
        id: "img123",
        title: "Test Photo",
        description: "Test Description",
        filePath: "/uploads/test.jpg",
        postId: null,
        createdAt: new Date("2024-01-15"),
        latitude: 37.7749,
        longitude: -122.4194,
        locationName: "San Francisco",
        city: "San Francisco",
        country: "USA",
        livePhotoVideoPath: "/uploads/test.mov",
        isLivePhoto: true,
        fileSize: 2048000,
        width: 4032,
        height: 3024,
        mimeType: "image/heic",
        capturedAt: new Date("2024-01-14"),
        storageType: "s3",
      };

      vi.mocked(prisma.galleryImage.findUnique).mockResolvedValue(mockImage);

      const result = await getGalleryImageById("img123");

      expect(result).toBeTruthy();
      expect(result?.id).toBe("img123");
      expect(result?.isLivePhoto).toBe(true);
      expect(result?.storageType).toBe("s3");
      expect(prisma.galleryImage.findUnique).toHaveBeenCalledWith({
        where: { id: "img123" },
      });
    });

    it("should return null when image not found", async () => {
      vi.mocked(prisma.galleryImage.findUnique).mockResolvedValue(null);

      const result = await getGalleryImageById("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("getAdjacentImageIds", () => {
    it("should return previous and next image IDs", async () => {
      const queryResult = [
        {
          id: "img1",
          createdAt: new Date("2024-01-14"),
          filePath: "/uploads/img1.jpg",
          mediumPath: "/uploads/img1_medium.webp",
          position: "prev",
        },
        {
          id: "img2",
          createdAt: new Date("2024-01-15"),
          filePath: "/uploads/img2.jpg",
          mediumPath: "/uploads/img2_medium.webp",
          position: "current",
        },
        {
          id: "img3",
          createdAt: new Date("2024-01-16"),
          filePath: "/uploads/img3.jpg",
          mediumPath: "/uploads/img3_medium.webp",
          position: "next",
        },
      ];

      vi.mocked(prisma.$queryRaw).mockResolvedValue(queryResult);

      const result = await getAdjacentImageIds("img2");

      expect(result).toEqual({
        prev: "img1",
        next: "img3",
        prevPath: "/uploads/img1_medium.webp",
        nextPath: "/uploads/img3_medium.webp",
      });

      expect(prisma.$queryRaw).toHaveBeenCalled();
    });

    it("should return null for both when image not found", async () => {
      // When image doesn't exist, query returns empty array or no 'current' position
      vi.mocked(prisma.$queryRaw).mockResolvedValue([]);

      const result = await getAdjacentImageIds("nonexistent");

      expect(result).toEqual({
        prev: null,
        next: null,
      });
    });

    it("should return null for prev when no older images", async () => {
      const queryResult = [
        {
          id: "img1",
          createdAt: new Date("2024-01-01"),
          filePath: "/uploads/img1.jpg",
          mediumPath: "/uploads/img1_medium.webp",
          position: "current",
        },
        {
          id: "img2",
          createdAt: new Date("2024-01-02"),
          filePath: "/uploads/img2.jpg",
          mediumPath: "/uploads/img2_medium.webp",
          position: "next",
        },
      ];

      vi.mocked(prisma.$queryRaw).mockResolvedValue(queryResult);

      const result = await getAdjacentImageIds("img1");

      expect(result).toEqual({
        prev: null,
        next: "img2",
        prevPath: undefined,
        nextPath: "/uploads/img2_medium.webp",
      });
    });

    it("should return null for next when no newer images", async () => {
      const queryResult = [
        {
          id: "img2",
          createdAt: new Date("2024-12-30"),
          filePath: "/uploads/img2.jpg",
          mediumPath: "/uploads/img2_medium.webp",
          position: "prev",
        },
        {
          id: "img3",
          createdAt: new Date("2024-12-31"),
          filePath: "/uploads/img3.jpg",
          mediumPath: "/uploads/img3_medium.webp",
          position: "current",
        },
      ];

      vi.mocked(prisma.$queryRaw).mockResolvedValue(queryResult);

      const result = await getAdjacentImageIds("img3");

      expect(result).toEqual({
        prev: "img2",
        next: null,
        prevPath: "/uploads/img2_medium.webp",
        nextPath: undefined,
      });
    });
  });

  describe("addGalleryImage", () => {
    it("should create a new gallery image with all fields", async () => {
      const input: CreateGalleryImageInput = {
        title: "New Photo",
        description: "New Description",
        filePath: "/uploads/new.jpg",
        postId: null,
        latitude: 37.7749,
        longitude: -122.4194,
        locationName: "San Francisco, CA",
        city: "San Francisco",
        country: "USA",
        livePhotoVideoPath: "/uploads/new.mov",
        isLivePhoto: true,
        fileSize: 3072000,
        width: 4032,
        height: 3024,
        mimeType: "image/heic",
        capturedAt: new Date("2024-01-14"),
        storageType: "s3",
      };

      const mockCreated = {
        id: "new-img",
        ...input,
        createdAt: new Date("2024-01-15"),
        capturedAt: input.capturedAt!,
      };

      vi.mocked(prisma.galleryImage.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.galleryImage.create).mockResolvedValue(
        mockCreated as unknown as {
          id: string;
          title: string | null;
          description: string | null;
          filePath: string;
          postId: string | null;
          createdAt: Date;
          latitude: number | null;
          longitude: number | null;
          locationName: string | null;
          city: string | null;
          country: string | null;
          livePhotoVideoPath: string | null;
          isLivePhoto: boolean;
          fileSize: number | null;
          width: number | null;
          height: number | null;
          mimeType: string | null;
          capturedAt: Date | null;
          storageType: string;
        }
      );

      const result = await addGalleryImage(input);

      expect(result.id).toBe("new-img");
      expect(result.title).toBe("New Photo");
      expect(result.isLivePhoto).toBe(true);

      expect(prisma.galleryImage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: "New Photo",
          description: "New Description",
          latitude: 37.7749,
          isLivePhoto: true,
          storageType: "s3",
        }),
      });
    });

    it("should create gallery image with minimal required fields", async () => {
      const input: CreateGalleryImageInput = {
        filePath: "/uploads/simple.jpg",
      };

      const mockCreated = {
        id: "simple-img",
        title: null,
        description: null,
        filePath: "/uploads/simple.jpg",
        postId: null,
        createdAt: new Date("2024-01-15"),
        latitude: null,
        longitude: null,
        locationName: null,
        city: null,
        country: null,
        livePhotoVideoPath: null,
        isLivePhoto: false,
        fileSize: null,
        width: null,
        height: null,
        mimeType: null,
        capturedAt: null,
        storageType: "local",
      };

      vi.mocked(prisma.galleryImage.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.galleryImage.create).mockResolvedValue(mockCreated);

      const result = await addGalleryImage(input);

      expect(result.id).toBe("simple-img");
      expect(result.title).toBeNull();
      expect(result.isLivePhoto).toBe(false);
      expect(result.storageType).toBe("local");
    });

    it("should trim title and description", async () => {
      const input: CreateGalleryImageInput = {
        title: "  Trimmed Title  ",
        description: "  Trimmed Description  ",
        filePath: "/uploads/trimmed.jpg",
      };

      const mockCreated = {
        id: "trimmed-img",
        title: "Trimmed Title",
        description: "Trimmed Description",
        filePath: "/uploads/trimmed.jpg",
        postId: null,
        createdAt: new Date("2024-01-15"),
        latitude: null,
        longitude: null,
        locationName: null,
        city: null,
        country: null,
        livePhotoVideoPath: null,
        isLivePhoto: false,
        fileSize: null,
        width: null,
        height: null,
        mimeType: null,
        capturedAt: null,
        storageType: "local",
      };

      vi.mocked(prisma.galleryImage.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.galleryImage.create).mockResolvedValue(mockCreated);

      await addGalleryImage(input);

      expect(prisma.galleryImage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: "Trimmed Title",
          description: "Trimmed Description",
        }),
      });
    });
  });

  describe("deleteGalleryImage", () => {
    it("should delete gallery image by ID", async () => {
      vi.mocked(prisma.galleryImage.delete).mockResolvedValue({} as unknown as { id: string });

      await deleteGalleryImage("img123");

      expect(prisma.galleryImage.delete).toHaveBeenCalledWith({
        where: { id: "img123" },
      });
    });
  });
});

/**
 * Tests for RecentUploads component with service degradation support
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecentUploads } from "../recent-uploads";
import type { GalleryImage } from "@prisma/client";

const mockImages: GalleryImage[] = [
  {
    id: "1",
    title: "Test Image 1",
    description: null,
    filePath: "/uploads/test1.jpg",
    fileSize: 1024,
    mimeType: "image/jpeg",
    width: 1920,
    height: 1080,
    capturedAt: new Date("2025-01-15T10:00:00Z"),
    uploadedAt: new Date("2025-01-15T10:30:00Z"),
    originalFileName: "test1.jpg",
    isLivePhoto: false,
    livePhotoPath: null,
    latitude: null,
    longitude: null,
    altitude: null,
    gpsTimestamp: null,
    linkedPostId: null,
  },
  {
    id: "2",
    title: "Test Image 2",
    description: "A test image",
    filePath: "/uploads/test2.jpg",
    fileSize: 2048,
    mimeType: "image/jpeg",
    width: 1920,
    height: 1080,
    capturedAt: new Date("2025-01-14T15:00:00Z"),
    uploadedAt: new Date("2025-01-14T15:30:00Z"),
    originalFileName: "test2.jpg",
    isLivePhoto: false,
    livePhotoPath: null,
    latitude: 37.7749,
    longitude: -122.4194,
    altitude: 10.5,
    gpsTimestamp: new Date("2025-01-14T15:00:00Z"),
    linkedPostId: null,
  },
];

describe("RecentUploads", () => {
  describe("normal state", () => {
    it("should render recent uploads when images are provided", () => {
      render(<RecentUploads images={mockImages} locale="en" />);

      expect(screen.getByText("Recent Uploads")).toBeInTheDocument();
      // Image titles are in alt attributes, not visible text
      expect(screen.getByAltText("Test Image 1")).toBeInTheDocument();
      expect(screen.getByAltText("Test Image 2")).toBeInTheDocument();
    });

    it("should display images in grid layout", () => {
      const { container } = render(<RecentUploads images={mockImages} locale="en" />);

      // Check for grid layout
      const grid = container.querySelector(".grid.grid-cols-3");
      expect(grid).toBeInTheDocument();

      // Check that images are rendered
      const images = screen.getAllByRole("img");
      expect(images).toHaveLength(2);
    });

    it("should show empty state when no images", () => {
      render(<RecentUploads images={[]} locale="en" />);

      expect(screen.getByText("Recent Uploads")).toBeInTheDocument();
      expect(screen.getByText("No uploads yet")).toBeInTheDocument();
    });
  });

  describe("service degradation", () => {
    it("should display degradation warning when isServiceDegraded is true", () => {
      render(<RecentUploads images={[]} locale="en" isServiceDegraded={true} />);

      expect(screen.getByText("Service temporarily unavailable")).toBeInTheDocument();
      expect(screen.getByText("Gallery data is currently inaccessible")).toBeInTheDocument();
    });

    it("should show amber warning icon in degraded state", () => {
      const { container } = render(
        <RecentUploads images={[]} locale="en" isServiceDegraded={true} />
      );

      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass("text-amber-500");
    });

    it("should not render image list in degraded state", () => {
      render(<RecentUploads images={mockImages} locale="en" isServiceDegraded={true} />);

      // Should not show actual images even if provided (check alt text)
      expect(screen.queryByAltText("Test Image 1")).not.toBeInTheDocument();
      expect(screen.queryByAltText("Test Image 2")).not.toBeInTheDocument();
    });

    it("should prioritize degradation state over empty state", () => {
      render(<RecentUploads images={[]} locale="en" isServiceDegraded={true} />);

      // Should show degradation message, not empty message
      expect(screen.getByText("Service temporarily unavailable")).toBeInTheDocument();
      expect(screen.queryByText("No uploads yet")).not.toBeInTheDocument();
    });
  });

  describe("locale support", () => {
    it("should render with Chinese locale", () => {
      render(<RecentUploads images={mockImages} locale="zh" />);

      expect(screen.getByText("最近上传")).toBeInTheDocument();
    });

    it("should render degradation message in Chinese locale", () => {
      render(<RecentUploads images={[]} locale="zh" isServiceDegraded={true} />);

      expect(screen.getByText("服务暂时不可用")).toBeInTheDocument();
    });
  });

  describe("default props", () => {
    it("should default isServiceDegraded to false", () => {
      render(<RecentUploads images={mockImages} locale="en" />);

      // Should show normal content, not degradation message (check alt text)
      expect(screen.getByAltText("Test Image 1")).toBeInTheDocument();
      expect(screen.queryByText("Service temporarily unavailable")).not.toBeInTheDocument();
    });
  });
});

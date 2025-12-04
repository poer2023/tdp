/**
 * Tests for DashboardActivity component with service degradation support
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardActivity } from "../dashboard-activity";
import type { Post, GalleryImage } from "@prisma/client";

type RecentPostsData = (Post & { author: { name: string | null } | null })[];
type RecentUploadsData = GalleryImage[];

const mockRecentPosts: RecentPostsData = [
  {
    id: "1",
    title: "Test Post",
    slug: "test-post",
    excerpt: "Test excerpt",
    content: "Test content",
    coverImagePath: null,
    status: "PUBLISHED" as const,
    publishedAt: new Date("2025-01-15T10:00:00Z"),
    createdAt: new Date("2025-01-10T10:00:00Z"),
    updatedAt: new Date("2025-01-15T10:00:00Z"),
    authorId: "author1",
    author: { name: "John Doe" },
  },
];

const mockRecentUploads: RecentUploadsData = [
  {
    id: "1",
    title: "Test Image",
    description: null,
    filePath: "/uploads/test.jpg",
    fileSize: 1024,
    mimeType: "image/jpeg",
    width: 1920,
    height: 1080,
    capturedAt: new Date("2025-01-15T10:00:00Z"),
    uploadedAt: new Date("2025-01-15T10:30:00Z"),
    originalFileName: "test.jpg",
    isLivePhoto: false,
    livePhotoPath: null,
    latitude: null,
    longitude: null,
    altitude: null,
    gpsTimestamp: null,
    linkedPostId: null,
  },
];

const defaultProps = {
  recentPosts: mockRecentPosts,
  recentUploads: mockRecentUploads,
  locale: "en" as const,
  totalPosts: 10,
  totalMoments: 5,
  totalGallery: 20,
  totalProjects: 3,
};

describe("DashboardActivity", () => {
  describe("normal state", () => {
    it("should render recent activity section header", () => {
      render(<DashboardActivity {...defaultProps} />);

      expect(screen.getByText("Recent Activity")).toBeInTheDocument();
    });

    it("should render ContentDistributionChart", () => {
      render(<DashboardActivity {...defaultProps} />);

      // ContentDistributionChart shows "Content" in its header
      expect(screen.getByText("Content Distribution")).toBeInTheDocument();
    });

    it("should render RecentItemsPanel", () => {
      render(<DashboardActivity {...defaultProps} />);

      // RecentItemsPanel shows "Recent Items" header
      expect(screen.getByText("Recent Items")).toBeInTheDocument();
    });

    it("should render SystemStatusPanel", () => {
      render(<DashboardActivity {...defaultProps} />);

      // SystemStatusPanel shows "System Status" header
      expect(screen.getByText("System Status")).toBeInTheDocument();
    });
  });

  describe("service degradation", () => {
    it("should show degradation message when isServiceDegraded is true", () => {
      render(<DashboardActivity {...defaultProps} isServiceDegraded={true} />);

      expect(screen.getByText("Service temporarily unavailable")).toBeInTheDocument();
    });

    it("should not render content panels in degraded state", () => {
      render(<DashboardActivity {...defaultProps} isServiceDegraded={true} />);

      // Should not show normal content
      expect(screen.queryByText("Content Distribution")).not.toBeInTheDocument();
      expect(screen.queryByText("Recent Items")).not.toBeInTheDocument();
    });

    it("should still show section header in degraded state", () => {
      render(<DashboardActivity {...defaultProps} isServiceDegraded={true} />);

      expect(screen.getByText("Recent Activity")).toBeInTheDocument();
    });
  });

  describe("locale support", () => {
    it("should render with Chinese locale", () => {
      render(<DashboardActivity {...defaultProps} locale="zh" />);

      expect(screen.getByText("最近活动")).toBeInTheDocument();
    });

    it("should pass locale to child components", () => {
      render(<DashboardActivity {...defaultProps} locale="zh" />);

      expect(screen.getByText("内容分布")).toBeInTheDocument();
      expect(screen.getByText("最近项目")).toBeInTheDocument();
    });
  });

  describe("default props", () => {
    it("should default isServiceDegraded to false", () => {
      render(<DashboardActivity {...defaultProps} />);

      // Should show normal content, not degradation messages
      expect(screen.getByText("Content Distribution")).toBeInTheDocument();
      expect(screen.queryByText("Service temporarily unavailable")).not.toBeInTheDocument();
    });
  });

  describe("layout", () => {
    it("should use grid layout for activity components", () => {
      const { container } = render(<DashboardActivity {...defaultProps} />);

      const grid = container.querySelector(".grid");
      expect(grid).toBeInTheDocument();
    });

    it("should maintain section structure in degraded state", () => {
      const { container } = render(
        <DashboardActivity {...defaultProps} isServiceDegraded={true} />
      );

      // Section should still exist
      const section = container.querySelector("section");
      expect(section).toBeInTheDocument();
    });
  });
});

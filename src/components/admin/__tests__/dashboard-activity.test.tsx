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

describe("DashboardActivity", () => {
  describe("normal state", () => {
    it("should render recent activity section header", () => {
      render(
        <DashboardActivity
          recentPosts={mockRecentPosts}
          recentUploads={mockRecentUploads}
          locale="en"
        />
      );

      expect(screen.getByText("Recent Activity")).toBeInTheDocument();
    });

    it("should render RecentPosts component with data", () => {
      render(
        <DashboardActivity
          recentPosts={mockRecentPosts}
          recentUploads={mockRecentUploads}
          locale="en"
        />
      );

      expect(screen.getByText("Test Post")).toBeInTheDocument();
      expect(screen.getByText("Recent Posts")).toBeInTheDocument();
    });

    it("should render RecentUploads component with data", () => {
      render(
        <DashboardActivity
          recentPosts={mockRecentPosts}
          recentUploads={mockRecentUploads}
          locale="en"
        />
      );

      expect(screen.getByText("Test Image")).toBeInTheDocument();
      expect(screen.getByText("Recent Uploads")).toBeInTheDocument();
    });

    it("should render PostStatsTop component", () => {
      render(
        <DashboardActivity
          recentPosts={mockRecentPosts}
          recentUploads={mockRecentUploads}
          locale="en"
        />
      );

      // PostStatsTop should be rendered (exact text depends on implementation)
      expect(screen.getByText(/Top/i)).toBeInTheDocument();
    });

    it("should render empty state for posts when no data", () => {
      render(<DashboardActivity recentPosts={[]} recentUploads={mockRecentUploads} locale="en" />);

      expect(screen.getByText("No posts yet")).toBeInTheDocument();
    });

    it("should render empty state for uploads when no data", () => {
      render(<DashboardActivity recentPosts={mockRecentPosts} recentUploads={[]} locale="en" />);

      expect(screen.getByText("No uploads yet")).toBeInTheDocument();
    });
  });

  describe("service degradation", () => {
    it("should pass isServiceDegraded prop to RecentPosts", () => {
      render(
        <DashboardActivity
          recentPosts={mockRecentPosts}
          recentUploads={mockRecentUploads}
          locale="en"
          isServiceDegraded={true}
        />
      );

      // Should show degradation message instead of post content
      expect(screen.getByText("Service temporarily unavailable")).toBeInTheDocument();
      expect(screen.getByText("Posts data is currently inaccessible")).toBeInTheDocument();
      expect(screen.queryByText("Test Post")).not.toBeInTheDocument();
    });

    it("should pass isServiceDegraded prop to RecentUploads", () => {
      render(
        <DashboardActivity
          recentPosts={mockRecentPosts}
          recentUploads={mockRecentUploads}
          locale="en"
          isServiceDegraded={true}
        />
      );

      // Should show degradation message instead of upload content
      expect(screen.getByText("Gallery data is currently inaccessible")).toBeInTheDocument();
      expect(screen.queryByText("Test Image")).not.toBeInTheDocument();
    });

    it("should show multiple degradation warnings when service is degraded", () => {
      render(
        <DashboardActivity
          recentPosts={[]}
          recentUploads={[]}
          locale="en"
          isServiceDegraded={true}
        />
      );

      // Should have multiple "Service temporarily unavailable" messages
      const unavailableMessages = screen.getAllByText("Service temporarily unavailable");
      expect(unavailableMessages.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("locale support", () => {
    it("should render with Chinese locale", () => {
      render(
        <DashboardActivity
          recentPosts={mockRecentPosts}
          recentUploads={mockRecentUploads}
          locale="zh"
        />
      );

      expect(screen.getByText("最近活动")).toBeInTheDocument();
    });

    it("should pass locale to child components", () => {
      render(
        <DashboardActivity
          recentPosts={mockRecentPosts}
          recentUploads={mockRecentUploads}
          locale="zh"
        />
      );

      expect(screen.getByText("最近文章")).toBeInTheDocument();
      expect(screen.getByText("最近上传")).toBeInTheDocument();
    });
  });

  describe("default props", () => {
    it("should default isServiceDegraded to false", () => {
      render(
        <DashboardActivity
          recentPosts={mockRecentPosts}
          recentUploads={mockRecentUploads}
          locale="en"
        />
      );

      // Should show normal content, not degradation messages
      expect(screen.getByText("Test Post")).toBeInTheDocument();
      expect(screen.getByText("Test Image")).toBeInTheDocument();
      expect(screen.queryByText("Service temporarily unavailable")).not.toBeInTheDocument();
    });
  });

  describe("layout", () => {
    it("should use grid layout for activity components", () => {
      const { container } = render(
        <DashboardActivity
          recentPosts={mockRecentPosts}
          recentUploads={mockRecentUploads}
          locale="en"
        />
      );

      const grid = container.querySelector(".grid");
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass("gap-6", "lg:grid-cols-2", "xl:grid-cols-3");
    });

    it("should maintain layout structure in degraded state", () => {
      const { container } = render(
        <DashboardActivity
          recentPosts={[]}
          recentUploads={[]}
          locale="en"
          isServiceDegraded={true}
        />
      );

      // Grid layout should still exist
      const grid = container.querySelector(".grid");
      expect(grid).toBeInTheDocument();
    });
  });
});

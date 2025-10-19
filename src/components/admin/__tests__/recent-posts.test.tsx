/**
 * Tests for RecentPosts component with service degradation support
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecentPosts } from "../recent-posts";
import type { Post } from "@prisma/client";

type PostWithAuthor = Post & { author: { name: string | null } | null };

const mockPosts: PostWithAuthor[] = [
  {
    id: "1",
    title: "First Post",
    slug: "first-post",
    excerpt: "This is the first post excerpt",
    content: "Full content of first post",
    coverImagePath: "/uploads/cover1.jpg",
    status: "PUBLISHED" as const,
    publishedAt: new Date("2025-01-15T10:00:00Z"),
    createdAt: new Date("2025-01-10T10:00:00Z"),
    updatedAt: new Date("2025-01-15T10:00:00Z"),
    authorId: "author1",
    author: { name: "John Doe" },
  },
  {
    id: "2",
    title: "Second Post",
    slug: "second-post",
    excerpt: "This is the second post excerpt",
    content: "Full content of second post",
    coverImagePath: null,
    status: "DRAFT" as const,
    publishedAt: null,
    createdAt: new Date("2025-01-14T10:00:00Z"),
    updatedAt: new Date("2025-01-14T15:00:00Z"),
    authorId: "author2",
    author: { name: "Jane Smith" },
  },
];

describe("RecentPosts", () => {
  describe("normal state", () => {
    it("should render recent posts when posts are provided", () => {
      render(<RecentPosts posts={mockPosts} />);

      expect(screen.getByText("Recent Posts")).toBeInTheDocument();
      expect(screen.getByText("First Post")).toBeInTheDocument();
      expect(screen.getByText("Second Post")).toBeInTheDocument();
    });

    it("should display post excerpts", () => {
      render(<RecentPosts posts={mockPosts} />);

      expect(screen.getByText("This is the first post excerpt")).toBeInTheDocument();
      expect(screen.getByText("This is the second post excerpt")).toBeInTheDocument();
    });

    it("should display author names", () => {
      render(<RecentPosts posts={mockPosts} />);

      expect(screen.getByText(/John Doe/)).toBeInTheDocument();
      expect(screen.getByText(/Jane Smith/)).toBeInTheDocument();
    });

    it("should show post status badges", () => {
      render(<RecentPosts posts={mockPosts} />);

      expect(screen.getByText("Published")).toBeInTheDocument();
      expect(screen.getByText("Draft")).toBeInTheDocument();
    });

    it("should show empty state when no posts", () => {
      render(<RecentPosts posts={[]} />);

      expect(screen.getByText("Recent Posts")).toBeInTheDocument();
      expect(screen.getByText("No posts yet")).toBeInTheDocument();
    });

    it("should handle null author gracefully", () => {
      const postsWithNullAuthor: PostWithAuthor[] = [
        {
          ...mockPosts[0],
          author: null,
        },
      ];

      render(<RecentPosts posts={postsWithNullAuthor} />);

      expect(screen.getByText("First Post")).toBeInTheDocument();
      expect(screen.getByText("Unknown")).toBeInTheDocument();
    });
  });

  describe("service degradation", () => {
    it("should display degradation warning when isServiceDegraded is true", () => {
      render(<RecentPosts posts={[]} isServiceDegraded={true} />);

      expect(screen.getByText("Service temporarily unavailable")).toBeInTheDocument();
      expect(screen.getByText("Posts data is currently inaccessible")).toBeInTheDocument();
    });

    it("should show amber warning icon in degraded state", () => {
      const { container } = render(<RecentPosts posts={[]} isServiceDegraded={true} />);

      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass("text-amber-500");
    });

    it("should not render post list in degraded state", () => {
      render(<RecentPosts posts={mockPosts} isServiceDegraded={true} />);

      // Should not show actual posts even if provided
      expect(screen.queryByText("First Post")).not.toBeInTheDocument();
      expect(screen.queryByText("Second Post")).not.toBeInTheDocument();
    });

    it("should prioritize degradation state over empty state", () => {
      render(<RecentPosts posts={[]} isServiceDegraded={true} />);

      // Should show degradation message, not empty message
      expect(screen.getByText("Service temporarily unavailable")).toBeInTheDocument();
      expect(screen.queryByText("No posts yet")).not.toBeInTheDocument();
    });
  });

  describe("default props", () => {
    it("should default isServiceDegraded to false", () => {
      render(<RecentPosts posts={mockPosts} />);

      // Should show normal content, not degradation message
      expect(screen.getByText("First Post")).toBeInTheDocument();
      expect(screen.queryByText("Service temporarily unavailable")).not.toBeInTheDocument();
    });
  });

  describe("formatting", () => {
    it("should format dates correctly", () => {
      render(<RecentPosts posts={mockPosts} />);

      // Check for formatted dates (e.g., "Jan 15, 2025")
      expect(screen.getByText(/Jan 15, 2025/i)).toBeInTheDocument();
    });

    it("should handle posts without published date", () => {
      const draftPost: PostWithAuthor[] = [
        {
          ...mockPosts[1],
          publishedAt: null,
        },
      ];

      render(<RecentPosts posts={draftPost} />);

      expect(screen.getByText("Second Post")).toBeInTheDocument();
      // Draft posts might show "—" or creation date
    });
  });
});

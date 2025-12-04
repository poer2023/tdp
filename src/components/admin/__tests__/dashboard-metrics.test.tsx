/**
 * Tests for DashboardMetrics component with service degradation support
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardMetrics } from "../dashboard-metrics";

const mockMetricsData = {
  totalPosts: 42,
  publishedPosts: 35,
  draftPosts: 7,
  totalGallery: 156,
  livePhotos: 23,
  geotaggedPhotos: 89,
  locale: "en" as const,
};

describe("DashboardMetrics", () => {
  describe("normal state", () => {
    it("should render posts metrics card", () => {
      render(<DashboardMetrics {...mockMetricsData} />);

      expect(screen.getByText("Posts")).toBeInTheDocument();
      expect(screen.getByText("42")).toBeInTheDocument();
      expect(screen.getByText(/published 35/i)).toBeInTheDocument();
      expect(screen.getByText(/drafts 7/i)).toBeInTheDocument();
    });

    it("should render gallery metrics card", () => {
      render(<DashboardMetrics {...mockMetricsData} />);

      expect(screen.getByText("Gallery")).toBeInTheDocument();
      expect(screen.getByText("156")).toBeInTheDocument();
      expect(screen.getByText(/live 23/i)).toBeInTheDocument();
      expect(screen.getByText(/geotagged 89/i)).toBeInTheDocument();
    });

    it("should handle zero values", () => {
      render(
        <DashboardMetrics
          totalPosts={0}
          publishedPosts={0}
          draftPosts={0}
          totalGallery={0}
          livePhotos={0}
          geotaggedPhotos={0}
          locale="en"
        />
      );

      const zeroValues = screen.getAllByText("0");
      expect(zeroValues.length).toBeGreaterThan(0);
    });

    it("should have clickable links to posts and gallery pages", () => {
      render(<DashboardMetrics {...mockMetricsData} />);

      const links = screen.getAllByRole("link");
      expect(links).toHaveLength(2);
      expect(links[0]).toHaveAttribute("href", "/admin/posts");
      expect(links[1]).toHaveAttribute("href", "/admin/gallery");
    });
  });

  describe("service degradation", () => {
    it("should display degradation warning when isServiceDegraded is true", () => {
      render(<DashboardMetrics {...mockMetricsData} isServiceDegraded={true} />);

      expect(screen.getByText("Metrics temporarily unavailable")).toBeInTheDocument();
      expect(screen.getByText("Database connection error")).toBeInTheDocument();
    });

    it("should show amber warning icon in degraded state", () => {
      const { container } = render(
        <DashboardMetrics {...mockMetricsData} isServiceDegraded={true} />
      );

      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass("text-amber-500");
    });

    it("should not render metric cards in degraded state", () => {
      render(<DashboardMetrics {...mockMetricsData} isServiceDegraded={true} />);

      // Should not show normal metric values
      expect(screen.queryByText("42")).not.toBeInTheDocument();
      expect(screen.queryByText("156")).not.toBeInTheDocument();
      expect(screen.queryByText("Posts")).not.toBeInTheDocument();
      expect(screen.queryByText("Gallery")).not.toBeInTheDocument();
    });

    it("should use early return pattern for degraded state", () => {
      const { container } = render(
        <DashboardMetrics {...mockMetricsData} isServiceDegraded={true} />
      );

      // Should have section wrapper with single degradation card
      const sections = container.querySelectorAll("section");
      expect(sections.length).toBe(1);

      const cards = container.querySelectorAll("section > div");
      expect(cards.length).toBe(1); // Only degradation warning card
    });
  });

  describe("locale support", () => {
    it("should render with Chinese locale", () => {
      render(<DashboardMetrics {...mockMetricsData} locale="zh" />);

      expect(screen.getByText("文章")).toBeInTheDocument();
      expect(screen.getByText("相册")).toBeInTheDocument();
    });

    it("should render degradation message in Chinese locale", () => {
      render(<DashboardMetrics {...mockMetricsData} locale="zh" isServiceDegraded={true} />);

      expect(screen.getByText("指标暂时不可用")).toBeInTheDocument();
      expect(screen.getByText("数据库连接错误")).toBeInTheDocument();
    });
  });

  describe("default props", () => {
    it("should default isServiceDegraded to false", () => {
      render(<DashboardMetrics {...mockMetricsData} />);

      // Should show normal content, not degradation message
      expect(screen.getByText("42")).toBeInTheDocument();
      expect(screen.queryByText("Metrics temporarily unavailable")).not.toBeInTheDocument();
    });
  });

  describe("styling", () => {
    it("should apply correct Tailwind classes to metrics section", () => {
      const { container } = render(<DashboardMetrics {...mockMetricsData} />);

      const section = container.querySelector("section");
      expect(section).toHaveClass("grid", "gap-4", "sm:grid-cols-2", "lg:grid-cols-4");
    });

    it("should apply degradation styling in degraded state", () => {
      const { container } = render(
        <DashboardMetrics {...mockMetricsData} isServiceDegraded={true} />
      );

      const degradationCard = container.querySelector("div.border-amber-200");
      expect(degradationCard).toBeInTheDocument();
      expect(degradationCard).toHaveClass("bg-amber-50");
    });
  });
});

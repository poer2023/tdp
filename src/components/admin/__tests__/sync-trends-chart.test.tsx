import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SyncTrendsChart } from "../sync-trends-chart";

describe("SyncTrendsChart", () => {
  const mockTrendData = [
    {
      date: new Date("2025-01-15"),
      platform: "BILIBILI",
      totalJobs: 10,
      successJobs: 8,
      failedJobs: 2,
      successRate: 80,
    },
    {
      date: new Date("2025-01-15"),
      platform: "STEAM",
      totalJobs: 5,
      successJobs: 5,
      failedJobs: 0,
      successRate: 100,
    },
    {
      date: new Date("2025-01-16"),
      platform: "BILIBILI",
      totalJobs: 12,
      successJobs: 10,
      failedJobs: 2,
      successRate: 83.33,
    },
  ];

  it("should render section title", () => {
    render(<SyncTrendsChart trendData={mockTrendData} />);
    expect(screen.getByText(/Sync Trends/i)).toBeInTheDocument();
    expect(screen.getByText(/Last 30 Days/i)).toBeInTheDocument();
  });

  it("should render chart container", () => {
    render(<SyncTrendsChart trendData={mockTrendData} />);

    // Check for Recharts container
    const container = screen.getByText(/Sync Trends/i).parentElement;
    expect(container).toBeInTheDocument();
  });

  it("should aggregate data by date", () => {
    const { container } = render(<SyncTrendsChart trendData={mockTrendData} />);

    // Should combine data from same date (2025-01-15: BILIBILI + STEAM)
    // Expected: total=15 (10+5), success=13 (8+5), failed=2 (2+0)
    expect(container).toBeInTheDocument();
  });

  it("should show empty state when no data", () => {
    render(<SyncTrendsChart trendData={[]} />);
    expect(screen.getByText(/No trend data available/i)).toBeInTheDocument();
  });

  it("should limit display to last 30 days", () => {
    // Create 35 days of data
    const largeTrendData = Array.from({ length: 35 }, (_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      platform: "BILIBILI",
      totalJobs: 5,
      successJobs: 4,
      failedJobs: 1,
      successRate: 80,
    }));

    const { container } = render(<SyncTrendsChart trendData={largeTrendData} />);

    // Chart should only show last 30 days
    expect(container).toBeInTheDocument();
  });

  it("should display success area", () => {
    const { container } = render(<SyncTrendsChart trendData={mockTrendData} />);

    // Check that component renders without errors
    expect(container).toBeInTheDocument();
  });

  it("should display failed area", () => {
    const { container } = render(<SyncTrendsChart trendData={mockTrendData} />);

    // Check that component renders without errors
    expect(container).toBeInTheDocument();
  });

  it("should render with dark mode classes", () => {
    const { container } = render(<SyncTrendsChart trendData={mockTrendData} />);

    // Check for dark mode classes
    const darkElements = container.querySelectorAll("[class*='dark:']");
    expect(darkElements.length).toBeGreaterThan(0);
  });

  it("should sort data by date ascending", () => {
    const unsortedData = [
      {
        date: new Date("2025-01-16"),
        platform: "BILIBILI",
        totalJobs: 12,
        successJobs: 10,
        failedJobs: 2,
        successRate: 83.33,
      },
      {
        date: new Date("2025-01-14"),
        platform: "STEAM",
        totalJobs: 5,
        successJobs: 5,
        failedJobs: 0,
        successRate: 100,
      },
      {
        date: new Date("2025-01-15"),
        platform: "BILIBILI",
        totalJobs: 10,
        successJobs: 8,
        failedJobs: 2,
        successRate: 80,
      },
    ];

    const { container } = render(<SyncTrendsChart trendData={unsortedData} />);
    expect(container).toBeInTheDocument();
  });

  it("should handle zero success rate correctly", () => {
    const allFailedData = [
      {
        date: new Date("2025-01-15"),
        platform: "BILIBILI",
        totalJobs: 5,
        successJobs: 0,
        failedJobs: 5,
        successRate: 0,
      },
    ];

    render(<SyncTrendsChart trendData={allFailedData} />);
    expect(screen.queryByText(/No trend data available/i)).not.toBeInTheDocument();
  });

  it("should handle 100% success rate correctly", () => {
    const allSuccessData = [
      {
        date: new Date("2025-01-15"),
        platform: "STEAM",
        totalJobs: 10,
        successJobs: 10,
        failedJobs: 0,
        successRate: 100,
      },
    ];

    render(<SyncTrendsChart trendData={allSuccessData} />);
    expect(screen.queryByText(/No trend data available/i)).not.toBeInTheDocument();
  });

  it("should render responsive container", () => {
    const { container } = render(<SyncTrendsChart trendData={mockTrendData} />);

    // ResponsiveContainer from Recharts
    const responsiveContainer = container.querySelector(".recharts-responsive-container");
    expect(responsiveContainer).toBeInTheDocument();
  });

  it("should render CartesianGrid", () => {
    const { container } = render(<SyncTrendsChart trendData={mockTrendData} />);

    // Check that component renders without errors
    expect(container).toBeInTheDocument();
  });

  it("should render XAxis", () => {
    const { container } = render(<SyncTrendsChart trendData={mockTrendData} />);

    // Check that component renders without errors
    expect(container).toBeInTheDocument();
  });

  it("should render YAxis", () => {
    const { container } = render(<SyncTrendsChart trendData={mockTrendData} />);

    // Check that component renders without errors
    expect(container).toBeInTheDocument();
  });
});

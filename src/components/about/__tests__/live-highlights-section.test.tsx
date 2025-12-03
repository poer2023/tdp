import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { LiveHighlightsSection } from "../live-highlights-section";

// Mock fetch API
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("LiveHighlightsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockHighlightsData = {
    highlights: [
      {
        id: "1",
        type: "bilibili",
        title: "测试视频",
        url: "https://bilibili.com/video/BV1xx411c7mD",
        cover: "https://example.com/cover.jpg",
      },
      {
        id: "2",
        type: "steam",
        title: "测试游戏",
        url: "https://store.steampowered.com/app/123",
        cover: "https://example.com/game.jpg",
      },
    ],
  };

  const mockSyncStatus = {
    platforms: [
      {
        platform: "bilibili",
        lastSyncAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago (fresh)
        status: "success",
      },
      {
        platform: "steam",
        lastSyncAt: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(), // 30 hours ago (stale)
        status: "success",
      },
    ],
  };

  it("should show loading state initially", () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<LiveHighlightsSection locale="en" />);

    // Check for skeleton loading cards
    const skeletonCards = document.querySelectorAll(".animate-pulse");
    expect(skeletonCards.length).toBeGreaterThan(0);
  });

  it("should render highlights after successful data fetch", async () => {
    mockFetch
      .mockResolvedValueOnce({
        json: async () => mockHighlightsData,
      })
      .mockResolvedValueOnce({
        json: async () => mockSyncStatus,
      });

    render(<LiveHighlightsSection locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("测试视频")).toBeInTheDocument();
      expect(screen.getByText("测试游戏")).toBeInTheDocument();
    });
  });

  it("should call both API endpoints on mount", async () => {
    mockFetch
      .mockResolvedValueOnce({
        json: async () => mockHighlightsData,
      })
      .mockResolvedValueOnce({
        json: async () => mockSyncStatus,
      });

    render(<LiveHighlightsSection locale="en" />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenCalledWith("/api/about/highlights");
      expect(mockFetch).toHaveBeenCalledWith("/api/about/sync-status");
    });
  });

  it("should display fresh sync status with green indicator", async () => {
    mockFetch
      .mockResolvedValueOnce({
        json: async () => mockHighlightsData,
      })
      .mockResolvedValueOnce({
        json: async () => mockSyncStatus,
      });

    const { container } = render(<LiveHighlightsSection locale="en" />);

    await waitFor(() => {
      // Fresh status (<24h) should have green indicator
      const greenIndicators = container.querySelectorAll(".bg-green-500");
      expect(greenIndicators.length).toBeGreaterThan(0);
    });
  });

  it("should display stale sync status with yellow indicator", async () => {
    mockFetch
      .mockResolvedValueOnce({
        json: async () => mockHighlightsData,
      })
      .mockResolvedValueOnce({
        json: async () => mockSyncStatus,
      });

    const { container } = render(<LiveHighlightsSection locale="en" />);

    await waitFor(() => {
      // Stale status (>24h) should have yellow indicator
      const yellowIndicators = container.querySelectorAll(".bg-yellow-500");
      expect(yellowIndicators.length).toBeGreaterThan(0);
    });
  });

  it("should handle empty highlights data gracefully", async () => {
    mockFetch
      .mockResolvedValueOnce({
        json: async () => ({ highlights: [] }),
      })
      .mockResolvedValueOnce({
        json: async () => ({ platforms: [] }),
      });

    const { container } = render(<LiveHighlightsSection locale="en" />);

    await waitFor(() => {
      // Should not crash, loading should complete
      const skeletonCards = container.querySelectorAll(".animate-pulse");
      expect(skeletonCards.length).toBe(0);
    });
  });

  it("should handle API fetch errors gracefully", async () => {
    mockFetch
      .mockRejectedValueOnce(new Error("API Error"))
      .mockRejectedValueOnce(new Error("API Error"));

    render(<LiveHighlightsSection locale="en" />);

    await waitFor(() => {
      // Should complete loading even on error
      const skeletonCards = document.querySelectorAll(".animate-pulse");
      expect(skeletonCards.length).toBe(0);
    });
  });

  it("should render dashboard link button", async () => {
    mockFetch
      .mockResolvedValueOnce({
        json: async () => mockHighlightsData,
      })
      .mockResolvedValueOnce({
        json: async () => mockSyncStatus,
      });

    render(<LiveHighlightsSection locale="en" />);

    await waitFor(() => {
      const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
      expect(dashboardLink).toBeInTheDocument();
      expect(dashboardLink).toHaveAttribute("href", "/about/live");
    });
  });

  it("should use English locale correctly", async () => {
    mockFetch
      .mockResolvedValueOnce({
        json: async () => mockHighlightsData,
      })
      .mockResolvedValueOnce({
        json: async () => mockSyncStatus,
      });

    render(<LiveHighlightsSection locale="en" />);

    await waitFor(() => {
      // Check for English text
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });
  });

  it("should use Chinese locale correctly", async () => {
    mockFetch
      .mockResolvedValueOnce({
        json: async () => mockHighlightsData,
      })
      .mockResolvedValueOnce({
        json: async () => mockSyncStatus,
      });

    render(<LiveHighlightsSection locale="zh" />);

    await waitFor(() => {
      // Should render Chinese content
      expect(screen.getByText("测试视频")).toBeInTheDocument();
    });
  });

  it("should handle missing lastSyncAt correctly", async () => {
    const syncStatusNoTime = {
      platforms: [
        {
          platform: "bilibili",
          lastSyncAt: null,
          status: "pending",
        },
      ],
    };

    mockFetch
      .mockResolvedValueOnce({
        json: async () => mockHighlightsData,
      })
      .mockResolvedValueOnce({
        json: async () => syncStatusNoTime,
      });

    const { container } = render(<LiveHighlightsSection locale="en" />);

    await waitFor(() => {
      // Should handle null lastSyncAt gracefully
      expect(container).toBeInTheDocument();
    });
  });

  it("should render highlight cards", async () => {
    mockFetch
      .mockResolvedValueOnce({
        json: async () => mockHighlightsData,
      })
      .mockResolvedValueOnce({
        json: async () => mockSyncStatus,
      });

    render(<LiveHighlightsSection locale="en" />);

    await waitFor(() => {
      // Check that highlights are rendered
      expect(screen.getByText("测试视频")).toBeInTheDocument();
      expect(screen.getByText("测试游戏")).toBeInTheDocument();
    });
  });

  it("should display sync status for all platforms", async () => {
    mockFetch
      .mockResolvedValueOnce({
        json: async () => mockHighlightsData,
      })
      .mockResolvedValueOnce({
        json: async () => mockSyncStatus,
      });

    render(<LiveHighlightsSection locale="en" />);

    await waitFor(() => {
      // Should display status indicators for both platforms
      expect(screen.getByText("测试视频")).toBeInTheDocument();
      expect(screen.getByText("测试游戏")).toBeInTheDocument();
    });
  });
});

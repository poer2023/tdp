import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { PostStatsTop } from "../post-stats-top";

// Mock fetch
global.fetch = vi.fn();

describe("PostStatsTop", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockStatsData = {
    topPosts: [
      {
        id: "1",
        title: "First Post",
        slug: "first-post",
        viewCount: 1000,
        publishedAt: "2025-10-01T00:00:00.000Z",
      },
      {
        id: "2",
        title: "Second Post",
        slug: "second-post",
        viewCount: 800,
        publishedAt: "2025-10-02T00:00:00.000Z",
      },
      {
        id: "3",
        title: "Third Post",
        slug: "third-post",
        viewCount: 600,
        publishedAt: "2025-10-03T00:00:00.000Z",
      },
      {
        id: "4",
        title: "Fourth Post",
        slug: "fourth-post",
        viewCount: 400,
        publishedAt: "2025-10-04T00:00:00.000Z",
      },
      {
        id: "5",
        title: "Fifth Post",
        slug: "fifth-post",
        viewCount: 200,
        publishedAt: "2025-10-05T00:00:00.000Z",
      },
    ],
    stats: {
      totalPosts: 10,
      totalViews: 5000,
      averageViews: 500,
    },
  };

  it("should render loading skeleton initially", () => {
    vi.mocked(fetch).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => mockStatsData,
              } as Response),
            100
          )
        )
    );

    render(<PostStatsTop locale="en" />);

    // Check for title
    expect(screen.getByText("Top Posts")).toBeInTheDocument();

    // Check for skeleton elements (5 loading placeholders)
    const skeletons = document.querySelectorAll(".animate-pulse .h-16");
    expect(skeletons.length).toBe(5);
  });

  it("should display top posts with data", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockStatsData,
    } as Response);

    render(<PostStatsTop locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("First Post")).toBeInTheDocument();
      expect(screen.getByText("Second Post")).toBeInTheDocument();
      expect(screen.getByText("Third Post")).toBeInTheDocument();
      expect(screen.getByText("Fourth Post")).toBeInTheDocument();
      expect(screen.getByText("Fifth Post")).toBeInTheDocument();
    });
  });

  it("should display view counts correctly", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockStatsData,
    } as Response);

    render(<PostStatsTop locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("1,000 views")).toBeInTheDocument();
      expect(screen.getByText("800 views")).toBeInTheDocument();
      expect(screen.getByText("600 views")).toBeInTheDocument();
    });
  });

  it("should display ranking badges", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockStatsData,
    } as Response);

    render(<PostStatsTop locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("4")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
    });
  });

  it("should display aggregate stats", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockStatsData,
    } as Response);

    render(<PostStatsTop locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("Total")).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument();
      expect(screen.getByText("Views")).toBeInTheDocument();
      expect(screen.getByText("5,000")).toBeInTheDocument();
      expect(screen.getByText("Avg")).toBeInTheDocument();
      expect(screen.getByText("500")).toBeInTheDocument();
    });
  });

  it("should render correct links to post detail pages", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockStatsData,
    } as Response);

    const { container } = render(<PostStatsTop locale="en" />);

    await waitFor(() => {
      const links = container.querySelectorAll('a[href^="/admin/posts/"]');
      expect(links.length).toBe(5);
      expect(links[0]).toHaveAttribute("href", "/admin/posts/1");
      expect(links[1]).toHaveAttribute("href", "/admin/posts/2");
    });
  });

  it("should display error message when fetch fails", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));

    render(<PostStatsTop locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load stats")).toBeInTheDocument();
    });
  });

  it("should display error message when response is not ok", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    render(<PostStatsTop locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load stats")).toBeInTheDocument();
    });
  });

  it("should display empty state when no posts exist", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        topPosts: [],
        stats: {
          totalPosts: 0,
          totalViews: 0,
          averageViews: 0,
        },
      }),
    } as Response);

    render(<PostStatsTop locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("No posts yet")).toBeInTheDocument();
    });
  });

  it("should use Chinese translations when locale is zh", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockStatsData,
    } as Response);

    render(<PostStatsTop locale="zh" />);

    await waitFor(() => {
      expect(screen.getByText("热门文章")).toBeInTheDocument();
      expect(screen.getByText("1,000 次浏览")).toBeInTheDocument();
      expect(screen.getByText("总数")).toBeInTheDocument();
      expect(screen.getByText("浏览")).toBeInTheDocument();
      expect(screen.getByText("平均")).toBeInTheDocument();
    });
  });

  it("should default to English when locale is not provided", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockStatsData,
    } as Response);

    render(<PostStatsTop />);

    await waitFor(() => {
      expect(screen.getByText("Top Posts")).toBeInTheDocument();
    });
  });

  it("should format dates according to locale", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        topPosts: [
          {
            id: "1",
            title: "Test Post",
            slug: "test-post",
            viewCount: 100,
            publishedAt: "2025-10-15T00:00:00.000Z",
          },
        ],
        stats: {
          totalPosts: 1,
          totalViews: 100,
          averageViews: 100,
        },
      }),
    } as Response);

    render(<PostStatsTop locale="en" />);

    await waitFor(() => {
      // English date format should be "Oct 15"
      expect(screen.getByText(/Oct 15/)).toBeInTheDocument();
    });
  });

  it("should handle posts without publishedAt date", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        topPosts: [
          {
            id: "1",
            title: "Draft Post",
            slug: "draft-post",
            viewCount: 100,
            publishedAt: null,
          },
        ],
        stats: {
          totalPosts: 1,
          totalViews: 100,
          averageViews: 100,
        },
      }),
    } as Response);

    render(<PostStatsTop locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("Draft Post")).toBeInTheDocument();
      // Should render without date separator
      const container = screen.getByText("100 views").closest("div");
      expect(container?.textContent).not.toContain("·");
    });
  });

  it("should fetch from correct API endpoint", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockStatsData,
    } as Response);

    render(<PostStatsTop locale="en" />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/admin/stats/posts");
    });
  });

  it("should only display top 5 posts even if more are returned", async () => {
    const dataWithMorePosts = {
      topPosts: [
        ...mockStatsData.topPosts,
        {
          id: "6",
          title: "Sixth Post",
          slug: "sixth-post",
          viewCount: 100,
          publishedAt: "2025-10-06T00:00:00.000Z",
        },
        {
          id: "7",
          title: "Seventh Post",
          slug: "seventh-post",
          viewCount: 50,
          publishedAt: "2025-10-07T00:00:00.000Z",
        },
      ],
      stats: mockStatsData.stats,
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => dataWithMorePosts,
    } as Response);

    const { container } = render(<PostStatsTop locale="en" />);

    await waitFor(() => {
      const links = container.querySelectorAll('a[href^="/admin/posts/"]');
      expect(links.length).toBe(5); // Only top 5
      expect(screen.queryByText("Sixth Post")).not.toBeInTheDocument();
      expect(screen.queryByText("Seventh Post")).not.toBeInTheDocument();
    });
  });

  it("should log error to console on fetch failure", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));

    render(<PostStatsTop locale="en" />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to fetch post stats:",
        expect.any(Error)
      );
    });

    consoleErrorSpy.mockRestore();
  });
});

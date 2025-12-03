import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ReadingDetailPage } from "../reading-detail-page";
import type { ReadingData } from "@/types/live-data";

// Mock fetch
const mockReadingData: ReadingData = {
  stats: {
    thisMonth: { books: 2, articles: 15 },
    thisYear: { books: 24, articles: 180 },
    allTime: { books: 156, articles: 890 },
  },
  currentlyReading: [
    {
      title: "System Design Interview",
      author: "Alex Xu",
      progress: 65,
      currentPage: 195,
      totalPages: 300,
      startedAt: new Date("2025-01-01"),
      cover: "/book-cover.jpg",
    },
  ],
  recentlyFinished: [
    {
      title: "Clean Code",
      author: "Robert C. Martin",
      rating: 5,
      finishedAt: new Date("2024-12-25"),
      cover: "/clean-code.jpg",
    },
  ],
  recentArticles: [
    {
      title: "Understanding React Server Components",
      url: "https://example.com/article",
      source: "Tech Blog",
      readAt: new Date("2025-02-10"),
    },
  ],
};

global.fetch = vi.fn();

describe("ReadingDetailPage", () => {
  beforeEach(() => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockReadingData,
    } as Response);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should render loading state initially", () => {
    render(<ReadingDetailPage locale="en" />);
    expect(screen.getByText("Reading Activity")).toBeInTheDocument();
  });

  it("should render reading statistics in English", async () => {
    render(<ReadingDetailPage locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("This Month")).toBeInTheDocument();
      expect(screen.getByText("2 books")).toBeInTheDocument();
      expect(screen.getByText("15 articles")).toBeInTheDocument();
    });
  });

  it("should render reading statistics in Chinese", async () => {
    render(<ReadingDetailPage locale="zh" />);

    await waitFor(() => {
      expect(screen.getByText("本月")).toBeInTheDocument();
      expect(screen.getByText("2 书籍")).toBeInTheDocument();
      expect(screen.getByText("15 文章")).toBeInTheDocument();
    });
  });

  it("should display currently reading books", async () => {
    render(<ReadingDetailPage locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("Currently Reading")).toBeInTheDocument();
      expect(screen.getByText("System Design Interview")).toBeInTheDocument();
      expect(screen.getByText("Alex Xu")).toBeInTheDocument();
    });
  });

  it("should display reading progress", async () => {
    render(<ReadingDetailPage locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("Progress")).toBeInTheDocument();
      expect(screen.getByText("195 / 300 pages")).toBeInTheDocument();
    });
  });

  it("should display progress bar", async () => {
    render(<ReadingDetailPage locale="en" />);

    await waitFor(() => {
      // Progress bar should be rendered (visual representation)
      const progressElements = screen.getAllByText("195 / 300 pages");
      expect(progressElements.length).toBeGreaterThan(0);
    });
  });

  it("should display start date", async () => {
    render(<ReadingDetailPage locale="en" />);

    await waitFor(() => {
      expect(screen.getByText(/Started Jan 1/)).toBeInTheDocument();
    });
  });

  it("should display recently finished books", async () => {
    render(<ReadingDetailPage locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("Recently Finished")).toBeInTheDocument();
      expect(screen.getByText("Clean Code")).toBeInTheDocument();
      expect(screen.getByText("Robert C. Martin")).toBeInTheDocument();
    });
  });

  it("should display star ratings", async () => {
    render(<ReadingDetailPage locale="en" />);

    await waitFor(() => {
      // Should display 5 stars
      const stars = screen.getAllByText("★");
      expect(stars.length).toBeGreaterThanOrEqual(5);
    });
  });

  it("should display recent articles", async () => {
    render(<ReadingDetailPage locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("Recent Articles")).toBeInTheDocument();
      expect(screen.getByText("Understanding React Server Components")).toBeInTheDocument();
      expect(screen.getByText("Tech Blog")).toBeInTheDocument();
    });
  });

  it("should have clickable article links", async () => {
    render(<ReadingDetailPage locale="en" />);

    await waitFor(() => {
      const articleLink = screen.getByText("Understanding React Server Components").closest("a");
      expect(articleLink).toHaveAttribute("href", "https://example.com/article");
      expect(articleLink).toHaveAttribute("target", "_blank");
      expect(articleLink).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  it("should display all time statistics", async () => {
    render(<ReadingDetailPage locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("All Time")).toBeInTheDocument();
      expect(screen.getByText("156 books")).toBeInTheDocument();
      expect(screen.getByText("890 articles")).toBeInTheDocument();
    });
  });

  it("should display year statistics", async () => {
    render(<ReadingDetailPage locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("This Year")).toBeInTheDocument();
      expect(screen.getByText("24 books")).toBeInTheDocument();
      expect(screen.getByText("180 articles")).toBeInTheDocument();
    });
  });

  it("should have back to dashboard link", async () => {
    render(<ReadingDetailPage locale="en" />);

    await waitFor(() => {
      const link = screen.getByText("Back to Dashboard");
      expect(link.closest("a")).toHaveAttribute("href", "/about/live");
    });
  });

  it("should fetch data from correct API endpoint", async () => {
    render(<ReadingDetailPage locale="en" />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/about/live/reading");
    });
  });

  it("should handle fetch error gracefully", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("API Error"));

    render(<ReadingDetailPage locale="en" />);

    // Should still render without crashing
    await waitFor(() => {
      expect(screen.queryByText("Currently Reading")).not.toBeInTheDocument();
    });
  });

  it("should format dates correctly", async () => {
    render(<ReadingDetailPage locale="en" />);

    await waitFor(() => {
      expect(screen.getByText(/Jan 1/)).toBeInTheDocument();
      expect(screen.getByText(/Feb 10/)).toBeInTheDocument();
    });
  });
});

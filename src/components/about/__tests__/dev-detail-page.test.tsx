import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { DevDetailPage } from "../dev-detail-page";
import type { DevData } from "@/types/live-data";

// Mock fetch
const mockDevData: DevData = {
  stats: {
    thisWeek: { commits: 23, repos: 5 },
    thisMonth: { commits: 89, pullRequests: 12 },
    thisYear: { stars: 245, repos: 18 },
    currentStreak: 7,
  },
  contributionHeatmap: Array(365)
    .fill(0)
    .map((_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      value: Math.floor(Math.random() * 10),
    })),
  activeRepos: [
    {
      name: "awesome-project",
      fullName: "user/awesome-project",
      language: "TypeScript",
      commitsThisMonth: 25,
      lastCommit: {
        message: "feat: add new feature",
        date: new Date("2025-01-10"),
      },
    },
  ],
  languages: [
    { name: "TypeScript", hours: 120, percentage: 45 },
    { name: "Python", hours: 80, percentage: 30 },
    { name: "Go", hours: 67, percentage: 25 },
  ],
};

global.fetch = vi.fn();

describe("DevDetailPage", () => {
  beforeEach(() => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockDevData,
    } as Response);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should render loading state initially", () => {
    render(<DevDetailPage locale="en" />);
    // Title includes emoji, so use regex or check for partial text
    expect(screen.getByText(/Development Activity/)).toBeInTheDocument();
    // Verify skeleton cards are present
    expect(document.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("should render dev statistics in English", async () => {
    render(<DevDetailPage locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("This Week")).toBeInTheDocument();
      expect(screen.getByText("23")).toBeInTheDocument();
      expect(screen.getByText("5 repos")).toBeInTheDocument();
    });
  });

  it("should render dev statistics in Chinese", async () => {
    render(<DevDetailPage locale="zh" />);

    await waitFor(() => {
      expect(screen.getByText("本周")).toBeInTheDocument();
      expect(screen.getByText("23")).toBeInTheDocument();
      expect(screen.getByText("5 仓库")).toBeInTheDocument();
    });
  });

  it("should display current streak", async () => {
    render(<DevDetailPage locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("Current Streak")).toBeInTheDocument();
      expect(screen.getByText("7")).toBeInTheDocument();
      expect(screen.getByText("days")).toBeInTheDocument();
    });
  });

  it("should display contribution heatmap", async () => {
    render(<DevDetailPage locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("Contribution Heatmap")).toBeInTheDocument();
    });
  });

  it("should display active repositories", async () => {
    render(<DevDetailPage locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("Active Repositories")).toBeInTheDocument();
      expect(screen.getByText("awesome-project")).toBeInTheDocument();
      expect(screen.getByText("user/awesome-project")).toBeInTheDocument();
      expect(screen.getByText("TypeScript")).toBeInTheDocument();
    });
  });

  it("should display last commit information", async () => {
    render(<DevDetailPage locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("feat: add new feature")).toBeInTheDocument();
      expect(screen.getByText("25")).toBeInTheDocument();
      expect(screen.getByText("Commits This Month")).toBeInTheDocument();
    });
  });

  it("should display programming languages", async () => {
    render(<DevDetailPage locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("Programming Languages")).toBeInTheDocument();
      expect(screen.getAllByText("TypeScript")[0]).toBeInTheDocument();
      expect(screen.getByText("Python")).toBeInTheDocument();
      expect(screen.getByText("Go")).toBeInTheDocument();
    });
  });

  it("should display language percentages", async () => {
    render(<DevDetailPage locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("45%")).toBeInTheDocument();
      expect(screen.getByText("30%")).toBeInTheDocument();
      expect(screen.getByText("25%")).toBeInTheDocument();
    });
  });

  it("should display language hours", async () => {
    render(<DevDetailPage locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("120.0h")).toBeInTheDocument();
      expect(screen.getByText("80.0h")).toBeInTheDocument();
      expect(screen.getByText("67.0h")).toBeInTheDocument();
    });
  });

  it("should have back to dashboard link", async () => {
    render(<DevDetailPage locale="en" />);

    await waitFor(() => {
      const link = screen.getByText("Back to Dashboard");
      expect(link.closest("a")).toHaveAttribute("href", "/en/about/live");
    });
  });

  it("should fetch data from correct API endpoint", async () => {
    render(<DevDetailPage locale="en" />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/about/live/dev");
    });
  });

  it("should handle fetch error gracefully", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("API Error"));

    render(<DevDetailPage locale="en" />);

    // Should still render without crashing
    await waitFor(() => {
      expect(screen.queryByText("Active Repositories")).not.toBeInTheDocument();
    });
  });

  it("should format dates correctly", async () => {
    render(<DevDetailPage locale="en" />);

    await waitFor(() => {
      // Date is formatted as relative time (e.g., "5d ago", "24h ago") not absolute date
      const dateElements = screen.getAllByText(/\d+[hd] ago/);
      expect(dateElements.length).toBeGreaterThan(0);
    });
  });

  it("should display year statistics", async () => {
    render(<DevDetailPage locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("This Year")).toBeInTheDocument();
      expect(screen.getByText("245")).toBeInTheDocument();
      expect(screen.getByText("18 repos")).toBeInTheDocument();
    });
  });

  it("should display month statistics", async () => {
    render(<DevDetailPage locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("This Month")).toBeInTheDocument();
      expect(screen.getByText("89")).toBeInTheDocument();
      expect(screen.getByText("12 PRs")).toBeInTheDocument();
    });
  });
});

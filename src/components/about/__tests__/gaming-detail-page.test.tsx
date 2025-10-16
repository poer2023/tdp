import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { GamingDetailPage } from "../gaming-detail-page";
import type { GamingData } from "@/types/live-data";

// Mock fetch
const mockGamingData: GamingData = {
  stats: {
    thisMonth: { totalHours: 45, gamesPlayed: 8 },
    thisYear: { totalHours: 520, gamesPlayed: 35 },
    platforms: [
      { id: "steam", name: "Steam", activeGames: 12 },
      { id: "ps5", name: "PlayStation 5", activeGames: 8 },
    ],
  },
  currentlyPlaying: [
    {
      gameId: "1",
      gameName: "Elden Ring",
      platform: "Steam",
      playtime: 45,
      lastPlayed: new Date("2025-01-10"),
      progress: 75,
      achievements: 45,
      totalAchievements: 60,
    },
  ],
  recentSessions: [
    {
      gameName: "Elden Ring",
      duration: 120,
      date: new Date("2025-01-10"),
    },
  ],
  playtimeHeatmap: Array(365)
    .fill(0)
    .map((_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      value: Math.floor(Math.random() * 5),
    })),
};

global.fetch = vi.fn();

describe("GamingDetailPage", () => {
  beforeEach(() => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockGamingData,
    } as Response);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should render loading state initially", () => {
    render(<GamingDetailPage locale="en" />);
    expect(screen.getByText(/Gaming Activity/)).toBeInTheDocument();
  });

  it("should render gaming statistics in English", async () => {
    render(<GamingDetailPage locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("This Month")).toBeInTheDocument();
      expect(screen.getByText("45hours")).toBeInTheDocument();
      expect(screen.getByText("8 games")).toBeInTheDocument();
    });
  });

  it("should render gaming statistics in Chinese", async () => {
    render(<GamingDetailPage locale="zh" />);

    await waitFor(() => {
      expect(screen.getByText("本月")).toBeInTheDocument();
      expect(screen.getByText("45小时")).toBeInTheDocument();
      expect(screen.getByText("8 游戏")).toBeInTheDocument();
    });
  });

  it("should display currently playing games", async () => {
    render(<GamingDetailPage locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("Currently Playing")).toBeInTheDocument();
      expect(screen.getByText("Elden Ring")).toBeInTheDocument();
      expect(screen.getByText("Steam")).toBeInTheDocument();
      expect(screen.getByText("45 hours")).toBeInTheDocument();
    });
  });

  it("should display progress bar for games with progress", async () => {
    render(<GamingDetailPage locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("75%")).toBeInTheDocument();
    });
  });

  it("should display achievements", async () => {
    render(<GamingDetailPage locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("45 / 60")).toBeInTheDocument();
    });
  });

  it("should display recent sessions", async () => {
    render(<GamingDetailPage locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("Recent Sessions")).toBeInTheDocument();
      expect(screen.getByText("120 min")).toBeInTheDocument();
    });
  });

  it("should display playtime heatmap", async () => {
    render(<GamingDetailPage locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("Playtime This Year")).toBeInTheDocument();
    });
  });

  it("should display platform statistics", async () => {
    render(<GamingDetailPage locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("Platforms")).toBeInTheDocument();
      expect(screen.getByText("Steam")).toBeInTheDocument();
      expect(screen.getByText("PlayStation 5")).toBeInTheDocument();
      expect(screen.getByText("12 games")).toBeInTheDocument();
    });
  });

  it("should have back to dashboard link", async () => {
    render(<GamingDetailPage locale="en" />);

    await waitFor(() => {
      const link = screen.getByText("Back to Dashboard");
      expect(link.closest("a")).toHaveAttribute("href", "/en/about/live");
    });
  });

  it("should fetch data from correct API endpoint", async () => {
    render(<GamingDetailPage locale="en" />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/about/live/gaming");
    });
  });

  it("should handle fetch error gracefully", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("API Error"));

    render(<GamingDetailPage locale="en" />);

    // Should still render without crashing
    await waitFor(() => {
      expect(screen.queryByText("Currently Playing")).not.toBeInTheDocument();
    });
  });

  it("should format dates correctly", async () => {
    render(<GamingDetailPage locale="en" />);

    await waitFor(() => {
      expect(screen.getByText(/Jan 10/)).toBeInTheDocument();
    });
  });

  it("should display correct year stats", async () => {
    render(<GamingDetailPage locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("520 hours")).toBeInTheDocument();
      expect(screen.getByText("35 games")).toBeInTheDocument();
    });
  });
});

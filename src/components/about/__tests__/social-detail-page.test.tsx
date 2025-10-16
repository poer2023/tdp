import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { SocialDetailPage } from "../social-detail-page";
import type { SocialData } from "@/types/live-data";

// Mock fetch
const mockSocialData: SocialData = {
  stats: {
    thisWeek: { conversations: 45, calls: 3 },
    thisMonth: { conversations: 180, calls: 12 },
    activePeople: 23,
    activeGroups: 8,
  },
  recentInteractions: [
    {
      timestamp: new Date("2025-01-10T10:00:00"),
      type: "chat",
      platform: "WeChat",
      anonymizedId: "user_a1b2c3",
      duration: undefined,
    },
    {
      timestamp: new Date("2025-01-10T09:00:00"),
      type: "call",
      platform: "Telegram",
      anonymizedId: "user_x9y8z7",
      duration: 45,
    },
  ],
  platformStats: {
    WeChat: 120,
    Telegram: 45,
    Discord: 30,
    Email: 15,
  },
};

global.fetch = vi.fn();

describe("SocialDetailPage", () => {
  beforeEach(() => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockSocialData,
    } as Response);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should render loading state initially", () => {
    render(<SocialDetailPage locale="en" />);
    expect(screen.getByText("Social Activity")).toBeInTheDocument();
  });

  it("should display privacy notice in English", async () => {
    render(<SocialDetailPage locale="en" />);

    await waitFor(() => {
      expect(screen.getByText(/All interactions are fully anonymized/)).toBeInTheDocument();
    });
  });

  it("should display privacy notice in Chinese", async () => {
    render(<SocialDetailPage locale="zh" />);

    await waitFor(() => {
      expect(screen.getByText(/所有互动数据均已完全匿名化/)).toBeInTheDocument();
    });
  });

  it("should render social statistics in English", async () => {
    render(<SocialDetailPage locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("This Week")).toBeInTheDocument();
      expect(screen.getByText("45 conversations")).toBeInTheDocument();
      expect(screen.getByText("3 calls")).toBeInTheDocument();
    });
  });

  it("should render social statistics in Chinese", async () => {
    render(<SocialDetailPage locale="zh" />);

    await waitFor(() => {
      expect(screen.getByText("本周")).toBeInTheDocument();
      expect(screen.getByText("45 对话")).toBeInTheDocument();
      expect(screen.getByText("3 通话")).toBeInTheDocument();
    });
  });

  it("should display active people and groups", async () => {
    render(<SocialDetailPage locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("Active People")).toBeInTheDocument();
      expect(screen.getByText("23 people")).toBeInTheDocument();
      expect(screen.getByText("Active Groups")).toBeInTheDocument();
      expect(screen.getByText("8 groups")).toBeInTheDocument();
    });
  });

  it("should display platform statistics", async () => {
    render(<SocialDetailPage locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("Platform Distribution")).toBeInTheDocument();
      expect(screen.getByText("WeChat")).toBeInTheDocument();
      expect(screen.getByText("120")).toBeInTheDocument();
      expect(screen.getByText("Telegram")).toBeInTheDocument();
      expect(screen.getByText("45")).toBeInTheDocument();
    });
  });

  it("should display recent interactions", async () => {
    render(<SocialDetailPage locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("Recent Activity")).toBeInTheDocument();
      expect(screen.getByText("WeChat")).toBeInTheDocument();
      expect(screen.getByText("Telegram")).toBeInTheDocument();
    });
  });

  it("should display interaction types", async () => {
    render(<SocialDetailPage locale="en" />);

    await waitFor(() => {
      // Chat and call indicators should be visible
      const interactions = screen.getAllByText(/chat|call/i);
      expect(interactions.length).toBeGreaterThan(0);
    });
  });

  it("should display call durations", async () => {
    render(<SocialDetailPage locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("45 min")).toBeInTheDocument();
    });
  });

  it("should NOT display any personal information", async () => {
    render(<SocialDetailPage locale="en" />);

    await waitFor(() => {
      // Verify NO real names, emails, phone numbers
      const pageText = screen.getByTestId
        ? screen.getByTestId("social-detail-page")?.textContent
        : document.body.textContent;

      expect(pageText).not.toMatch(/@\w+\.\w+/); // No emails
      expect(pageText).not.toMatch(/\d{3}-\d{3}-\d{4}/); // No phone numbers
      // Should only show anonymized IDs like "user_a1b2c3"
    });
  });

  it("should display only anonymized IDs", async () => {
    render(<SocialDetailPage locale="en" />);

    await waitFor(() => {
      expect(screen.getByText(/user_[a-z0-9]+/)).toBeInTheDocument();
    });
  });

  it("should display timestamps", async () => {
    render(<SocialDetailPage locale="en" />);

    await waitFor(() => {
      // Should display time information
      expect(screen.getByText(/Jan 10/)).toBeInTheDocument();
    });
  });

  it("should have back to dashboard link", async () => {
    render(<SocialDetailPage locale="en" />);

    await waitFor(() => {
      const link = screen.getByText("Back to Dashboard");
      expect(link.closest("a")).toHaveAttribute("href", "/en/about/live");
    });
  });

  it("should fetch data from correct API endpoint", async () => {
    render(<SocialDetailPage locale="en" />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/about/live/social");
    });
  });

  it("should handle fetch error gracefully", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("API Error"));

    render(<SocialDetailPage locale="en" />);

    // Should still render without crashing
    await waitFor(() => {
      expect(screen.queryByText("Recent Activity")).not.toBeInTheDocument();
    });
  });

  it("should display month statistics", async () => {
    render(<SocialDetailPage locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("This Month")).toBeInTheDocument();
      expect(screen.getByText("180 conversations")).toBeInTheDocument();
      expect(screen.getByText("12 calls")).toBeInTheDocument();
    });
  });

  it("should render platform distribution chart", async () => {
    render(<SocialDetailPage locale="en" />);

    await waitFor(() => {
      // Platform distribution should be visible
      expect(screen.getByText("Platform Distribution")).toBeInTheDocument();
      // All platforms should be listed
      expect(screen.getByText("WeChat")).toBeInTheDocument();
      expect(screen.getByText("Discord")).toBeInTheDocument();
      expect(screen.getByText("Email")).toBeInTheDocument();
    });
  });

  it("should format relative time correctly", async () => {
    render(<SocialDetailPage locale="en" />);

    await waitFor(() => {
      // Should show relative time like "2 hours ago" or dates
      const timeElements = screen.getAllByText(/ago|Jan/);
      expect(timeElements.length).toBeGreaterThan(0);
    });
  });
});

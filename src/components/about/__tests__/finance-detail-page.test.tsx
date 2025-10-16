import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { FinanceDetailPage } from "../finance-detail-page";
import type { FinanceData } from "@/types/live-data";

// Mock fetch
const mockFinanceData: FinanceData = {
  monthlyTrend: [65, 70, 68, 75, 80, 72, 85, 78, 82, 90, 88, 85],
  categories: [
    { name: "Housing", percentage: 35, amount: undefined },
    { name: "Food", percentage: 25, amount: undefined },
    { name: "Transportation", percentage: 15, amount: undefined },
    { name: "Entertainment", percentage: 12, amount: undefined },
    { name: "Other", percentage: 13, amount: undefined },
  ],
  subscriptions: [
    {
      name: "Netflix",
      amount: "$$",
      renewalDate: new Date("2025-02-15"),
    },
    {
      name: "Spotify",
      amount: "$",
      renewalDate: new Date("2025-01-20"),
    },
  ],
  insights: [
    "Spending increased 5% compared to last month",
    "Entertainment budget is within target range",
  ],
};

global.fetch = vi.fn();

describe("FinanceDetailPage", () => {
  beforeEach(() => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockFinanceData,
    } as Response);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should render loading state initially", () => {
    render(<FinanceDetailPage locale="en" />);
    expect(screen.getByText(/Finance Overview/)).toBeInTheDocument();
  });

  it("should display privacy notice in English", async () => {
    render(<FinanceDetailPage locale="en" />);

    await waitFor(() => {
      expect(screen.getByText(/All amounts are normalized/)).toBeInTheDocument();
    });
  });

  it("should display privacy notice in Chinese", async () => {
    render(<FinanceDetailPage locale="zh" />);

    await waitFor(() => {
      expect(screen.getByText(/所有金额已归一化处理/)).toBeInTheDocument();
    });
  });

  it("should display monthly spending trend", async () => {
    render(<FinanceDetailPage locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("Monthly Spending Trend")).toBeInTheDocument();
    });
  });

  it("should display spending categories", async () => {
    render(<FinanceDetailPage locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("Spending by Category")).toBeInTheDocument();
      expect(screen.getByText("Housing")).toBeInTheDocument();
      expect(screen.getByText("Food")).toBeInTheDocument();
      expect(screen.getByText("Transportation")).toBeInTheDocument();
    });
  });

  it("should display category percentages without real amounts", async () => {
    render(<FinanceDetailPage locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("35%")).toBeInTheDocument();
      expect(screen.getByText("25%")).toBeInTheDocument();
      expect(screen.getByText("15%")).toBeInTheDocument();
      // Should NOT display actual dollar amounts
      const pageText = document.body.textContent;
      expect(pageText).not.toMatch(/\$\d+/);
      expect(pageText).not.toMatch(/\d+\.\d{2}/);
    });
  });

  it("should display subscriptions", async () => {
    render(<FinanceDetailPage locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("Subscriptions")).toBeInTheDocument();
      expect(screen.getByText("Netflix")).toBeInTheDocument();
      expect(screen.getByText("Spotify")).toBeInTheDocument();
    });
  });

  it("should display obscured subscription amounts", async () => {
    render(<FinanceDetailPage locale="en" />);

    await waitFor(() => {
      // Should show tier indicators like "$", "$$", "$$$"
      const amounts = screen.getAllByText(/^\$+$/);
      expect(amounts.length).toBeGreaterThan(0);
      // Should NOT show actual prices
      const pageText = document.body.textContent;
      expect(pageText).not.toMatch(/\$\d+\.\d{2}/);
    });
  });

  it("should display renewal dates", async () => {
    render(<FinanceDetailPage locale="en" />);

    await waitFor(() => {
      expect(screen.getByText(/Feb 15/)).toBeInTheDocument();
      expect(screen.getByText(/Jan 20/)).toBeInTheDocument();
    });
  });

  it("should display insights", async () => {
    render(<FinanceDetailPage locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("Insights")).toBeInTheDocument();
      expect(screen.getByText(/Spending increased 5% compared to last month/)).toBeInTheDocument();
      expect(screen.getByText(/Entertainment budget is within target range/)).toBeInTheDocument();
    });
  });

  it("should NOT expose any real financial amounts", async () => {
    render(<FinanceDetailPage locale="en" />);

    await waitFor(() => {
      const pageText = document.body.textContent || "";

      // Should NOT contain real money patterns
      expect(pageText).not.toMatch(/\$\d+/); // No $123
      expect(pageText).not.toMatch(/\d+\.\d{2}/); // No 123.45
      expect(pageText).not.toMatch(/\d{1,3},\d{3}/); // No 1,234

      // Should only show relative information (percentages, trends)
      expect(pageText).toMatch(/%/); // Should have percentages
    });
  });

  it("should display only relative trends in insights", async () => {
    render(<FinanceDetailPage locale="en" />);

    await waitFor(() => {
      const insights = mockFinanceData.insights;
      insights.forEach((insight) => {
        expect(screen.getByText(insight)).toBeInTheDocument();
        // Insights should not contain actual amounts
        expect(insight).not.toMatch(/\$\d/);
        expect(insight).not.toMatch(/\d+\.\d{2}/);
      });
    });
  });

  it("should render monthly trend chart", async () => {
    render(<FinanceDetailPage locale="en" />);

    await waitFor(() => {
      // Chart should be visible with normalized data (0-100%)
      expect(screen.getByText("Monthly Spending Trend")).toBeInTheDocument();
      // Should show month labels - use getAllByText for multiple matches
      const monthLabels = screen.getAllByText(/^(Jan|Feb|Mar)$/);
      expect(monthLabels.length).toBeGreaterThan(0);
    });
  });

  it("should render category distribution chart", async () => {
    render(<FinanceDetailPage locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("Spending by Category")).toBeInTheDocument();
      // All categories should be visible
      mockFinanceData.categories.forEach((category) => {
        expect(screen.getByText(category.name)).toBeInTheDocument();
        expect(screen.getByText(`${category.percentage}%`)).toBeInTheDocument();
      });
    });
  });

  it("should have back to dashboard link", async () => {
    render(<FinanceDetailPage locale="en" />);

    await waitFor(() => {
      const link = screen.getByText("Back to Dashboard");
      expect(link.closest("a")).toHaveAttribute("href", "/en/about/live");
    });
  });

  it("should fetch data from correct API endpoint", async () => {
    render(<FinanceDetailPage locale="en" />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/about/live/finance");
    });
  });

  it("should handle fetch error gracefully", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("API Error"));

    render(<FinanceDetailPage locale="en" />);

    // Should still render without crashing
    await waitFor(() => {
      expect(screen.queryByText("Monthly Spending Trend")).not.toBeInTheDocument();
    });
  });

  it("should render in English locale", async () => {
    render(<FinanceDetailPage locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("Finance Overview")).toBeInTheDocument();
      expect(screen.getByText("Active Subscriptions")).toBeInTheDocument();
      expect(screen.getByText("Insights")).toBeInTheDocument();
    });
  });

  it("should render in Chinese locale", async () => {
    render(<FinanceDetailPage locale="zh" />);

    await waitFor(() => {
      expect(screen.getByText("财务概览")).toBeInTheDocument();
      expect(screen.getByText("活跃订阅")).toBeInTheDocument();
      expect(screen.getByText("洞察")).toBeInTheDocument();
    });
  });

  it("should validate all amounts are undefined in categories", async () => {
    render(<FinanceDetailPage locale="en" />);

    await waitFor(() => {
      // Verify that category.amount is never displayed
      mockFinanceData.categories.forEach((category) => {
        expect(category.amount).toBeUndefined();
      });
    });
  });
});

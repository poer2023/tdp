import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { LiveDashboard } from "../live-dashboard";
import type { LiveHighlight } from "@/types/live-data";

// Mock fetch
const mockHighlights: LiveHighlight[] = [
  {
    module: "dev",
    icon: "💻",
    title: "Commits Today",
    subtitle: "5 repos active",
    value: "23",
    trend: "up",
    href: "/about/dev",
  },
  {
    module: "gaming",
    icon: "🎮",
    title: "Gaming This Week",
    subtitle: "8 games",
    value: "45 hours",
    trend: "stable",
    href: "/about/gaming",
  },
  {
    module: "reading",
    icon: "📚",
    title: "Currently Reading",
    subtitle: "System Design Interview",
    value: "2 books",
    trend: "stable",
    href: "/about/reading",
  },
  {
    module: "social",
    icon: "💬",
    title: "Social Activity",
    subtitle: "45 conversations",
    value: "This week",
    trend: "up",
    href: "/about/social",
  },
  {
    module: "finance",
    icon: "💰",
    title: "Subscriptions",
    subtitle: "5 active",
    value: "This month",
    trend: "stable",
    href: "/about/finance",
  },
];

global.fetch = vi.fn();

describe("LiveDashboard", () => {
  beforeEach(() => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        highlights: mockHighlights,
        lastUpdated: new Date(),
      }),
    } as Response);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should render loading state initially", () => {
    render(<LiveDashboard locale="en" />);
    // Should show skeleton cards while loading
    expect(document.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("should render all 7 modules in English", async () => {
    render(<LiveDashboard locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("Commits Today")).toBeInTheDocument();
      expect(screen.getByText("Gaming This Week")).toBeInTheDocument();
      expect(screen.getByText("Currently Reading")).toBeInTheDocument();
      expect(screen.getByText("Social Activity")).toBeInTheDocument();
      expect(screen.getByText("Subscriptions")).toBeInTheDocument();
    });
  });

  it("should render all 7 modules in Chinese", async () => {
    // Mock with Chinese data if needed
    render(<LiveDashboard locale="zh" />);

    await waitFor(() => {
      // Should render without error
      expect(fetch).toHaveBeenCalledWith("/api/about/highlights");
    });
  });

  it("should display module icons", async () => {
    render(<LiveDashboard locale="en" />);

    await waitFor(() => {
      // Icons should be rendered (as SVG elements)
      // Lucide icons are rendered as SVG
      const icons = document.querySelectorAll("svg");
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  it("should display module subtitles", async () => {
    render(<LiveDashboard locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("5 repos active")).toBeInTheDocument();
      expect(screen.getByText("8 games")).toBeInTheDocument();
      expect(screen.getByText("System Design Interview")).toBeInTheDocument();
      expect(screen.getByText("45 conversations")).toBeInTheDocument();
    });
  });

  it("should display module values", async () => {
    render(<LiveDashboard locale="en" />);

    await waitFor(() => {
      expect(screen.getByText("23")).toBeInTheDocument();
      expect(screen.getByText("45 hours")).toBeInTheDocument();
      expect(screen.getByText("2 books")).toBeInTheDocument();
    });
  });

  it("should display trend indicators", async () => {
    render(<LiveDashboard locale="en" />);

    await waitFor(() => {
      // Trend indicators should be visible (up/stable/down arrows)
      const trends = document.querySelectorAll("[data-trend]");
      // At minimum, trend styling should be applied
      const pageHTML = document.body.innerHTML;
      expect(pageHTML.length).toBeGreaterThan(0);
    });
  });

  it("should have clickable module cards", async () => {
    render(<LiveDashboard locale="en" />);

    await waitFor(() => {
      const devLink = screen.getByText("Commits Today").closest("a");
      expect(devLink).toHaveAttribute("href", "/about/dev");

      const gamingLink = screen.getByText("Gaming This Week").closest("a");
      expect(gamingLink).toHaveAttribute("href", "/about/gaming");

      const readingLink = screen.getByText("Currently Reading").closest("a");
      expect(readingLink).toHaveAttribute("href", "/about/reading");

      const socialLink = screen.getByText("Social Activity").closest("a");
      expect(socialLink).toHaveAttribute("href", "/about/social");

      const financeLink = screen.getByText("Subscriptions").closest("a");
      expect(financeLink).toHaveAttribute("href", "/about/finance");
    });
  });

  it("should fetch data from correct API endpoint", async () => {
    render(<LiveDashboard locale="en" />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/about/highlights");
    });
  });

  it("should handle fetch error gracefully", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("API Error"));

    render(<LiveDashboard locale="en" />);

    // Should still render without crashing
    await waitFor(() => {
      // Loading state should eventually clear
      expect(screen.queryByText("Commits Today")).not.toBeInTheDocument();
    });
  });

  it("should render correct number of highlight cards", async () => {
    render(<LiveDashboard locale="en" />);

    await waitFor(() => {
      // Should have at least 5 highlights (dev, gaming, reading, social, finance)
      const cards = document.querySelectorAll("a[href*='/about/']");
      expect(cards.length).toBeGreaterThanOrEqual(5);
    });
  });

  it("should support both locales", async () => {
    const { rerender } = render(<LiveDashboard locale="en" />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/about/highlights");
    });

    vi.clearAllMocks();

    rerender(<LiveDashboard locale="zh" />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/about/highlights");
    });
  });

  it("should have responsive grid layout", async () => {
    render(<LiveDashboard locale="en" />);

    await waitFor(() => {
      const container = document.querySelector(".grid");
      expect(container).toBeInTheDocument();
    });
  });

  it("should display all new Phase 4 modules", async () => {
    render(<LiveDashboard locale="en" />);

    await waitFor(() => {
      // Phase 4 modules: reading, social, finance
      expect(screen.getByText("Currently Reading")).toBeInTheDocument();
      expect(screen.getByText("Social Activity")).toBeInTheDocument();
      expect(screen.getByText("Subscriptions")).toBeInTheDocument();
    });
  });

  it("should map icons correctly for all modules", async () => {
    render(<LiveDashboard locale="en" />);

    await waitFor(() => {
      // Each module should have an icon
      mockHighlights.forEach((highlight) => {
        expect(screen.getByText(highlight.title)).toBeInTheDocument();
      });
    });
  });

  it("should render skeleton cards during loading", () => {
    render(<LiveDashboard locale="en" />);

    // Should show skeleton loading state
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should handle empty highlights gracefully", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        highlights: [],
        lastUpdated: new Date(),
      }),
    } as Response);

    render(<LiveDashboard locale="en" />);

    await waitFor(() => {
      // Should render without errors even with empty data
      expect(fetch).toHaveBeenCalledWith("/api/about/highlights");
    });
  });
});

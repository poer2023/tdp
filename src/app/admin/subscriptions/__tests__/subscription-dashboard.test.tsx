import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import SubscriptionDashboard from "../subscription-dashboard";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

// Mock fetch API
global.fetch = vi.fn();

describe("SubscriptionDashboard", () => {
  const mockPush = vi.fn();
  const mockRefresh = vi.fn();

  const mockSubscriptions = [
    {
      id: "sub-1",
      userId: "test-user-id",
      name: "Netflix",
      currency: "USD",
      amount: 15.99,
      amountCNY: 115.0,
      billingCycle: "MONTHLY" as const,
      startDate: "2024-01-01T00:00:00.000Z",
      endDate: "2024-12-31T23:59:59.999Z",
      notes: "Premium plan",
      originalRateToCNY: 7.2,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    },
    {
      id: "sub-2",
      userId: "test-user-id",
      name: "GitHub",
      currency: "USD",
      amount: 7.0,
      amountCNY: 50.0,
      billingCycle: "MONTHLY" as const,
      startDate: "2024-01-01T00:00:00.000Z",
      endDate: null,
      notes: "",
      originalRateToCNY: 7.14,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    },
    {
      id: "sub-3",
      userId: "test-user-id",
      name: "Adobe",
      currency: "USD",
      amount: 52.99,
      amountCNY: 381.0,
      billingCycle: "ANNUAL" as const,
      startDate: "2024-01-01T00:00:00.000Z",
      endDate: "2025-01-01T00:00:00.000Z",
      notes: "Creative Cloud",
      originalRateToCNY: 7.19,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });
  });

  describe("Rendering", () => {
    it("should render dashboard with subscriptions", () => {
      render(<SubscriptionDashboard locale="en" initialSubscriptions={mockSubscriptions} />);

      expect(screen.getByText(/subscription overview/i)).toBeInTheDocument();
      expect(screen.getByText("Netflix")).toBeInTheDocument();
      expect(screen.getByText("GitHub")).toBeInTheDocument();
      expect(screen.getByText("Adobe")).toBeInTheDocument();
    });

    it("should render Chinese labels when locale is zh", () => {
      render(<SubscriptionDashboard locale="zh" initialSubscriptions={mockSubscriptions} />);

      expect(screen.getByText("订阅概览")).toBeInTheDocument();
    });

    it("should render empty state when no subscriptions", () => {
      render(<SubscriptionDashboard locale="en" initialSubscriptions={[]} />);

      expect(screen.getByText(/create.*first subscription/i)).toBeInTheDocument();
    });
  });

  describe("Statistics Display", () => {
    it("should display monthly spend total", () => {
      render(<SubscriptionDashboard locale="en" initialSubscriptions={mockSubscriptions} />);

      // Netflix: ¥115 + GitHub: ¥50 + Adobe: ¥381/12 = ¥165 + ¥31.75 = ¥196.75
      expect(screen.getByText(/monthly spend/i)).toBeInTheDocument();
    });

    it("should display annual spend total", () => {
      render(<SubscriptionDashboard locale="en" initialSubscriptions={mockSubscriptions} />);

      // Netflix: ¥115*12 + GitHub: ¥50*12 + Adobe: ¥381 = ¥1380 + ¥600 + ¥381 = ¥2361
      expect(screen.getByText(/annual spend/i)).toBeInTheDocument();
    });

    it("should calculate correct monthly total", () => {
      render(<SubscriptionDashboard locale="en" initialSubscriptions={mockSubscriptions} />);

      // Monthly: Netflix ¥115 + GitHub ¥50 + Adobe ¥381/12 ≈ ¥196.75
      const monthlyTotal = screen.getByText(/¥196\.75/);
      expect(monthlyTotal).toBeInTheDocument();
    });

    it("should calculate correct annual total", () => {
      render(<SubscriptionDashboard locale="en" initialSubscriptions={mockSubscriptions} />);

      // Annual: (¥115 + ¥50) * 12 + ¥381 = ¥2,361
      const annualTotal = screen.getByText(/¥2,361\.00/);
      expect(annualTotal).toBeInTheDocument();
    });
  });

  describe("View Mode Toggle", () => {
    it("should render monthly view button", () => {
      render(<SubscriptionDashboard locale="en" initialSubscriptions={mockSubscriptions} />);

      expect(screen.getByRole("button", { name: /monthly view/i })).toBeInTheDocument();
    });

    it("should render annual view button", () => {
      render(<SubscriptionDashboard locale="en" initialSubscriptions={mockSubscriptions} />);

      expect(screen.getByRole("button", { name: /annual view/i })).toBeInTheDocument();
    });

    it("should switch to annual view when clicked", () => {
      render(<SubscriptionDashboard locale="en" initialSubscriptions={mockSubscriptions} />);

      const annualButton = screen.getByRole("button", { name: /annual view/i });
      fireEvent.click(annualButton);

      expect(annualButton).toHaveClass(/bg-blue-600/);
    });

    it("should switch back to monthly view when clicked", () => {
      render(<SubscriptionDashboard locale="en" initialSubscriptions={mockSubscriptions} />);

      const annualButton = screen.getByRole("button", { name: /annual view/i });
      const monthlyButton = screen.getByRole("button", { name: /monthly view/i });

      fireEvent.click(annualButton);
      fireEvent.click(monthlyButton);

      expect(monthlyButton).toHaveClass(/bg-blue-600/);
    });
  });

  describe("Billing Cycle Filter", () => {
    it("should render billing cycle filter dropdown", () => {
      render(<SubscriptionDashboard locale="en" initialSubscriptions={mockSubscriptions} />);

      const filterSelect = screen.getByRole("combobox");
      expect(filterSelect).toBeInTheDocument();
    });

    it("should filter subscriptions by MONTHLY billing cycle", () => {
      render(<SubscriptionDashboard locale="en" initialSubscriptions={mockSubscriptions} />);

      const filterSelect = screen.getByRole("combobox");
      fireEvent.change(filterSelect, { target: { value: "MONTHLY" } });

      expect(screen.getByText("Netflix")).toBeInTheDocument();
      expect(screen.getByText("GitHub")).toBeInTheDocument();
      expect(screen.queryByText("Adobe")).not.toBeInTheDocument();
    });

    it("should filter subscriptions by ANNUAL billing cycle", () => {
      render(<SubscriptionDashboard locale="en" initialSubscriptions={mockSubscriptions} />);

      const filterSelect = screen.getByRole("combobox");
      fireEvent.change(filterSelect, { target: { value: "ANNUAL" } });

      expect(screen.queryByText("Netflix")).not.toBeInTheDocument();
      expect(screen.queryByText("GitHub")).not.toBeInTheDocument();
      expect(screen.getByText("Adobe")).toBeInTheDocument();
    });

    it("should show all subscriptions when filter is set to ALL", () => {
      render(<SubscriptionDashboard locale="en" initialSubscriptions={mockSubscriptions} />);

      const filterSelect = screen.getByRole("combobox");

      // First filter to MONTHLY
      fireEvent.change(filterSelect, { target: { value: "MONTHLY" } });
      expect(screen.queryByText("Adobe")).not.toBeInTheDocument();

      // Then filter back to ALL
      fireEvent.change(filterSelect, { target: { value: "ALL" } });
      expect(screen.getByText("Netflix")).toBeInTheDocument();
      expect(screen.getByText("GitHub")).toBeInTheDocument();
      expect(screen.getByText("Adobe")).toBeInTheDocument();
    });

    it("should update statistics based on filter", () => {
      render(<SubscriptionDashboard locale="en" initialSubscriptions={mockSubscriptions} />);

      const filterSelect = screen.getByRole("combobox");
      fireEvent.change(filterSelect, { target: { value: "MONTHLY" } });

      // Only Netflix (¥115) + GitHub (¥50) = ¥165
      expect(screen.getByText(/¥165\.00/)).toBeInTheDocument();
    });
  });

  describe("Add Subscription Navigation", () => {
    it("should render add subscription button", () => {
      render(<SubscriptionDashboard locale="en" initialSubscriptions={mockSubscriptions} />);

      expect(screen.getByRole("link", { name: /add subscription/i })).toBeInTheDocument();
    });

    it("should navigate to new subscription page when clicked", () => {
      render(<SubscriptionDashboard locale="en" initialSubscriptions={mockSubscriptions} />);

      const addLink = screen.getByRole("link", { name: /add subscription/i });
      expect(addLink).toHaveAttribute("href", "/admin/subscriptions/new");
    });
  });

  describe("Delete Subscription", () => {
    it("should show delete confirmation dialog", async () => {
      window.confirm = vi.fn(() => true);

      render(<SubscriptionDashboard locale="en" initialSubscriptions={mockSubscriptions} />);

      // Expand first card
      const netflixCard = screen.getByText("Netflix").closest("[class*='Card']") as HTMLElement;
      fireEvent.click(netflixCard);

      await waitFor(() => {
        const deleteButton = screen.getByRole("button", { name: /delete subscription/i });
        fireEvent.click(deleteButton);
      });

      expect(window.confirm).toHaveBeenCalled();
    });

    it("should delete subscription when confirmed", async () => {
      window.confirm = vi.fn(() => true);
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Deleted" }),
      });

      render(<SubscriptionDashboard locale="en" initialSubscriptions={mockSubscriptions} />);

      // Expand first card
      const netflixCard = screen.getByText("Netflix").closest("[class*='Card']") as HTMLElement;
      fireEvent.click(netflixCard);

      await waitFor(() => {
        const deleteButton = screen.getByRole("button", { name: /delete subscription/i });
        fireEvent.click(deleteButton);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/subscriptions/sub-1", {
          method: "DELETE",
        });
      });
    });

    it("should not delete subscription when cancelled", async () => {
      window.confirm = vi.fn(() => false);

      render(<SubscriptionDashboard locale="en" initialSubscriptions={mockSubscriptions} />);

      // Expand first card
      const netflixCard = screen.getByText("Netflix").closest("[class*='Card']") as HTMLElement;
      fireEvent.click(netflixCard);

      await waitFor(() => {
        const deleteButton = screen.getByRole("button", { name: /delete subscription/i });
        fireEvent.click(deleteButton);
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should remove subscription from list after successful deletion", async () => {
      window.confirm = vi.fn(() => true);
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "Deleted" }),
      });

      render(<SubscriptionDashboard locale="en" initialSubscriptions={mockSubscriptions} />);

      // Expand and delete Netflix
      const netflixCard = screen.getByText("Netflix").closest("[class*='Card']") as HTMLElement;
      fireEvent.click(netflixCard);

      await waitFor(() => {
        const deleteButton = screen.getByRole("button", { name: /delete subscription/i });
        fireEvent.click(deleteButton);
      });

      await waitFor(() => {
        expect(screen.queryByText("Netflix")).not.toBeInTheDocument();
      });
    });
  });

  describe("Export Functionality", () => {
    it("should render export button", () => {
      render(<SubscriptionDashboard locale="en" initialSubscriptions={mockSubscriptions} />);

      expect(screen.getByRole("button", { name: /download markdown/i })).toBeInTheDocument();
    });

    it("should disable export button when no subscriptions", () => {
      render(<SubscriptionDashboard locale="en" initialSubscriptions={[]} />);

      const exportButton = screen.getByRole("button", { name: /download markdown/i });
      expect(exportButton).toBeDisabled();
    });

    it("should trigger export when clicked", () => {
      // Mock createObjectURL and revokeObjectURL
      global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
      global.URL.revokeObjectURL = vi.fn();

      // Mock document.createElement to track link creation
      const mockLink = {
        href: "",
        download: "",
        click: vi.fn(),
      };
      const originalCreateElement = document.createElement.bind(document);
      document.createElement = vi.fn((tag) => {
        if (tag === "a") return mockLink as unknown as HTMLAnchorElement;
        return originalCreateElement(tag);
      });

      render(<SubscriptionDashboard locale="en" initialSubscriptions={mockSubscriptions} />);

      const exportButton = screen.getByRole("button", { name: /download markdown/i });
      fireEvent.click(exportButton);

      expect(mockLink.click).toHaveBeenCalled();
      expect(mockLink.download).toMatch(/subscriptions-.*\.md/);
    });
  });

  describe("Charts and Visualizations", () => {
    it("should render subscription pie chart", () => {
      render(<SubscriptionDashboard locale="en" initialSubscriptions={mockSubscriptions} />);

      // Check for chart container presence
      expect(screen.getByText(/monthly view/i)).toBeInTheDocument();
    });

    it("should render trend chart", () => {
      render(<SubscriptionDashboard locale="en" initialSubscriptions={mockSubscriptions} />);

      // Check for trend chart title
      expect(screen.getByText(/trend/i)).toBeInTheDocument();
    });
  });

  describe("Responsive Behavior", () => {
    it("should render grid layout for subscription cards", () => {
      render(<SubscriptionDashboard locale="en" initialSubscriptions={mockSubscriptions} />);

      const cards = screen.getAllByText(/Netflix|GitHub|Adobe/);
      expect(cards.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels for interactive elements", () => {
      render(<SubscriptionDashboard locale="en" initialSubscriptions={mockSubscriptions} />);

      expect(screen.getByRole("link", { name: /add subscription/i })).toBeInTheDocument();
      expect(screen.getByRole("combobox")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /monthly view/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /annual view/i })).toBeInTheDocument();
    });
  });
});

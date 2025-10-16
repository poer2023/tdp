import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SubscriptionExpandableCard } from "../subscription-expandable-card";

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  useSpring: () => ({ set: vi.fn() }),
}));

describe("SubscriptionExpandableCard", () => {
  const mockSubscription = {
    id: "test-subscription-id",
    userId: "test-user-id",
    name: "Netflix",
    currency: "USD",
    amount: 15.99,
    amountCNY: 115.0,
    billingCycle: "MONTHLY" as const,
    startDate: "2024-01-01T00:00:00.000Z",
    endDate: "2024-12-31T23:59:59.999Z",
    notes: "Premium subscription plan",
    originalRateToCNY: 7.2,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true);
  });

  describe("Rendering", () => {
    it("should render subscription name and basic info", () => {
      render(
        <SubscriptionExpandableCard
          subscription={mockSubscription}
          locale="en"
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText("Netflix")).toBeInTheDocument();
      expect(screen.getByText(/end date/i)).toBeInTheDocument();
      expect(screen.getByText("Monthly")).toBeInTheDocument();
    });

    it("should display monthly and annual values", () => {
      render(
        <SubscriptionExpandableCard
          subscription={mockSubscription}
          locale="en"
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText(/monthly view/i)).toBeInTheDocument();
      expect(screen.getByText(/annual view/i)).toBeInTheDocument();
      expect(screen.getByText("¥115.00")).toBeInTheDocument(); // Monthly
      expect(screen.getByText("¥1,380.00")).toBeInTheDocument(); // Annual (115 * 12)
    });

    it("should display progress bar when end date exists", () => {
      render(
        <SubscriptionExpandableCard
          subscription={mockSubscription}
          locale="en"
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText(/progress/i)).toBeInTheDocument();
      expect(screen.getByText(/\d+%/)).toBeInTheDocument();
    });

    it("should not display progress bar when end date is null", () => {
      const subscriptionWithoutEndDate = {
        ...mockSubscription,
        endDate: null,
      };

      render(
        <SubscriptionExpandableCard
          subscription={subscriptionWithoutEndDate}
          locale="en"
          onDelete={mockOnDelete}
        />
      );

      expect(screen.queryByText(/progress/i)).not.toBeInTheDocument();
    });

    it("should display 'No end date' message when end date is null", () => {
      const subscriptionWithoutEndDate = {
        ...mockSubscription,
        endDate: null,
      };

      render(
        <SubscriptionExpandableCard
          subscription={subscriptionWithoutEndDate}
          locale="en"
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText(/no end date/i)).toBeInTheDocument();
    });
  });

  describe("Billing Cycle Badge", () => {
    it("should display Monthly badge", () => {
      render(
        <SubscriptionExpandableCard
          subscription={{ ...mockSubscription, billingCycle: "MONTHLY" }}
          locale="en"
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText("Monthly")).toBeInTheDocument();
    });

    it("should display Annual badge", () => {
      render(
        <SubscriptionExpandableCard
          subscription={{ ...mockSubscription, billingCycle: "ANNUAL" }}
          locale="en"
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText("Annual")).toBeInTheDocument();
    });

    it("should display One-time badge", () => {
      render(
        <SubscriptionExpandableCard
          subscription={{ ...mockSubscription, billingCycle: "ONE_TIME" }}
          locale="en"
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText("One-time")).toBeInTheDocument();
    });
  });

  describe("Card Expansion", () => {
    it("should expand card when clicked", async () => {
      render(
        <SubscriptionExpandableCard
          subscription={mockSubscription}
          locale="en"
          onDelete={mockOnDelete}
        />
      );

      const netflixText = screen.getByText("Netflix");
      const card = (netflixText.closest("div[class*='rounded']") ||
        netflixText.parentElement) as HTMLElement;

      // Initially, expanded content should not be visible
      expect(screen.queryByText(/original amount/i)).not.toBeInTheDocument();

      // Click to expand
      fireEvent.click(card);

      await waitFor(() => {
        expect(screen.getByText(/original amount/i)).toBeInTheDocument();
      });
    });

    it("should display subscription details when expanded", async () => {
      render(
        <SubscriptionExpandableCard
          subscription={mockSubscription}
          locale="en"
          onDelete={mockOnDelete}
        />
      );

      const netflixText = screen.getByText("Netflix");
      const card = (netflixText.closest("div[class*='rounded']") ||
        netflixText.parentElement) as HTMLElement;
      fireEvent.click(card);

      await waitFor(() => {
        expect(screen.getByText(/original amount/i)).toBeInTheDocument();
        expect(screen.getByText("$15.99")).toBeInTheDocument();
        expect(screen.getByText(/converted amount/i)).toBeInTheDocument();
        // Check for multiple instances of the amount value
        const amountElements = screen.getAllByText("¥115.00");
        expect(amountElements.length).toBeGreaterThan(0);
        expect(screen.getByText(/start date/i)).toBeInTheDocument();
      });
    });

    it("should display notes when expanded and notes exist", async () => {
      render(
        <SubscriptionExpandableCard
          subscription={mockSubscription}
          locale="en"
          onDelete={mockOnDelete}
        />
      );

      const netflixText = screen.getByText("Netflix");
      const card = (netflixText.closest("div[class*='rounded']") ||
        netflixText.parentElement) as HTMLElement;
      fireEvent.click(card);

      await waitFor(() => {
        expect(screen.getByText(/notes/i)).toBeInTheDocument();
        expect(screen.getByText("Premium subscription plan")).toBeInTheDocument();
      });
    });

    it("should not display notes section when notes are empty", async () => {
      const subscriptionWithoutNotes = {
        ...mockSubscription,
        notes: "",
      };

      render(
        <SubscriptionExpandableCard
          subscription={subscriptionWithoutNotes}
          locale="en"
          onDelete={mockOnDelete}
        />
      );

      const netflixText = screen.getByText("Netflix");
      const card = (netflixText.closest("div[class*='rounded']") ||
        netflixText.parentElement) as HTMLElement;
      fireEvent.click(card);

      await waitFor(() => {
        expect(screen.queryByText(/notes/i)).not.toBeInTheDocument();
      });
    });
  });

  describe("Edit Button Navigation", () => {
    it("should render edit button as link when expanded", async () => {
      render(
        <SubscriptionExpandableCard
          subscription={mockSubscription}
          locale="en"
          onDelete={mockOnDelete}
        />
      );

      const netflixText = screen.getByText("Netflix");
      const card = (netflixText.closest("div[class*='rounded']") ||
        netflixText.parentElement) as HTMLElement;
      fireEvent.click(card);

      await waitFor(() => {
        const editLink = screen.getByText(/edit subscription/i).closest("a");
        expect(editLink).toHaveAttribute("href", "/admin/subscriptions/test-subscription-id");
      });
    });

    it("should not trigger card collapse when edit button is clicked", async () => {
      render(
        <SubscriptionExpandableCard
          subscription={mockSubscription}
          locale="en"
          onDelete={mockOnDelete}
        />
      );

      const netflixText = screen.getByText("Netflix");
      const card = (netflixText.closest("div[class*='rounded']") ||
        netflixText.parentElement) as HTMLElement;
      fireEvent.click(card);

      await waitFor(() => {
        expect(screen.getByText(/edit subscription/i)).toBeInTheDocument();
      });

      const editButton = screen.getByText(/edit subscription/i);
      fireEvent.click(editButton);

      // Card should still be expanded
      expect(screen.getByText(/original amount/i)).toBeInTheDocument();
    });
  });

  describe("Delete Button", () => {
    it("should display delete button when expanded", async () => {
      render(
        <SubscriptionExpandableCard
          subscription={mockSubscription}
          locale="en"
          onDelete={mockOnDelete}
        />
      );

      const netflixText = screen.getByText("Netflix");
      const card = (netflixText.closest("div[class*='rounded']") ||
        netflixText.parentElement) as HTMLElement;
      fireEvent.click(card);

      await waitFor(() => {
        expect(screen.getByText(/delete subscription/i)).toBeInTheDocument();
      });
    });

    it("should call onDelete with subscription when delete is confirmed", async () => {
      window.confirm = vi.fn(() => true);

      render(
        <SubscriptionExpandableCard
          subscription={mockSubscription}
          locale="en"
          onDelete={mockOnDelete}
        />
      );

      const netflixText = screen.getByText("Netflix");
      const card = (netflixText.closest("div[class*='rounded']") ||
        netflixText.parentElement) as HTMLElement;
      fireEvent.click(card);

      await waitFor(() => {
        const deleteButton = screen.getByText(/delete subscription/i);
        fireEvent.click(deleteButton);
      });

      expect(mockOnDelete).toHaveBeenCalledWith(mockSubscription);
    });

    it("should not call onDelete when delete is cancelled", async () => {
      window.confirm = vi.fn(() => false);

      render(
        <SubscriptionExpandableCard
          subscription={mockSubscription}
          locale="en"
          onDelete={mockOnDelete}
        />
      );

      const netflixText = screen.getByText("Netflix");
      const card = (netflixText.closest("div[class*='rounded']") ||
        netflixText.parentElement) as HTMLElement;
      if (card) {
        fireEvent.click(card);
      }

      await waitFor(() => {
        const deleteButton = screen.getByText(/delete subscription/i);
        fireEvent.click(deleteButton);
      });

      expect(mockOnDelete).not.toHaveBeenCalled();
    });

    it("should not trigger card collapse when delete button is clicked", async () => {
      window.confirm = vi.fn(() => false);

      render(
        <SubscriptionExpandableCard
          subscription={mockSubscription}
          locale="en"
          onDelete={mockOnDelete}
        />
      );

      const netflixText = screen.getByText("Netflix");
      const card = (netflixText.closest("div[class*='rounded']") ||
        netflixText.parentElement) as HTMLElement;
      fireEvent.click(card);

      await waitFor(() => {
        expect(screen.getByText(/delete subscription/i)).toBeInTheDocument();
      });

      const deleteButton = screen.getByText(/delete subscription/i);
      fireEvent.click(deleteButton);

      // Card should still be expanded
      expect(screen.getByText(/original amount/i)).toBeInTheDocument();
    });
  });

  describe("Value Calculations", () => {
    it("should correctly calculate monthly value for MONTHLY billing", () => {
      render(
        <SubscriptionExpandableCard
          subscription={{ ...mockSubscription, billingCycle: "MONTHLY", amountCNY: 100 }}
          locale="en"
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText("¥100.00")).toBeInTheDocument(); // Monthly
      expect(screen.getByText("¥1,200.00")).toBeInTheDocument(); // Annual (100 * 12)
    });

    it("should correctly calculate monthly value for ANNUAL billing", () => {
      render(
        <SubscriptionExpandableCard
          subscription={{ ...mockSubscription, billingCycle: "ANNUAL", amountCNY: 1200 }}
          locale="en"
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText("¥100.00")).toBeInTheDocument(); // Monthly (1200 / 12)
      expect(screen.getByText("¥1,200.00")).toBeInTheDocument(); // Annual
    });

    it("should correctly calculate values for ONE_TIME billing", () => {
      render(
        <SubscriptionExpandableCard
          subscription={{ ...mockSubscription, billingCycle: "ONE_TIME", amountCNY: 120 }}
          locale="en"
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText("¥10.00")).toBeInTheDocument(); // Monthly (120 / 12)
      expect(screen.getByText("¥120.00")).toBeInTheDocument(); // Annual (one-time total)
    });
  });

  describe("Localization", () => {
    it("should display Chinese labels when locale is zh", () => {
      render(
        <SubscriptionExpandableCard
          subscription={mockSubscription}
          locale="zh"
          onDelete={mockOnDelete}
        />
      );

      const netflixText = screen.getByText("Netflix");
      const card = (netflixText.closest("div[class*='rounded']") ||
        netflixText.parentElement) as HTMLElement;
      fireEvent.click(card);

      expect(screen.getByText("月度视图")).toBeInTheDocument();
      expect(screen.getByText("年度视图")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have clickable card for keyboard navigation", () => {
      render(
        <SubscriptionExpandableCard
          subscription={mockSubscription}
          locale="en"
          onDelete={mockOnDelete}
        />
      );

      const netflixText = screen.getByText("Netflix");
      const card = (netflixText.closest("div[class*='rounded']") ||
        netflixText.parentElement) as HTMLElement;
      expect(card).toHaveClass(/cursor-pointer/);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { SubscriptionForm } from "../subscription-form";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

// Mock fetch API
global.fetch = vi.fn();

describe("SubscriptionForm", () => {
  const mockPush = vi.fn();
  const mockRefresh = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });
  });

  describe("Rendering", () => {
    it("should render new subscription form by default", () => {
      render(<SubscriptionForm locale="en" />);

      expect(screen.getByText("Add Subscription")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Netflix, GitHub, Adobe...")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    });

    it("should render edit subscription form with initial data", () => {
      const initialData = {
        id: "test-id",
        name: "Netflix",
        currency: "USD",
        amount: "15.99",
        billingCycle: "MONTHLY" as const,
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        notes: "Premium plan",
      };

      render(<SubscriptionForm locale="en" initialData={initialData} />);

      expect(screen.getByText("Edit Subscription")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Netflix")).toBeInTheDocument();
      expect(screen.getByDisplayValue("15.99")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Premium plan")).toBeInTheDocument();
    });

    it("should render Chinese labels when locale is zh", () => {
      render(<SubscriptionForm locale="zh" />);

      expect(screen.getByText("添加订阅")).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("should show error when required fields are missing", async () => {
      render(<SubscriptionForm locale="en" />);

      const submitButton = screen.getByRole("button", { name: /save changes/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/please complete all required fields/i)).toBeInTheDocument();
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should validate name field is required", async () => {
      render(<SubscriptionForm locale="en" />);

      const amountInput = screen.getByPlaceholderText("0.00");
      const startDateInput = screen.getByLabelText(/start date/i);
      const submitButton = screen.getByRole("button", { name: /save changes/i });

      fireEvent.change(amountInput, { target: { value: "10.00" } });
      fireEvent.change(startDateInput, { target: { value: "2024-01-01" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/please complete all required fields/i)).toBeInTheDocument();
      });
    });

    it("should validate amount field is required", async () => {
      render(<SubscriptionForm locale="en" />);

      const nameInput = screen.getByPlaceholderText("Netflix, GitHub, Adobe...");
      const startDateInput = screen.getByLabelText(/start date/i);
      const submitButton = screen.getByRole("button", { name: /save changes/i });

      fireEvent.change(nameInput, { target: { value: "Netflix" } });
      fireEvent.change(startDateInput, { target: { value: "2024-01-01" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/please complete all required fields/i)).toBeInTheDocument();
      });
    });

    it("should validate start date is required", async () => {
      render(<SubscriptionForm locale="en" />);

      const nameInput = screen.getByPlaceholderText("Netflix, GitHub, Adobe...");
      const amountInput = screen.getByPlaceholderText("0.00");
      const submitButton = screen.getByRole("button", { name: /save changes/i });

      fireEvent.change(nameInput, { target: { value: "Netflix" } });
      fireEvent.change(amountInput, { target: { value: "10.00" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/please complete all required fields/i)).toBeInTheDocument();
      });
    });
  });

  describe("Form Submission - Create", () => {
    it("should successfully create a new subscription", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ subscription: { id: "new-id" } }),
      });

      render(<SubscriptionForm locale="en" onSuccess={mockOnSuccess} />);

      const nameInput = screen.getByPlaceholderText("Netflix, GitHub, Adobe...");
      const amountInput = screen.getByPlaceholderText("0.00");
      const startDateInput = screen.getByLabelText(/start date/i);
      const submitButton = screen.getByRole("button", { name: /save changes/i });

      fireEvent.change(nameInput, { target: { value: "Netflix" } });
      fireEvent.change(amountInput, { target: { value: "15.99" } });
      fireEvent.change(startDateInput, { target: { value: "2024-01-01" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/subscriptions",
          expect.objectContaining({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: expect.stringContaining("Netflix"),
          })
        );
      });

      expect(mockPush).toHaveBeenCalledWith("/admin/subscriptions");
      expect(mockRefresh).toHaveBeenCalled();
      expect(mockOnSuccess).toHaveBeenCalled();
    });

    it("should send all form data including optional fields", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ subscription: { id: "new-id" } }),
      });

      render(<SubscriptionForm locale="en" />);

      fireEvent.change(screen.getByPlaceholderText("Netflix, GitHub, Adobe..."), {
        target: { value: "GitHub" },
      });
      fireEvent.change(screen.getByPlaceholderText("0.00"), { target: { value: "7.00" } });
      fireEvent.change(screen.getByLabelText(/start date/i), {
        target: { value: "2024-01-01" },
      });
      fireEvent.change(screen.getByLabelText(/end date/i), { target: { value: "2024-12-31" } });
      fireEvent.change(screen.getByPlaceholderText(/remarks/i), {
        target: { value: "Pro plan" },
      });

      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/subscriptions",
          expect.objectContaining({
            body: expect.stringMatching(/GitHub.*7.*2024-01-01.*2024-12-31.*Pro plan/s),
          })
        );
      });
    });
  });

  describe("Form Submission - Update", () => {
    it("should successfully update an existing subscription", async () => {
      const initialData = {
        id: "existing-id",
        name: "Netflix",
        currency: "USD",
        amount: "15.99",
        billingCycle: "MONTHLY" as const,
        startDate: "2024-01-01",
        endDate: "",
        notes: "",
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ subscription: { id: "existing-id" } }),
      });

      render(<SubscriptionForm locale="en" initialData={initialData} />);

      const nameInput = screen.getByDisplayValue("Netflix");
      fireEvent.change(nameInput, { target: { value: "Netflix Premium" } });

      const submitButton = screen.getByRole("button", { name: /save changes/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/subscriptions/existing-id",
          expect.objectContaining({
            method: "PUT",
            body: expect.stringContaining("Netflix Premium"),
          })
        );
      });

      expect(mockPush).toHaveBeenCalledWith("/admin/subscriptions");
    });
  });

  describe("Error Handling", () => {
    it("should display API error message", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Database connection failed" }),
      });

      render(<SubscriptionForm locale="en" />);

      fireEvent.change(screen.getByPlaceholderText("Netflix, GitHub, Adobe..."), {
        target: { value: "Netflix" },
      });
      fireEvent.change(screen.getByPlaceholderText("0.00"), { target: { value: "15.99" } });
      fireEvent.change(screen.getByLabelText(/start date/i), {
        target: { value: "2024-01-01" },
      });

      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(screen.getByText("Database connection failed")).toBeInTheDocument();
      });

      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should display generic error when API returns no error message", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      render(<SubscriptionForm locale="en" />);

      fireEvent.change(screen.getByPlaceholderText("Netflix, GitHub, Adobe..."), {
        target: { value: "Netflix" },
      });
      fireEvent.change(screen.getByPlaceholderText("0.00"), { target: { value: "15.99" } });
      fireEvent.change(screen.getByLabelText(/start date/i), {
        target: { value: "2024-01-01" },
      });

      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed to save subscription/i)).toBeInTheDocument();
      });
    });
  });

  describe("User Interactions", () => {
    it("should update form state when user types in name field", () => {
      render(<SubscriptionForm locale="en" />);

      const nameInput = screen.getByPlaceholderText("Netflix, GitHub, Adobe...");
      fireEvent.change(nameInput, { target: { value: "Spotify" } });

      expect(nameInput).toHaveValue("Spotify");
    });

    it("should update billing cycle when user selects option", () => {
      render(<SubscriptionForm locale="en" />);

      const billingCycleSelect = screen.getByLabelText(/billing cycle/i);
      fireEvent.change(billingCycleSelect, { target: { value: "ANNUAL" } });

      expect(billingCycleSelect).toHaveValue("ANNUAL");
    });

    it("should update currency when user selects option", () => {
      render(<SubscriptionForm locale="en" />);

      const currencySelect = screen.getByLabelText(/currency/i);
      fireEvent.change(currencySelect, { target: { value: "EUR" } });

      expect(currencySelect).toHaveValue("EUR");
    });

    it("should navigate back when cancel button is clicked", () => {
      render(<SubscriptionForm locale="en" />);

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockPush).toHaveBeenCalledWith("/admin/subscriptions");
    });

    it("should disable submit button while submitting", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ subscription: { id: "new-id" } }),
                }),
              100
            )
          )
      );

      render(<SubscriptionForm locale="en" />);

      fireEvent.change(screen.getByPlaceholderText("Netflix, GitHub, Adobe..."), {
        target: { value: "Netflix" },
      });
      fireEvent.change(screen.getByPlaceholderText("0.00"), { target: { value: "15.99" } });
      fireEvent.change(screen.getByLabelText(/start date/i), {
        target: { value: "2024-01-01" },
      });

      const submitButton = screen.getByRole("button", { name: /save changes/i });
      fireEvent.click(submitButton);

      // Button should be disabled during submission
      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper labels for all form fields", () => {
      render(<SubscriptionForm locale="en" />);

      expect(screen.getByLabelText(/subscription name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/billing cycle/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/currency/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/original amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
    });

    it("should mark required fields with required attribute", () => {
      render(<SubscriptionForm locale="en" />);

      const nameInput = screen.getByPlaceholderText("Netflix, GitHub, Adobe...");
      const amountInput = screen.getByPlaceholderText("0.00");
      const startDateInput = screen.getByLabelText(/start date/i);

      expect(nameInput).toBeRequired();
      expect(amountInput).toBeRequired();
      expect(startDateInput).toBeRequired();
    });
  });
});

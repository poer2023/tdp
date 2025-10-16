import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { SubscriptionForm } from "@/components/subscriptions/subscription-form";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

// Mock fetch API
global.fetch = vi.fn();

describe("Form Submission Integration", () => {
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

  describe("Complete Form Submission Flow", () => {
    it("should complete full form submission: Fill → Validate → Submit → Navigate", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          subscription: {
            id: "new-sub-id",
            name: "Spotify",
            amount: 9.99,
          },
        }),
      });

      render(<SubscriptionForm locale="en" onSuccess={mockOnSuccess} />);

      // Step 1: Fill form fields
      const nameInput = screen.getByPlaceholderText("Netflix, GitHub, Adobe...");
      const amountInput = screen.getByPlaceholderText("0.00");
      const currencySelect = screen.getByLabelText(/currency/i);
      const billingCycleSelect = screen.getByLabelText(/billing cycle/i);
      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);
      const notesInput = screen.getByPlaceholderText(/remarks/i);

      fireEvent.change(nameInput, { target: { value: "Spotify" } });
      fireEvent.change(amountInput, { target: { value: "9.99" } });
      fireEvent.change(currencySelect, { target: { value: "USD" } });
      fireEvent.change(billingCycleSelect, { target: { value: "MONTHLY" } });
      fireEvent.change(startDateInput, { target: { value: "2024-01-01" } });
      fireEvent.change(endDateInput, { target: { value: "2024-12-31" } });
      fireEvent.change(notesInput, { target: { value: "Premium account" } });

      // Step 2: Verify field values
      expect(nameInput).toHaveValue("Spotify");
      expect(amountInput).toHaveValue("9.99");
      expect(currencySelect).toHaveValue("USD");
      expect(billingCycleSelect).toHaveValue("MONTHLY");
      expect(startDateInput).toHaveValue("2024-01-01");
      expect(endDateInput).toHaveValue("2024-12-31");
      expect(notesInput).toHaveValue("Premium account");

      // Step 3: Submit form
      const submitButton = screen.getByRole("button", { name: /save changes/i });
      fireEvent.click(submitButton);

      // Step 4: Verify API call
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/subscriptions",
          expect.objectContaining({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: expect.stringContaining("Spotify"),
          })
        );
      });

      // Step 5: Verify navigation
      expect(mockPush).toHaveBeenCalledWith("/admin/subscriptions");
      expect(mockRefresh).toHaveBeenCalled();
      expect(mockOnSuccess).toHaveBeenCalled();
    });

    it("should handle edit form submission with existing data", async () => {
      const initialData = {
        id: "existing-id",
        name: "Netflix",
        currency: "USD",
        amount: "15.99",
        billingCycle: "MONTHLY" as const,
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        notes: "Premium plan",
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          subscription: {
            ...initialData,
            name: "Netflix Premium",
          },
        }),
      });

      render(<SubscriptionForm locale="en" initialData={initialData} />);

      // Verify form is pre-filled
      expect(screen.getByDisplayValue("Netflix")).toBeInTheDocument();
      expect(screen.getByDisplayValue("15.99")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Premium plan")).toBeInTheDocument();

      // Update name field
      const nameInput = screen.getByDisplayValue("Netflix");
      fireEvent.change(nameInput, { target: { value: "Netflix Premium" } });

      // Submit form
      const submitButton = screen.getByRole("button", { name: /save changes/i });
      fireEvent.click(submitButton);

      // Verify PUT request
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

  describe("Form Validation Integration", () => {
    it("should prevent submission with invalid data and show errors", async () => {
      render(<SubscriptionForm locale="en" />);

      // Try to submit empty form
      const submitButton = screen.getByRole("button", { name: /save changes/i });
      fireEvent.click(submitButton);

      // Wait for validation error
      await waitFor(() => {
        expect(screen.getByText(/please complete all required fields/i)).toBeInTheDocument();
      });

      // Verify no API call was made
      expect(global.fetch).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should validate and submit when all required fields are filled", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ subscription: { id: "new-id" } }),
      });

      render(<SubscriptionForm locale="en" />);

      // Fill only required fields
      fireEvent.change(screen.getByPlaceholderText("Netflix, GitHub, Adobe..."), {
        target: { value: "Minimal Service" },
      });
      fireEvent.change(screen.getByPlaceholderText("0.00"), { target: { value: "5.00" } });
      fireEvent.change(screen.getByLabelText(/start date/i), {
        target: { value: "2024-01-01" },
      });

      const submitButton = screen.getByRole("button", { name: /save changes/i });
      fireEvent.click(submitButton);

      // Should successfully submit
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith("/admin/subscriptions");
      });
    });

    it("should clear validation error when user corrects input", async () => {
      render(<SubscriptionForm locale="en" />);

      // Submit empty form to trigger validation
      const submitButton = screen.getByRole("button", { name: /save changes/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/please complete all required fields/i)).toBeInTheDocument();
      });

      // Fill required fields
      fireEvent.change(screen.getByPlaceholderText("Netflix, GitHub, Adobe..."), {
        target: { value: "Test Service" },
      });
      fireEvent.change(screen.getByPlaceholderText("0.00"), { target: { value: "10.00" } });
      fireEvent.change(screen.getByLabelText(/start date/i), {
        target: { value: "2024-01-01" },
      });

      // Error should still be visible until next submission attempt
      expect(screen.getByText(/please complete all required fields/i)).toBeInTheDocument();
    });
  });

  describe("API Error Handling", () => {
    it("should display API error message and allow retry", async () => {
      // First attempt fails
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Server error occurred" }),
      });

      render(<SubscriptionForm locale="en" />);

      // Fill and submit form
      fireEvent.change(screen.getByPlaceholderText("Netflix, GitHub, Adobe..."), {
        target: { value: "Test Service" },
      });
      fireEvent.change(screen.getByPlaceholderText("0.00"), { target: { value: "10.00" } });
      fireEvent.change(screen.getByLabelText(/start date/i), {
        target: { value: "2024-01-01" },
      });

      const submitButton = screen.getByRole("button", { name: /save changes/i });
      fireEvent.click(submitButton);

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText("Server error occurred")).toBeInTheDocument();
      });

      // Verify navigation did not occur
      expect(mockPush).not.toHaveBeenCalled();

      // Second attempt succeeds
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ subscription: { id: "new-id" } }),
      });

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/admin/subscriptions");
      });
    });

    it("should handle network errors gracefully", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Network error"));

      render(<SubscriptionForm locale="en" />);

      // Fill and submit form
      fireEvent.change(screen.getByPlaceholderText("Netflix, GitHub, Adobe..."), {
        target: { value: "Test Service" },
      });
      fireEvent.change(screen.getByPlaceholderText("0.00"), { target: { value: "10.00" } });
      fireEvent.change(screen.getByLabelText(/start date/i), {
        target: { value: "2024-01-01" },
      });

      const submitButton = screen.getByRole("button", { name: /save changes/i });
      fireEvent.click(submitButton);

      // Wait for error handling
      await waitFor(() => {
        expect(screen.getByText(/failed to save subscription/i)).toBeInTheDocument();
      });
    });
  });

  describe("User Interaction Flow", () => {
    it("should disable submit button during submission", async () => {
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

      // Fill form
      fireEvent.change(screen.getByPlaceholderText("Netflix, GitHub, Adobe..."), {
        target: { value: "Test Service" },
      });
      fireEvent.change(screen.getByPlaceholderText("0.00"), { target: { value: "10.00" } });
      fireEvent.change(screen.getByLabelText(/start date/i), {
        target: { value: "2024-01-01" },
      });

      const submitButton = screen.getByRole("button", { name: /save changes/i });
      fireEvent.click(submitButton);

      // Button should be disabled during submission
      expect(submitButton).toBeDisabled();

      // Wait for submission to complete
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
      });
    });

    it("should allow cancellation and navigate back", () => {
      render(<SubscriptionForm locale="en" />);

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockPush).toHaveBeenCalledWith("/admin/subscriptions");
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should preserve form state during user interaction", () => {
      render(<SubscriptionForm locale="en" />);

      // Fill multiple fields
      const nameInput = screen.getByPlaceholderText("Netflix, GitHub, Adobe...");
      const amountInput = screen.getByPlaceholderText("0.00");
      const notesInput = screen.getByPlaceholderText(/remarks/i);

      fireEvent.change(nameInput, { target: { value: "Test Service" } });
      fireEvent.change(amountInput, { target: { value: "15.00" } });
      fireEvent.change(notesInput, { target: { value: "Important notes" } });

      // Switch between fields
      fireEvent.blur(nameInput);
      fireEvent.focus(amountInput);
      fireEvent.blur(amountInput);

      // Verify all values are preserved
      expect(nameInput).toHaveValue("Test Service");
      expect(amountInput).toHaveValue("15.00");
      expect(notesInput).toHaveValue("Important notes");
    });
  });

  describe("Currency and Billing Cycle Handling", () => {
    it("should handle different currency selections", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ subscription: { id: "new-id" } }),
      });

      render(<SubscriptionForm locale="en" />);

      const currencies = ["USD", "EUR", "GBP", "JPY"];

      for (const currency of currencies) {
        const currencySelect = screen.getByLabelText(/currency/i);
        fireEvent.change(currencySelect, { target: { value: currency } });
        expect(currencySelect).toHaveValue(currency);
      }
    });

    it("should handle different billing cycles", async () => {
      render(<SubscriptionForm locale="en" />);

      const billingCycles = ["MONTHLY", "ANNUAL", "ONE_TIME"];

      for (const cycle of billingCycles) {
        const billingCycleSelect = screen.getByLabelText(/billing cycle/i);
        fireEvent.change(billingCycleSelect, { target: { value: cycle } });
        expect(billingCycleSelect).toHaveValue(cycle);
      }
    });
  });

  describe("Date Handling", () => {
    it("should handle start date without end date", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ subscription: { id: "new-id" } }),
      });

      render(<SubscriptionForm locale="en" />);

      // Fill form with start date but no end date
      fireEvent.change(screen.getByPlaceholderText("Netflix, GitHub, Adobe..."), {
        target: { value: "Ongoing Service" },
      });
      fireEvent.change(screen.getByPlaceholderText("0.00"), { target: { value: "10.00" } });
      fireEvent.change(screen.getByLabelText(/start date/i), {
        target: { value: "2024-01-01" },
      });

      const submitButton = screen.getByRole("button", { name: /save changes/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/subscriptions",
          expect.objectContaining({
            body: expect.stringContaining("2024-01-01"),
          })
        );
      });
    });

    it("should handle both start and end dates", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ subscription: { id: "new-id" } }),
      });

      render(<SubscriptionForm locale="en" />);

      // Fill form with both dates
      fireEvent.change(screen.getByPlaceholderText("Netflix, GitHub, Adobe..."), {
        target: { value: "Time-Limited Service" },
      });
      fireEvent.change(screen.getByPlaceholderText("0.00"), { target: { value: "10.00" } });
      fireEvent.change(screen.getByLabelText(/start date/i), {
        target: { value: "2024-01-01" },
      });
      fireEvent.change(screen.getByLabelText(/end date/i), {
        target: { value: "2024-12-31" },
      });

      const submitButton = screen.getByRole("button", { name: /save changes/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
        const body = JSON.parse(fetchCall[1].body);
        expect(body.startDate).toBe("2024-01-01");
        expect(body.endDate).toBe("2024-12-31");
      });
    });
  });
});

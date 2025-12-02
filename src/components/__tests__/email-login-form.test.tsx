import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { EmailLoginForm } from "../email-login-form";

const { replaceMock, refreshMock, signInMock } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  refreshMock: vi.fn(),
  signInMock: vi.fn(),
}));
const mockFetch = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
    refresh: refreshMock,
  }),
}));

vi.mock("next-auth/react", () => ({
  signIn: signInMock,
}));

const mockedFetch = mockFetch as unknown as typeof fetch;

function createFetchResponse(data: unknown, ok = true, status = ok ? 200 : 400) {
  return {
    ok,
    status,
    json: vi.fn(async () => data),
  } as unknown as Response;
}

describe("EmailLoginForm", () => {
  beforeEach(() => {
    replaceMock.mockReset();
    refreshMock.mockReset();
    signInMock.mockReset();
    mockFetch.mockReset();
    (globalThis as unknown as { fetch: typeof fetch }).fetch = mockedFetch;
  });

  it("sends verification code and switches to code step on success", async () => {
    mockFetch.mockResolvedValueOnce(createFetchResponse({ ok: true }));

    render(<EmailLoginForm callbackUrl="/admin" />);

    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "test@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Send verification code" }));

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/auth/email/send",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "test@example.com", callbackUrl: "/admin" }),
      })
    );

    await screen.findByLabelText("Verification code");
    expect(screen.getByText("Verification code sent. Please check your inbox.")).toBeInTheDocument();
  });

  it("shows error message when sending verification code fails", async () => {
    mockFetch.mockResolvedValueOnce(createFetchResponse({ error: "自定义错误" }, false, 429));

    render(<EmailLoginForm callbackUrl="/admin" />);

    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "test@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Send verification code" }));

    await screen.findByText("自定义错误");
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("verifies code and redirects on success", async () => {
    mockFetch.mockResolvedValueOnce(createFetchResponse({ ok: true }));
    signInMock.mockResolvedValueOnce({
      error: undefined,
      ok: true,
      status: 200,
      url: "/admin/dashboard",
    });

    render(<EmailLoginForm callbackUrl="/admin/dashboard" />);

    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "test@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Send verification code" }));
    await screen.findByLabelText("Verification code");

    fireEvent.change(screen.getByLabelText("Verification code"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Verify and sign in" }));

    await waitFor(() => expect(signInMock).toHaveBeenCalled());

    expect(signInMock).toHaveBeenCalledWith("email", {
      email: "test@example.com",
      token: "123456",
      redirect: false,
      callbackUrl: "/admin/dashboard",
    });
    expect(replaceMock).toHaveBeenCalledWith("/admin/dashboard");
    expect(refreshMock).toHaveBeenCalled();
    expect(screen.getByText("Success! Redirecting...")).toBeInTheDocument();
  });

  it("shows error when verification fails", async () => {
    mockFetch.mockResolvedValueOnce(createFetchResponse({ ok: true }));
    signInMock.mockResolvedValueOnce({
      error: "Invalid token",
      ok: false,
      status: 401,
      url: null,
    });

    render(<EmailLoginForm callbackUrl="/admin" />);

    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "test@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Send verification code" }));
    await screen.findByLabelText("Verification code");

    fireEvent.change(screen.getByLabelText("Verification code"), { target: { value: "654321" } });
    fireEvent.click(screen.getByRole("button", { name: "Verify and sign in" }));

    await screen.findByText("Invalid or expired code. Please try again.");
    expect(replaceMock).not.toHaveBeenCalled();
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LikeButton } from "../like-button";

// Mock fetch
global.fetch = vi.fn();

describe("LikeButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render like button with initial count", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ likeCount: 5 }),
    } as Response);

    render(<LikeButton slug="test-post" locale="EN" />);

    await waitFor(() => {
      expect(screen.getByText("5")).toBeInTheDocument();
    });
  });

  it("should fetch initial like count on mount", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ likeCount: 10 }),
    } as Response);

    render(<LikeButton slug="test-post" locale="EN" />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/posts/test-post/reactions?locale=EN");
    });
  });

  it("should use default EN locale when not specified", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ likeCount: 0 }),
    } as Response);

    render(<LikeButton slug="test-post" />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/posts/test-post/reactions?locale=EN");
    });
  });

  it("should increment like count on successful like", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ likeCount: 5 }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ likeCount: 6 }),
      } as Response);

    render(<LikeButton slug="test-post" locale="EN" />);

    await waitFor(() => {
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("6")).toBeInTheDocument();
    });
  });

  it("should disable button after like", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ likeCount: 5 }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ likeCount: 6 }),
      } as Response);

    render(<LikeButton slug="test-post" locale="EN" />);

    await waitFor(() => {
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toBeDisabled();
    });
  });

  it("should show 'Liked' text after successful like", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ likeCount: 5 }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ likeCount: 6 }),
      } as Response);

    render(<LikeButton slug="test-post" locale="EN" />);

    await waitFor(() => {
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Liked")).toBeInTheDocument();
    });
  });

  it("should send POST request with correct locale", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ likeCount: 0 }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ likeCount: 1 }),
      } as Response);

    render(<LikeButton slug="chinese-post" locale="ZH" />);

    await waitFor(() => {
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/posts/chinese-post/like",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale: "ZH" }),
        })
      );
    });
  });

  it("should show alert on rate limit error", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ likeCount: 5 }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
      } as Response);

    render(<LikeButton slug="test-post" locale="EN" />);

    await waitFor(() => {
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Rate limit exceeded. Please try again later.");
    });

    alertSpy.mockRestore();
  });

  it("should handle fetch error gracefully", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));

    render(<LikeButton slug="test-post" locale="EN" />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });

  it("should handle like error gracefully", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ likeCount: 5 }),
      } as Response)
      .mockRejectedValueOnce(new Error("Failed to like"));

    render(<LikeButton slug="test-post" locale="EN" />);

    await waitFor(() => {
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to like post:", expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });

  it("should prevent multiple clicks while loading", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ likeCount: 5 }),
      } as Response)
      .mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ likeCount: 6 }),
                } as Response),
              100
            )
          )
      );

    render(<LikeButton slug="test-post" locale="EN" />);

    await waitFor(() => {
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    const button = screen.getByRole("button");

    // Click multiple times
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    // Should only call POST once
    await waitFor(() => {
      const postCalls = vi.mocked(fetch).mock.calls.filter((call) => call[1]?.method === "POST");
      expect(postCalls).toHaveLength(1);
    });
  });

  it("should show loading cursor while processing", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ likeCount: 5 }),
      } as Response)
      .mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ likeCount: 6 }),
                } as Response),
              50
            )
          )
      );

    render(<LikeButton slug="test-post" locale="EN" />);

    await waitFor(() => {
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    const button = screen.getByRole("button");
    fireEvent.click(button);

    // Check for loading class
    expect(button).toHaveClass("cursor-wait");
  });

  it("should apply liked styling after like", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ likeCount: 5 }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ likeCount: 6 }),
      } as Response);

    render(<LikeButton slug="test-post" locale="EN" />);

    await waitFor(() => {
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toHaveClass("border-red-300", "bg-red-50", "text-red-600");
    });
  });

  it("should render heart icon", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ likeCount: 0 }),
    } as Response);

    const { container } = render(<LikeButton slug="test-post" locale="EN" />);

    await waitFor(() => {
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });

  it("should fill heart icon after like", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ likeCount: 5 }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ likeCount: 6 }),
      } as Response);

    const { container } = render(<LikeButton slug="test-post" locale="EN" />);

    await waitFor(() => {
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("fill", "currentColor");
    });
  });
});

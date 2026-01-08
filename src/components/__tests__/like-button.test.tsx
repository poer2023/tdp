import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LikeButton } from "../shared/like-button";

// Mock fetch
global.fetch = vi.fn();

describe("LikeButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render like button with initial count", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ likeCount: 5, alreadyLiked: false }),
    } as Response);

    render(<LikeButton slug="test-post" locale="EN" />);

    await waitFor(() => {
      expect(screen.getByText("5")).toBeInTheDocument();
    });
  });

  it("should fetch initial like count on mount", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ likeCount: 10, alreadyLiked: false }),
    } as Response);

    render(<LikeButton slug="test-post" locale="EN" />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/posts/test-post/reactions?locale=EN");
    });
  });

  it("should use default EN locale when not specified", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ likeCount: 0, alreadyLiked: false }),
    } as Response);

    render(<LikeButton slug="test-post" />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/posts/test-post/reactions?locale=EN");
    });
  });

  it("should show optimistic update immediately on click", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ likeCount: 5, alreadyLiked: false }),
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
    fireEvent.click(button);

    // Should show optimistic update immediately (before server responds)
    await waitFor(() => {
      expect(screen.getByText("6")).toBeInTheDocument();
    });
  });

  it("should increment like count on successful like", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ likeCount: 5, alreadyLiked: false }),
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
        json: async () => ({ likeCount: 5, alreadyLiked: false }),
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
        json: async () => ({ likeCount: 5, alreadyLiked: false }),
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

  it("should show 'Saving...' text while pending", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ likeCount: 5, alreadyLiked: false }),
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
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Saving...")).toBeInTheDocument();
    });
  });

  it("should send POST request with correct locale", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ likeCount: 0, alreadyLiked: false }),
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

  it("should show error message on rate limit error", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ likeCount: 5, alreadyLiked: false }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ error: "Rate limit exceeded" }),
      } as Response);

    render(<LikeButton slug="test-post" locale="EN" />);

    await waitFor(() => {
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Rate limit exceeded/i)).toBeInTheDocument();
    });
  });

  it("should show error message on 404 error", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ likeCount: 5, alreadyLiked: false }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: "Post not found" }),
      } as Response);

    render(<LikeButton slug="test-post" locale="EN" />);

    await waitFor(() => {
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Post not found")).toBeInTheDocument();
    });
  });

  it("should rollback optimistic update on error", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ likeCount: 5, alreadyLiked: false }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: "Server error" }),
      } as Response);

    render(<LikeButton slug="test-post" locale="EN" />);

    await waitFor(() => {
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    const button = screen.getByRole("button");
    fireEvent.click(button);

    // Should show optimistic update first (6)
    await waitFor(() => {
      expect(screen.getByText("6")).toBeInTheDocument();
    });

    // Should rollback to 5 after error
    await waitFor(() => {
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
    expect(screen.queryByText("Liked")).not.toBeInTheDocument();
  });

  it("should handle fetch error gracefully", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => { });

    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));

    render(<LikeButton slug="test-post" locale="EN" />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(screen.getByText("Failed to load likes")).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  it("should handle like error gracefully", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => { });

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ likeCount: 5, alreadyLiked: false }),
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
      expect(screen.getByText("Failed to like")).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  it("should prevent multiple clicks with debounce", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ likeCount: 5, alreadyLiked: false }),
      } as Response)
      .mockResolvedValue({
        ok: true,
        json: async () => ({ likeCount: 6 }),
      } as Response);

    render(<LikeButton slug="test-post" locale="EN" />);

    await waitFor(() => {
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    const button = screen.getByRole("button");

    // Click multiple times rapidly
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    // Should only call POST once (debounced)
    await waitFor(() => {
      const postCalls = vi.mocked(fetch).mock.calls.filter((call) => call[1]?.method === "POST");
      expect(postCalls).toHaveLength(1);
    });
  });

  it("should show loading cursor while processing", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ likeCount: 5, alreadyLiked: false }),
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
    await waitFor(() => {
      expect(button).toHaveClass("cursor-wait");
    });
  });

  it("should apply liked styling after like", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ likeCount: 5, alreadyLiked: false }),
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
      json: async () => ({ likeCount: 0, alreadyLiked: false }),
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
        json: async () => ({ likeCount: 5, alreadyLiked: false }),
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

  it("should disable button if already liked on initial load", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ likeCount: 10, alreadyLiked: true }),
    } as Response);

    render(<LikeButton slug="test-post" locale="EN" />);

    await waitFor(() => {
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(screen.getByText("Liked")).toBeInTheDocument();
    });
  });

  it("should have proper accessibility attributes", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ likeCount: 5, alreadyLiked: false }),
    } as Response);

    render(<LikeButton slug="test-post" locale="EN" />);

    await waitFor(() => {
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", "Like this post");
      expect(button).toHaveAttribute("aria-live", "polite");
    });
  });

  it("should auto-clear error after 3 seconds", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ likeCount: 5, alreadyLiked: false }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: "Server error" }),
      } as Response);

    render(<LikeButton slug="test-post" locale="EN" />);

    await waitFor(() => {
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    await waitFor(
      () => {
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      },
      { timeout: 3500 }
    );
  });

  it("should handle non-JSON error response with status code", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ likeCount: 5, alreadyLiked: false }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => {
          throw new Error("Not JSON");
        },
      } as Response);

    render(<LikeButton slug="test-post" locale="EN" />);

    await waitFor(() => {
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Server error (503)")).toBeInTheDocument();
    });
  });

  it("should handle non-JSON 429 error response", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ likeCount: 5, alreadyLiked: false }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => {
          throw new Error("Not JSON");
        },
      } as Response);

    render(<LikeButton slug="test-post" locale="EN" />);

    await waitFor(() => {
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Too many requests/i)).toBeInTheDocument();
    });
  });

  it("should handle non-JSON 404 error response", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ likeCount: 5, alreadyLiked: false }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => {
          throw new Error("Not JSON");
        },
      } as Response);

    render(<LikeButton slug="test-post" locale="EN" />);

    await waitFor(() => {
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Post not found")).toBeInTheDocument();
    });
  });
});

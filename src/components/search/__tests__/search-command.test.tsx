/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { SearchCommand } from "../search-command";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/en"),
}));

// Mock fetch
global.fetch = vi.fn() as any;

describe("SearchCommand", () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset usePathname to default "/en"
    const { usePathname } = await import("next/navigation");
    vi.mocked(usePathname).mockReturnValue("/en");

    vi.useFakeTimers();
    (global.fetch as vi.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ posts: [], images: [], moments: [] }),
    });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe("渲染和可见性", () => {
    it("关闭时不应该渲染", () => {
      const { container } = render(<SearchCommand open={false} onOpenChange={vi.fn()} />);
      expect(container.firstChild).toBeNull();
    });

    it("打开时应该渲染搜索界面", () => {
      render(<SearchCommand open={true} onOpenChange={vi.fn()} />);
      expect(screen.getByPlaceholderText(/search posts, images, moments/i)).toBeInTheDocument();
    });

    it("中文环境应该显示中文提示", async () => {
      const { usePathname } = await import("next/navigation");
      vi.mocked(usePathname).mockReturnValue("/zh");

      render(<SearchCommand open={true} onOpenChange={vi.fn()} />);
      expect(screen.getByPlaceholderText("搜索文章、图片、动态...")).toBeInTheDocument();
    });
  });

  describe("搜索输入和防抖", () => {
    it("应该接受用户输入", () => {
      render(<SearchCommand open={true} onOpenChange={vi.fn()} />);

      const input = screen.getByPlaceholderText(/search posts, images, moments/i);
      fireEvent.change(input, { target: { value: "test query" } });

      expect(input).toHaveValue("test query");
    });

    it("应该在 150ms 后触发快速搜索", async () => {
      render(<SearchCommand open={true} onOpenChange={vi.fn()} />);

      const input = screen.getByPlaceholderText(/search posts, images, moments/i);
      fireEvent.change(input, { target: { value: "test" } });

      // Before debounce
      expect(global.fetch).not.toHaveBeenCalled();

      // After quick search delay (150ms)
      await vi.runAllTimersAsync();

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/search?q=test&mode=quick")
        );
      });
    });

    it("应该在 250ms 后触发完整搜索", async () => {
      render(<SearchCommand open={true} onOpenChange={vi.fn()} />);

      const input = screen.getByPlaceholderText(/search posts, images, moments/i);
      fireEvent.change(input, { target: { value: "test" } });

      await vi.runAllTimersAsync();

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/search?q=test&mode=full")
        );
      });
    });

    it("快速输入应该取消之前的搜索", async () => {
      render(<SearchCommand open={true} onOpenChange={vi.fn()} />);

      const input = screen.getByPlaceholderText(/search posts, images, moments/i);

      // First input
      fireEvent.change(input, { target: { value: "te" } });
      await vi.runAllTimersAsync();

      // Second input before first search completes
      fireEvent.change(input, { target: { value: "test" } });
      await vi.runAllTimersAsync();

      // Should only search for "test", not "te"
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/search?q=test&mode=quick")
        );
        expect(global.fetch).not.toHaveBeenCalledWith(
          expect.stringContaining("/api/search?q=te&mode=quick")
        );
      });
    });

    it("空查询应该清空结果", async () => {
      render(<SearchCommand open={true} onOpenChange={vi.fn()} />);

      const input = screen.getByPlaceholderText(/search posts, images, moments/i);
      fireEvent.change(input, { target: { value: "" } });

      await vi.runAllTimersAsync();

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("搜索结果显示", () => {
    it("应该显示文章结果", async () => {
      const mockPosts = [
        {
          id: "1",
          title: "Test Post",
          slug: "test-post",
          excerpt: "Test excerpt",
          publishedAt: new Date().toISOString(),
          locale: "EN",
          authorName: "John Doe",
        },
      ];

      (global.fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ posts: mockPosts, images: [], moments: [] }),
      });

      render(<SearchCommand open={true} onOpenChange={vi.fn()} />);

      const input = screen.getByPlaceholderText(/search posts, images, moments/i);
      fireEvent.change(input, { target: { value: "test" } });

      await vi.runAllTimersAsync();

      await waitFor(() => {
        expect(screen.getByText("Test Post")).toBeInTheDocument();
        expect(screen.getByText("Test excerpt")).toBeInTheDocument();
      });
    });

    it("应该显示图片结果", async () => {
      const mockImages = [
        {
          id: "1",
          title: "Test Image",
          description: null,
          microThumbPath: "/thumb.webp",
          smallThumbPath: null,
          locationName: "Tokyo",
          city: "Tokyo",
          country: "Japan",
          category: "ORIGINAL",
          createdAt: new Date().toISOString(),
        },
      ];

      (global.fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ posts: [], images: mockImages, moments: [] }),
      });

      render(<SearchCommand open={true} onOpenChange={vi.fn()} />);

      const input = screen.getByPlaceholderText(/search posts, images, moments/i);
      fireEvent.change(input, { target: { value: "tokyo" } });

      await vi.runAllTimersAsync();

      await waitFor(() => {
        expect(screen.getByText("Tokyo")).toBeInTheDocument();
      });
    });

    it("应该显示动态结果", async () => {
      const mockMoments = [
        {
          id: "1",
          slug: "moment-1",
          content: "Test moment content",
          tags: ["test", "moment"],
          createdAt: new Date().toISOString(),
          lang: "en-US",
        },
      ];

      (global.fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ posts: [], images: [], moments: mockMoments }),
      });

      render(<SearchCommand open={true} onOpenChange={vi.fn()} />);

      const input = screen.getByPlaceholderText(/search posts, images, moments/i);
      fireEvent.change(input, { target: { value: "moment" } });

      await vi.runAllTimersAsync();

      await waitFor(() => {
        expect(screen.getByText(/Test moment content/i)).toBeInTheDocument();
      });
    });

    it("无结果时应该显示空状态", async () => {
      (global.fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ posts: [], images: [], moments: [] }),
      });

      render(<SearchCommand open={true} onOpenChange={vi.fn()} />);

      const input = screen.getByPlaceholderText(/search posts, images, moments/i);
      fireEvent.change(input, { target: { value: "nonexistent" } });

      await vi.runAllTimersAsync();

      await waitFor(() => {
        expect(screen.getByText(/no results found/i)).toBeInTheDocument();
      });
    });
  });

  describe("标签切换", () => {
    it("应该显示所有类型的标签", async () => {
      const mockData = {
        posts: [
          {
            id: "1",
            title: "Post",
            slug: "post",
            excerpt: "excerpt",
            publishedAt: new Date().toISOString(),
            locale: "EN",
            authorName: "John",
          },
        ],
        images: [
          {
            id: "1",
            title: "Image",
            description: null,
            microThumbPath: "/thumb.webp",
            smallThumbPath: null,
            locationName: null,
            city: null,
            country: null,
            category: "ORIGINAL",
            createdAt: new Date().toISOString(),
          },
        ],
        moments: [
          {
            id: "1",
            slug: null,
            content: "Moment",
            tags: [],
            createdAt: new Date().toISOString(),
            lang: "en-US",
          },
        ],
      };

      (global.fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      render(<SearchCommand open={true} onOpenChange={vi.fn()} />);

      const input = screen.getByPlaceholderText(/search posts, images, moments/i);
      fireEvent.change(input, { target: { value: "test" } });

      await vi.runAllTimersAsync();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /all.*3/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /posts.*1/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /images.*1/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /moments.*1/i })).toBeInTheDocument();
      });
    });

    it("点击标签应该筛选结果", async () => {
      const mockData = {
        posts: [
          {
            id: "1",
            title: "Post",
            slug: "post",
            excerpt: "excerpt",
            publishedAt: new Date().toISOString(),
            locale: "EN",
            authorName: "John",
          },
        ],
        images: [
          {
            id: "1",
            title: "Image",
            description: null,
            microThumbPath: "/thumb.webp",
            smallThumbPath: null,
            locationName: null,
            city: null,
            country: null,
            category: "ORIGINAL",
            createdAt: new Date().toISOString(),
          },
        ],
        moments: [],
      };

      (global.fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      render(<SearchCommand open={true} onOpenChange={vi.fn()} />);

      const input = screen.getByPlaceholderText(/search posts, images, moments/i);
      fireEvent.change(input, { target: { value: "test" } });

      await vi.runAllTimersAsync();

      await waitFor(() => {
        expect(screen.getByText("Post")).toBeInTheDocument();
      });

      // Click on "Posts" tab
      const postsTab = screen.getByRole("button", { name: /posts.*1/i });
      fireEvent.click(postsTab);

      // Should show posts section, but not images section
      expect(screen.getByText("Post")).toBeInTheDocument();
      expect(screen.queryByText("Image")).not.toBeInTheDocument();
    });
  });

  describe("键盘导航", () => {
    it("Cmd+K 应该打开/关闭搜索", () => {
      const onOpenChange = vi.fn();
      render(<SearchCommand open={false} onOpenChange={onOpenChange} />);

      fireEvent.keyDown(document, { key: "k", metaKey: true });

      expect(onOpenChange).toHaveBeenCalledWith(true);
    });

    it("Ctrl+K 应该打开/关闭搜索", () => {
      const onOpenChange = vi.fn();
      render(<SearchCommand open={false} onOpenChange={onOpenChange} />);

      fireEvent.keyDown(document, { key: "k", ctrlKey: true });

      expect(onOpenChange).toHaveBeenCalledWith(true);
    });

    it("Esc 应该关闭搜索", () => {
      const onOpenChange = vi.fn();
      render(<SearchCommand open={true} onOpenChange={onOpenChange} />);

      fireEvent.keyDown(document, { key: "Escape" });

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("交互行为", () => {
    it("点击背景应该关闭搜索", () => {
      const onOpenChange = vi.fn();
      const { container } = render(<SearchCommand open={true} onOpenChange={onOpenChange} />);

      const backdrop = container.firstChild as HTMLElement;
      fireEvent.click(backdrop);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("点击搜索框内部不应该关闭", () => {
      const onOpenChange = vi.fn();
      render(<SearchCommand open={true} onOpenChange={onOpenChange} />);

      const input = screen.getByPlaceholderText(/search posts, images, moments/i);
      fireEvent.click(input);

      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it("关闭时应该重置状态", () => {
      const { rerender } = render(<SearchCommand open={true} onOpenChange={vi.fn()} />);

      const input = screen.getByPlaceholderText(/search posts, images, moments/i);
      fireEvent.change(input, { target: { value: "test" } });

      expect(input).toHaveValue("test");

      // Close
      rerender(<SearchCommand open={false} onOpenChange={vi.fn()} />);

      // Reopen
      rerender(<SearchCommand open={true} onOpenChange={vi.fn()} />);

      const newInput = screen.getByPlaceholderText(/search posts, images, moments/i);
      expect(newInput).toHaveValue("");
    });
  });

  describe("加载状态", () => {
    it("搜索时应该显示加载指示器", () => {
      render(<SearchCommand open={true} onOpenChange={vi.fn()} />);

      const input = screen.getByPlaceholderText(/search posts, images, moments/i);
      fireEvent.change(input, { target: { value: "test" } });

      // Loading indicator should appear
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("搜索完成后应该隐藏加载指示器", async () => {
      (global.fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ posts: [], images: [], moments: [] }),
      });

      render(<SearchCommand open={true} onOpenChange={vi.fn()} />);

      const input = screen.getByPlaceholderText(/search posts, images, moments/i);
      fireEvent.change(input, { target: { value: "test" } });

      await vi.runAllTimersAsync();

      await waitFor(() => {
        expect(screen.queryByRole("status")).not.toBeInTheDocument();
      });
    });
  });

  describe("错误处理", () => {
    it("搜索失败应该处理错误", async () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation();

      (global.fetch as vi.Mock).mockRejectedValueOnce(new Error("Network error"));

      render(<SearchCommand open={true} onOpenChange={vi.fn()} />);

      const input = screen.getByPlaceholderText(/search posts, images, moments/i);
      fireEvent.change(input, { target: { value: "test" } });

      await vi.runAllTimersAsync();

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          expect.stringContaining("Full search error"),
          expect.any(Error)
        );
      });

      consoleError.mockRestore();
    });

    it("API 返回错误应该处理", async () => {
      (global.fetch as vi.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Server error" }),
      });

      render(<SearchCommand open={true} onOpenChange={vi.fn()} />);

      const input = screen.getByPlaceholderText(/search posts, images, moments/i);
      fireEvent.change(input, { target: { value: "test" } });

      await vi.runAllTimersAsync();

      await waitFor(() => {
        expect(screen.getByText(/no results found/i)).toBeInTheDocument();
      });
    });
  });

  describe("可访问性", () => {
    it("应该有正确的 ARIA 属性", () => {
      render(<SearchCommand open={true} onOpenChange={vi.fn()} />);

      const input = screen.getByPlaceholderText(/search posts, images, moments/i);
      expect(input).toHaveAttribute("type", "text");
    });

    it("搜索框应该自动获得焦点", () => {
      render(<SearchCommand open={true} onOpenChange={vi.fn()} />);

      const input = screen.getByPlaceholderText(/search posts, images, moments/i);
      expect(document.activeElement).toBe(input);
    });
  });

  describe("国际化", () => {
    it("中文环境应该显示中文文本", async () => {
      const { usePathname } = await import("next/navigation");
      vi.mocked(usePathname).mockReturnValue("/zh");

      render(<SearchCommand open={true} onOpenChange={vi.fn()} />);

      expect(screen.getByText("导航")).toBeInTheDocument();
      expect(screen.getByText("选择")).toBeInTheDocument();
      expect(screen.getByText("关闭")).toBeInTheDocument();
    });

    it("英文环境应该显示英文文本", async () => {
      const { usePathname } = await import("next/navigation");
      vi.mocked(usePathname).mockReturnValue("/en");

      render(<SearchCommand open={true} onOpenChange={vi.fn()} />);

      expect(screen.getByText("Navigate")).toBeInTheDocument();
      expect(screen.getByText("Select")).toBeInTheDocument();
      expect(screen.getByText("Close")).toBeInTheDocument();
    });
  });
});

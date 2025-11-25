import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { LanguageSwitcher } from "../language-switcher";
import { PostLocale } from "@prisma/client";

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  default: {
    post: {
      findFirst: vi.fn(),
    },
  },
}));

// Mock Next.js Link
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import prisma from "@/lib/prisma";

describe("LanguageSwitcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return null when groupId is null", async () => {
    const { container } = render(
      await LanguageSwitcher({
        currentLocale: PostLocale.EN,
        currentSlug: "test-post",
        groupId: null,
      })
    );

    expect(container.firstChild).toBeNull();
  });

  it("should show English as current language for EN locale", async () => {
    vi.mocked(prisma.post.findFirst).mockResolvedValue({
      slug: "ce-shi-wen-zhang",
      locale: PostLocale.ZH,
      title: "测试文章",
    });

    render(
      await LanguageSwitcher({
        currentLocale: PostLocale.EN,
        currentSlug: "test-post",
        groupId: "group-1",
      })
    );

    expect(screen.getByText("English")).toBeInTheDocument();
  });

  it("should show 中文 as current language for ZH locale", async () => {
    vi.mocked(prisma.post.findFirst).mockResolvedValue({
      slug: "test-post",
      locale: PostLocale.EN,
      title: "Test Post",
    });

    render(
      await LanguageSwitcher({
        currentLocale: PostLocale.ZH,
        currentSlug: "ce-shi-wen-zhang",
        groupId: "group-1",
      })
    );

    expect(screen.getByText("中文")).toBeInTheDocument();
  });

  it("should show link to ZH version when current is EN", async () => {
    vi.mocked(prisma.post.findFirst).mockResolvedValue({
      slug: "ce-shi-wen-zhang",
      locale: PostLocale.ZH,
      title: "测试文章",
    });

    render(
      await LanguageSwitcher({
        currentLocale: PostLocale.EN,
        currentSlug: "test-post",
        groupId: "group-1",
      })
    );

    const link = screen.getByRole("link", { name: "中文" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/zh/posts/ce-shi-wen-zhang");
  });

  it("should show link to EN version when current is ZH", async () => {
    vi.mocked(prisma.post.findFirst).mockResolvedValue({
      slug: "test-post",
      locale: PostLocale.EN,
      title: "Test Post",
    });

    render(
      await LanguageSwitcher({
        currentLocale: PostLocale.ZH,
        currentSlug: "ce-shi-wen-zhang",
        groupId: "group-1",
      })
    );

    const link = screen.getByRole("link", { name: "English" });
    expect(link).toBeInTheDocument();
    // Component always adds /en/ prefix for English links
    expect(link).toHaveAttribute("href", "/en/posts/test-post");
  });

  it("should return null when no alternate version exists", async () => {
    vi.mocked(prisma.post.findFirst).mockResolvedValue(null);

    const { container } = render(
      await LanguageSwitcher({
        currentLocale: PostLocale.EN,
        currentSlug: "test-post",
        groupId: "group-1",
      })
    );

    // Component returns null when alternate doesn't exist
    expect(container.firstChild).toBeNull();
  });

  it("should query database for alternate language post", async () => {
    vi.mocked(prisma.post.findFirst).mockResolvedValue(null);

    render(
      await LanguageSwitcher({
        currentLocale: PostLocale.EN,
        currentSlug: "test-post",
        groupId: "group-123",
      })
    );

    expect(prisma.post.findFirst).toHaveBeenCalledWith({
      where: {
        groupId: "group-123",
        locale: PostLocale.ZH,
      },
      select: {
        slug: true,
        locale: true,
        title: true,
      },
    });
  });

  it("should render language icon when alternate exists", async () => {
    // Mock an existing alternate post so component renders
    vi.mocked(prisma.post.findFirst).mockResolvedValue({
      slug: "ce-shi-wen-zhang",
      locale: PostLocale.ZH,
      title: "测试文章",
    });

    const { container } = render(
      await LanguageSwitcher({
        currentLocale: PostLocale.EN,
        currentSlug: "test-post",
        groupId: "group-1",
      })
    );

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("should apply correct styling classes", async () => {
    vi.mocked(prisma.post.findFirst).mockResolvedValue({
      slug: "ce-shi-wen-zhang",
      locale: PostLocale.ZH,
      title: "测试文章",
    });

    const { container } = render(
      await LanguageSwitcher({
        currentLocale: PostLocale.EN,
        currentSlug: "test-post",
        groupId: "group-1",
      })
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass(
      "flex",
      "items-center",
      "gap-3",
      "rounded-lg",
      "border",
      "border-stone-200",
      "bg-stone-50"
    );
  });

  it("should handle both EN and ZH alternates correctly", async () => {
    // Test EN -> ZH
    vi.mocked(prisma.post.findFirst).mockResolvedValue({
      slug: "zhong-wen",
      locale: PostLocale.ZH,
      title: "中文",
    });

    const { rerender } = render(
      await LanguageSwitcher({
        currentLocale: PostLocale.EN,
        currentSlug: "english",
        groupId: "group-1",
      })
    );

    expect(screen.getByRole("link", { name: "中文" })).toHaveAttribute(
      "href",
      "/zh/posts/zhong-wen"
    );

    // Test ZH -> EN
    vi.mocked(prisma.post.findFirst).mockResolvedValue({
      slug: "english",
      locale: PostLocale.EN,
      title: "English",
    });

    rerender(
      await LanguageSwitcher({
        currentLocale: PostLocale.ZH,
        currentSlug: "zhong-wen",
        groupId: "group-1",
      })
    );

    // Component always adds /en/ prefix for English links
    expect(screen.getByRole("link", { name: "English" })).toHaveAttribute(
      "href",
      "/en/posts/english"
    );
  });
});

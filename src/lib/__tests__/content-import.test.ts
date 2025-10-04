import { describe, it, expect, vi, beforeEach } from "vitest";
import { importContent } from "../content-import";
import { PostLocale } from "@prisma/client";
import JSZip from "jszip";

// Mock dependencies
vi.mock("../prisma", () => ({
  default: {
    post: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("../content-export", () => ({
  parseMarkdown: vi.fn(),
  validateFrontmatter: vi.fn(),
}));

vi.mock("../posts", () => ({
  serializeTags: vi.fn((tags: string[]) => JSON.stringify(tags)),
}));

vi.mock("pinyin-pro", () => ({
  pinyin: vi.fn((text: string) => text.toLowerCase().replace(/\s+/g, "-")),
}));

import prisma from "../prisma";
import { parseMarkdown, validateFrontmatter } from "../content-export";
import { pinyin } from "pinyin-pro";

describe("Content Import Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("importContent", () => {
    it("should import valid posts in dry-run mode", async () => {
      const zip = new JSZip();
      zip.file(
        "content/en/test-post.md",
        `---
title: "Test Post"
date: "2024-01-01T00:00:00.000Z"
slug: "test-post"
locale: "EN"
groupId: "group-1"
tags: ["test"]
status: "PUBLISHED"
---

Content here.`
      );

      const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

      vi.mocked(parseMarkdown).mockReturnValue({
        frontmatter: {
          title: "Test Post",
          date: "2024-01-01T00:00:00.000Z",
          slug: "test-post",
          locale: "EN",
          groupId: "group-1",
          tags: ["test"],
          status: "PUBLISHED",
        },
        content: "Content here.",
      });

      vi.mocked(validateFrontmatter).mockReturnValue({
        valid: true,
        errors: [],
      });

      vi.mocked(prisma.post.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.post.findUnique).mockResolvedValue(null);

      const result = await importContent(zipBuffer, {
        dryRun: true,
        adminId: "admin-123",
      });

      expect(result.dryRun).toBe(true);
      expect(result.summary.created).toBe(1);
      expect(result.summary.updated).toBe(0);
      expect(result.summary.errors).toBe(0);
      expect(result.details).toHaveLength(1);
      expect(result.details[0].action).toBe("create");
      expect(result.details[0].post?.title).toBe("Test Post");

      // Verify no database operations in dry-run
      expect(prisma.post.create).not.toHaveBeenCalled();
    });

    it("should create new posts when not in dry-run mode", async () => {
      const zip = new JSZip();
      zip.file(
        "content/en/new-post.md",
        `---
title: "New Post"
date: "2024-01-01T00:00:00.000Z"
slug: "new-post"
locale: "EN"
groupId: null
tags: []
status: "DRAFT"
---

New content.`
      );

      const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

      vi.mocked(parseMarkdown).mockReturnValue({
        frontmatter: {
          title: "New Post",
          date: "2024-01-01T00:00:00.000Z",
          slug: "new-post",
          locale: "EN",
          groupId: null,
          tags: [],
          status: "DRAFT",
        },
        content: "New content.",
      });

      vi.mocked(validateFrontmatter).mockReturnValue({
        valid: true,
        errors: [],
      });

      vi.mocked(prisma.post.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.post.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.post.create).mockResolvedValue({} as unknown as { id: string });

      const result = await importContent(zipBuffer, {
        dryRun: false,
        adminId: "admin-123",
      });

      expect(result.summary.created).toBe(1);
      expect(prisma.post.create).toHaveBeenCalledOnce();
    });

    it("should update existing posts", async () => {
      const zip = new JSZip();
      zip.file(
        "content/zh/existing-post.md",
        `---
title: "Updated Title"
date: "2024-01-01T00:00:00.000Z"
slug: "existing-post"
locale: "ZH"
groupId: "group-1"
tags: ["updated"]
status: "PUBLISHED"
---

Updated content.`
      );

      const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

      vi.mocked(parseMarkdown).mockReturnValue({
        frontmatter: {
          title: "Updated Title",
          date: "2024-01-01T00:00:00.000Z",
          slug: "existing-post",
          locale: "ZH",
          groupId: "group-1",
          tags: ["updated"],
          status: "PUBLISHED",
        },
        content: "Updated content.",
      });

      vi.mocked(validateFrontmatter).mockReturnValue({
        valid: true,
        errors: [],
      });

      vi.mocked(prisma.post.findFirst).mockResolvedValue({ id: "post-123" });
      vi.mocked(prisma.post.update).mockResolvedValue({} as unknown as { id: string });

      const result = await importContent(zipBuffer, {
        dryRun: false,
        adminId: "admin-123",
      });

      expect(result.summary.updated).toBe(1);
      expect(result.summary.created).toBe(0);
      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id: "post-123" },
        data: expect.objectContaining({
          title: "Updated Title",
          content: "Updated content.",
        }),
      });
    });

    it("should handle invalid frontmatter", async () => {
      const zip = new JSZip();
      zip.file(
        "content/en/invalid.md",
        `---
title: "Invalid Post"
---

Content.`
      );

      const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

      vi.mocked(parseMarkdown).mockReturnValue({
        frontmatter: {
          title: "Invalid Post",
        },
        content: "Content.",
      });

      vi.mocked(validateFrontmatter).mockReturnValue({
        valid: false,
        errors: ["Missing required field: date", "Missing required field: locale"],
      });

      const result = await importContent(zipBuffer, {
        dryRun: true,
        adminId: "admin-123",
      });

      expect(result.summary.errors).toBe(1);
      expect(result.details[0].action).toBe("error");
      expect(result.details[0].error).toContain("Invalid frontmatter");
    });

    it("should handle parse errors", async () => {
      const zip = new JSZip();
      zip.file("content/en/malformed.md", "Invalid markdown without frontmatter");

      const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

      vi.mocked(parseMarkdown).mockImplementation(() => {
        throw new Error("Invalid Markdown format");
      });

      const result = await importContent(zipBuffer, {
        dryRun: true,
        adminId: "admin-123",
      });

      expect(result.summary.errors).toBe(1);
      expect(result.details[0].action).toBe("error");
      expect(result.details[0].error).toBe("Invalid Markdown format");
    });

    it("should auto-generate pinyin slug for Chinese posts", async () => {
      const zip = new JSZip();
      zip.file(
        "content/zh/chinese-post.md",
        `---
title: "测试文章"
date: "2024-01-01T00:00:00.000Z"
locale: "ZH"
groupId: null
tags: []
status: "PUBLISHED"
---

中文内容。`
      );

      const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

      vi.mocked(parseMarkdown).mockReturnValue({
        frontmatter: {
          title: "测试文章",
          date: "2024-01-01T00:00:00.000Z",
          locale: "ZH",
          groupId: null,
          tags: [],
          status: "PUBLISHED",
        },
        content: "中文内容。",
      });

      vi.mocked(validateFrontmatter).mockReturnValue({
        valid: true,
        errors: [],
      });

      vi.mocked(pinyin).mockReturnValue("ce-shi-wen-zhang");
      vi.mocked(prisma.post.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.post.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.post.create).mockResolvedValue({} as unknown as { id: string });

      const result = await importContent(zipBuffer, {
        dryRun: false,
        adminId: "admin-123",
      });

      expect(result.summary.created).toBe(1);
      expect(pinyin).toHaveBeenCalledWith("测试文章", {
        toneType: "none",
        separator: "-",
      });
      expect(result.details[0].post?.slug).toBe("ce-shi-wen-zhang");
    });

    it("should handle missing slug for non-Chinese posts", async () => {
      const zip = new JSZip();
      zip.file(
        "content/en/no-slug.md",
        `---
title: "No Slug Post"
date: "2024-01-01T00:00:00.000Z"
locale: "EN"
groupId: null
tags: []
status: "PUBLISHED"
---

Content.`
      );

      const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

      vi.mocked(parseMarkdown).mockReturnValue({
        frontmatter: {
          title: "No Slug Post",
          date: "2024-01-01T00:00:00.000Z",
          locale: "EN",
          groupId: null,
          tags: [],
          status: "PUBLISHED",
        },
        content: "Content.",
      });

      vi.mocked(validateFrontmatter).mockReturnValue({
        valid: true,
        errors: [],
      });

      const result = await importContent(zipBuffer, {
        dryRun: true,
        adminId: "admin-123",
      });

      expect(result.summary.errors).toBe(1);
      expect(result.details[0].action).toBe("error");
      expect(result.details[0].error).toBe("Missing slug and could not auto-generate");
    });

    it("should process multiple files", async () => {
      const zip = new JSZip();
      zip.file(
        "content/en/post-1.md",
        `---
title: "Post 1"
date: "2024-01-01T00:00:00.000Z"
slug: "post-1"
locale: "EN"
groupId: null
tags: []
status: "PUBLISHED"
---

Content 1.`
      );
      zip.file(
        "content/zh/post-2.md",
        `---
title: "Post 2"
date: "2024-01-02T00:00:00.000Z"
slug: "post-2"
locale: "ZH"
groupId: null
tags: []
status: "DRAFT"
---

Content 2.`
      );

      const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

      vi.mocked(parseMarkdown).mockImplementation((content) => {
        if (content.includes("Post 1")) {
          return {
            frontmatter: {
              title: "Post 1",
              date: "2024-01-01T00:00:00.000Z",
              slug: "post-1",
              locale: "EN",
              groupId: null,
              tags: [],
              status: "PUBLISHED",
            },
            content: "Content 1.",
          };
        }
        return {
          frontmatter: {
            title: "Post 2",
            date: "2024-01-02T00:00:00.000Z",
            slug: "post-2",
            locale: "ZH",
            groupId: null,
            tags: [],
            status: "DRAFT",
          },
          content: "Content 2.",
        };
      });

      vi.mocked(validateFrontmatter).mockReturnValue({
        valid: true,
        errors: [],
      });

      vi.mocked(prisma.post.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.post.findUnique).mockResolvedValue(null);

      const result = await importContent(zipBuffer, {
        dryRun: true,
        adminId: "admin-123",
      });

      expect(result.summary.created).toBe(2);
      expect(result.details).toHaveLength(2);
    });

    it("should handle posts with optional fields", async () => {
      const zip = new JSZip();
      zip.file(
        "content/en/full-post.md",
        `---
title: "Full Post"
date: "2024-01-01T00:00:00.000Z"
slug: "full-post"
locale: "EN"
groupId: "group-1"
tags: ["tag1", "tag2"]
status: "PUBLISHED"
excerpt: "Test excerpt"
cover: "../uploads/cover.jpg"
author: "custom-author-id"
publishedAt: "2024-01-15T00:00:00.000Z"
---

Full content.`
      );

      const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

      vi.mocked(parseMarkdown).mockReturnValue({
        frontmatter: {
          title: "Full Post",
          date: "2024-01-01T00:00:00.000Z",
          slug: "full-post",
          locale: "EN",
          groupId: "group-1",
          tags: ["tag1", "tag2"],
          status: "PUBLISHED",
          excerpt: "Test excerpt",
          cover: "../uploads/cover.jpg",
          author: "custom-author-id",
          publishedAt: "2024-01-15T00:00:00.000Z",
        },
        content: "Full content.",
      });

      vi.mocked(validateFrontmatter).mockReturnValue({
        valid: true,
        errors: [],
      });

      vi.mocked(prisma.post.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.post.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.post.create).mockResolvedValue({} as unknown as { id: string });

      const result = await importContent(zipBuffer, {
        dryRun: false,
        adminId: "admin-123",
      });

      expect(result.summary.created).toBe(1);
      expect(prisma.post.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: "Full Post",
          excerpt: "Test excerpt",
          coverImagePath: "/uploads/cover.jpg",
          author: {
            connect: {
              id: "custom-author-id",
            },
          },
        }),
      });
    });

    it("should match existing posts by groupId and locale", async () => {
      const zip = new JSZip();
      zip.file(
        "content/en/grouped-post.md",
        `---
title: "Grouped Post"
date: "2024-01-01T00:00:00.000Z"
slug: "grouped-post"
locale: "EN"
groupId: "shared-group"
tags: []
status: "PUBLISHED"
---

Content.`
      );

      const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

      vi.mocked(parseMarkdown).mockReturnValue({
        frontmatter: {
          title: "Grouped Post",
          date: "2024-01-01T00:00:00.000Z",
          slug: "grouped-post",
          locale: "EN",
          groupId: "shared-group",
          tags: [],
          status: "PUBLISHED",
        },
        content: "Content.",
      });

      vi.mocked(validateFrontmatter).mockReturnValue({
        valid: true,
        errors: [],
      });

      vi.mocked(prisma.post.findFirst).mockResolvedValue({ id: "existing-post-id" });
      vi.mocked(prisma.post.update).mockResolvedValue({} as unknown as { id: string });

      const result = await importContent(zipBuffer, {
        dryRun: false,
        adminId: "admin-123",
      });

      expect(result.summary.updated).toBe(1);
      expect(prisma.post.findFirst).toHaveBeenCalledWith({
        where: { groupId: "shared-group", locale: PostLocale.EN },
        select: { id: true },
      });
    });

    it("should ignore directories in zip", async () => {
      const zip = new JSZip();
      zip.folder("content/en");
      zip.file(
        "content/en/post.md",
        `---
title: "Post"
date: "2024-01-01T00:00:00.000Z"
slug: "post"
locale: "EN"
groupId: null
tags: []
status: "PUBLISHED"
---

Content.`
      );

      const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

      vi.mocked(parseMarkdown).mockReturnValue({
        frontmatter: {
          title: "Post",
          date: "2024-01-01T00:00:00.000Z",
          slug: "post",
          locale: "EN",
          groupId: null,
          tags: [],
          status: "PUBLISHED",
        },
        content: "Content.",
      });

      vi.mocked(validateFrontmatter).mockReturnValue({
        valid: true,
        errors: [],
      });

      vi.mocked(prisma.post.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.post.findUnique).mockResolvedValue(null);

      const result = await importContent(zipBuffer, {
        dryRun: true,
        adminId: "admin-123",
      });

      expect(result.summary.created).toBe(1);
      expect(result.details).toHaveLength(1);
    });
  });
});

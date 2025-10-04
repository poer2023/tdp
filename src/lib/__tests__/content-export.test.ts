import { describe, it, expect, vi } from "vitest";
import { parseMarkdown, validateFrontmatter } from "../content-export";
import { PostLocale, PostStatus } from "@prisma/client";

// Mock Prisma
vi.mock("../prisma", () => ({
  default: {
    post: {
      findMany: vi.fn(),
    },
  },
}));

describe("Content Export Functions", () => {
  describe("parseMarkdown", () => {
    it("should parse valid Markdown with frontmatter", () => {
      const markdown = `---
title: "Test Post"
date: "2024-01-01T00:00:00.000Z"
slug: "test-post"
locale: "EN"
groupId: "group-1"
tags:
  - "react"
  - "nextjs"
status: "PUBLISHED"
---

This is the content of the post.`;

      const result = parseMarkdown(markdown);

      expect(result.frontmatter.title).toBe("Test Post");
      expect(result.frontmatter.date).toBe("2024-01-01T00:00:00.000Z");
      expect(result.frontmatter.slug).toBe("test-post");
      expect(result.frontmatter.locale).toBe("EN");
      expect(result.frontmatter.groupId).toBe("group-1");
      expect(result.frontmatter.tags).toEqual(["react", "nextjs"]);
      expect(result.frontmatter.status).toBe("PUBLISHED");
      expect(result.content).toBe("This is the content of the post.");
    });

    it("should parse frontmatter with optional fields", () => {
      const markdown = `---
title: "Test Post"
date: "2024-01-01T00:00:00.000Z"
slug: "test-post"
locale: "EN"
groupId: "group-1"
tags:
  - "test"
status: "PUBLISHED"
excerpt: "Test excerpt"
cover: "../uploads/cover.jpg"
author: "author-id-123"
publishedAt: "2024-01-15T00:00:00.000Z"
---

Content here.`;

      const result = parseMarkdown(markdown);

      expect(result.frontmatter.excerpt).toBe("Test excerpt");
      expect(result.frontmatter.cover).toBe("../uploads/cover.jpg");
      expect(result.frontmatter.author).toBe("author-id-123");
      expect(result.frontmatter.publishedAt).toBe("2024-01-15T00:00:00.000Z");
    });

    it("should parse empty tags array", () => {
      const markdown = `---
title: "Test Post"
date: "2024-01-01T00:00:00.000Z"
slug: "test-post"
locale: "EN"
groupId: "group-1"
tags: []
status: "PUBLISHED"
---

Content.`;

      const result = parseMarkdown(markdown);

      expect(result.frontmatter.tags).toEqual([]);
    });

    it("should handle Chinese characters in frontmatter", () => {
      const markdown = `---
title: "测试文章"
date: "2024-01-01T00:00:00.000Z"
slug: "ce-shi-wen-zhang"
locale: "ZH"
groupId: "group-1"
tags:
  - "技术"
  - "教程"
status: "PUBLISHED"
---

这是中文内容。`;

      const result = parseMarkdown(markdown);

      expect(result.frontmatter.title).toBe("测试文章");
      expect(result.frontmatter.tags).toEqual(["技术", "教程"]);
      expect(result.content).toBe("这是中文内容。");
    });

    it("should throw error for invalid format (no frontmatter)", () => {
      const markdown = "This is just content without frontmatter.";

      expect(() => parseMarkdown(markdown)).toThrow("Invalid Markdown format: missing frontmatter");
    });

    it("should throw error for malformed frontmatter", () => {
      const markdown = `---
title: "Test
---

Content.`;

      expect(() => parseMarkdown(markdown)).toThrow();
    });

    it("should handle multiline content", () => {
      const markdown = `---
title: "Test Post"
date: "2024-01-01T00:00:00.000Z"
slug: "test-post"
locale: "EN"
groupId: "group-1"
tags: []
status: "PUBLISHED"
---

Line 1
Line 2

Paragraph 2`;

      const result = parseMarkdown(markdown);

      expect(result.content).toBe("Line 1\nLine 2\n\nParagraph 2");
    });

    it("should handle boolean values", () => {
      const markdown = `---
title: "Test Post"
date: "2024-01-01T00:00:00.000Z"
slug: "test-post"
locale: "EN"
groupId: "group-1"
tags: []
status: "PUBLISHED"
featured: true
---

Content.`;

      const result = parseMarkdown(markdown);

      expect(result.frontmatter.featured).toBe(true);
    });

    it("should handle numeric values", () => {
      const markdown = `---
title: "Test Post"
date: "2024-01-01T00:00:00.000Z"
slug: "test-post"
locale: "EN"
groupId: "group-1"
tags: []
status: "PUBLISHED"
views: 100
---

Content.`;

      const result = parseMarkdown(markdown);

      expect(result.frontmatter.views).toBe(100);
    });
  });

  describe("validateFrontmatter", () => {
    it("should validate correct frontmatter", () => {
      const frontmatter = {
        title: "Test Post",
        date: "2024-01-01T00:00:00.000Z",
        slug: "test-post",
        locale: "EN",
        groupId: "group-1",
        tags: ["react", "nextjs"],
        status: "PUBLISHED",
      };

      const result = validateFrontmatter(frontmatter);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should detect missing required fields", () => {
      const frontmatter = {
        title: "Test Post",
        slug: "test-post",
        // Missing: date, locale, groupId, tags, status
      };

      const result = validateFrontmatter(frontmatter);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Missing required field: date");
      expect(result.errors).toContain("Missing required field: locale");
      expect(result.errors).toContain("Missing required field: groupId");
      expect(result.errors).toContain("Missing required field: tags");
      expect(result.errors).toContain("Missing required field: status");
    });

    it("should validate locale enum", () => {
      const frontmatter = {
        title: "Test Post",
        date: "2024-01-01T00:00:00.000Z",
        slug: "test-post",
        locale: "INVALID",
        groupId: "group-1",
        tags: [],
        status: "PUBLISHED",
      };

      const result = validateFrontmatter(frontmatter);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid locale: INVALID. Must be "EN" or "ZH"');
    });

    it("should validate status enum", () => {
      const frontmatter = {
        title: "Test Post",
        date: "2024-01-01T00:00:00.000Z",
        slug: "test-post",
        locale: "EN",
        groupId: "group-1",
        tags: [],
        status: "ARCHIVED",
      };

      const result = validateFrontmatter(frontmatter);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid status: ARCHIVED. Must be "PUBLISHED" or "DRAFT"');
    });

    it("should validate date format", () => {
      const frontmatter = {
        title: "Test Post",
        date: "invalid-date",
        slug: "test-post",
        locale: "EN",
        groupId: "group-1",
        tags: [],
        status: "PUBLISHED",
      };

      const result = validateFrontmatter(frontmatter);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Invalid date format: invalid-date");
    });

    it("should validate tags is array", () => {
      const frontmatter = {
        title: "Test Post",
        date: "2024-01-01T00:00:00.000Z",
        slug: "test-post",
        locale: "EN",
        groupId: "group-1",
        tags: "not-an-array",
        status: "PUBLISHED",
      };

      const result = validateFrontmatter(frontmatter);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Invalid tags: must be an array");
    });

    it("should accept ZH locale", () => {
      const frontmatter = {
        title: "测试文章",
        date: "2024-01-01T00:00:00.000Z",
        slug: "ce-shi-wen-zhang",
        locale: "ZH",
        groupId: "group-1",
        tags: ["技术"],
        status: "PUBLISHED",
      };

      const result = validateFrontmatter(frontmatter);

      expect(result.valid).toBe(true);
    });

    it("should accept DRAFT status", () => {
      const frontmatter = {
        title: "Test Post",
        date: "2024-01-01T00:00:00.000Z",
        slug: "test-post",
        locale: "EN",
        groupId: "group-1",
        tags: [],
        status: "DRAFT",
      };

      const result = validateFrontmatter(frontmatter);

      expect(result.valid).toBe(true);
    });

    it("should accept empty tags array", () => {
      const frontmatter = {
        title: "Test Post",
        date: "2024-01-01T00:00:00.000Z",
        slug: "test-post",
        locale: "EN",
        groupId: "group-1",
        tags: [],
        status: "PUBLISHED",
      };

      const result = validateFrontmatter(frontmatter);

      expect(result.valid).toBe(true);
    });

    it("should accumulate multiple errors", () => {
      const frontmatter = {
        // Missing most required fields
        slug: "test-post",
        locale: "INVALID",
        status: "INVALID",
        tags: "not-array",
      };

      const result = validateFrontmatter(frontmatter);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(3);
    });
  });
});

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { generateBlogPostingSchema, generateAlternateLinks } from "../seo";
import { PostLocale } from "@prisma/client";

describe("SEO Helper Functions", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com";
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("generateBlogPostingSchema", () => {
    it("should generate valid BlogPosting schema for EN post", () => {
      const post = {
        title: "Test Post",
        excerpt: "Test excerpt",
        content: "Test content",
        publishedAt: new Date("2024-01-01T00:00:00.000Z"),
        coverImagePath: "/uploads/cover.jpg",
        locale: PostLocale.EN,
        author: {
          name: "John Doe",
        },
      };

      const schema = generateBlogPostingSchema(post, "https://example.com/posts/test-post");

      expect(schema["@context"]).toBe("https://schema.org");
      expect(schema["@type"]).toBe("BlogPosting");
      expect(schema.headline).toBe("Test Post");
      expect(schema.description).toBe("Test excerpt");
      expect(schema.inLanguage).toBe("en-US");
      expect(schema.datePublished).toBe("2024-01-01T00:00:00.000Z");
      expect(schema.image).toBe("https://example.com/uploads/cover.jpg");
      expect(schema.author).toEqual({
        "@type": "Person",
        name: "John Doe",
      });
    });

    it("should generate valid BlogPosting schema for ZH post", () => {
      const post = {
        title: "测试文章",
        excerpt: "测试摘要",
        content: "测试内容",
        publishedAt: new Date("2024-01-01T00:00:00.000Z"),
        coverImagePath: null,
        locale: PostLocale.ZH,
        author: {
          name: "张三",
        },
      };

      const schema = generateBlogPostingSchema(post, "https://example.com/zh/posts/test-post");

      expect(schema.inLanguage).toBe("zh-CN");
      expect(schema.headline).toBe("测试文章");
      expect(schema.image).toBeUndefined();
    });

    it("should use 'Anonymous' when author name is null", () => {
      const post = {
        title: "Test Post",
        excerpt: "Test excerpt",
        content: "Test content",
        publishedAt: new Date("2024-01-01T00:00:00.000Z"),
        coverImagePath: null,
        locale: PostLocale.EN,
        author: {
          name: null,
        },
      };

      const schema = generateBlogPostingSchema(post, "https://example.com/posts/test-post");

      expect(schema.author).toEqual({
        "@type": "Person",
        name: "Anonymous",
      });
    });

    it("should use 'Anonymous' when author is null", () => {
      const post = {
        title: "Test Post",
        excerpt: "Test excerpt",
        content: "Test content",
        publishedAt: new Date("2024-01-01T00:00:00.000Z"),
        coverImagePath: null,
        locale: PostLocale.EN,
        author: null,
      };

      const schema = generateBlogPostingSchema(post, "https://example.com/posts/test-post");

      expect(schema.author).toEqual({
        "@type": "Person",
        name: "Anonymous",
      });
    });

    it("should include publisher and mainEntityOfPage", () => {
      const post = {
        title: "Test Post",
        excerpt: "Test excerpt",
        content: "Test content",
        publishedAt: new Date("2024-01-01T00:00:00.000Z"),
        coverImagePath: null,
        locale: PostLocale.EN,
        author: null,
      };

      const url = "https://example.com/posts/test-post";
      const schema = generateBlogPostingSchema(post, url);

      expect(schema.publisher).toEqual({
        "@type": "Organization",
        name: "Hao's Blog",
        logo: {
          "@type": "ImageObject",
          url: "https://example.com/logo.png",
        },
      });

      expect(schema.mainEntityOfPage).toEqual({
        "@type": "WebPage",
        "@id": url,
      });
    });

    it("should handle null publishedAt", () => {
      const post = {
        title: "Test Post",
        excerpt: "Test excerpt",
        content: "Test content",
        publishedAt: null,
        coverImagePath: null,
        locale: PostLocale.EN,
        author: null,
      };

      const schema = generateBlogPostingSchema(post, "https://example.com/posts/test-post");

      expect(schema.datePublished).toBeUndefined();
    });
  });

  describe("generateAlternateLinks", () => {
    it("should generate correct links for EN post with ZH translation", () => {
      const links = generateAlternateLinks(PostLocale.EN, "test-post", "ce-shi-wen-zhang");

      expect(links.en).toBe("https://example.com/posts/test-post");
      expect(links.zh).toBe("https://example.com/zh/posts/ce-shi-wen-zhang");
      expect(links["x-default"]).toBe("https://example.com/posts/test-post");
    });

    it("should generate correct links for ZH post with EN translation", () => {
      const links = generateAlternateLinks(PostLocale.ZH, "ce-shi-wen-zhang", "test-post");

      expect(links.zh).toBe("https://example.com/zh/posts/ce-shi-wen-zhang");
      expect(links.en).toBe("https://example.com/posts/test-post");
      expect(links["x-default"]).toBe("https://example.com/posts/test-post");
    });

    it("should only include current locale when no translation exists (EN)", () => {
      const links = generateAlternateLinks(PostLocale.EN, "test-post");

      expect(links.en).toBe("https://example.com/posts/test-post");
      expect(links["x-default"]).toBe("https://example.com/posts/test-post");
      expect(links.zh).toBeUndefined();
    });

    it("should only include current locale when no translation exists (ZH)", () => {
      const links = generateAlternateLinks(PostLocale.ZH, "ce-shi-wen-zhang");

      expect(links.zh).toBe("https://example.com/zh/posts/ce-shi-wen-zhang");
      expect(links.en).toBeUndefined();
      expect(links["x-default"]).toBeUndefined();
    });

    it("should handle empty NEXT_PUBLIC_SITE_URL", () => {
      process.env.NEXT_PUBLIC_SITE_URL = "";

      const links = generateAlternateLinks(PostLocale.EN, "test-post", "ce-shi-wen-zhang");

      expect(links.en).toBe("/posts/test-post");
      expect(links.zh).toBe("/zh/posts/ce-shi-wen-zhang");
    });

    it("should use empty string as baseUrl when NEXT_PUBLIC_SITE_URL is undefined", () => {
      delete process.env.NEXT_PUBLIC_SITE_URL;

      const links = generateAlternateLinks(PostLocale.EN, "test-post");

      expect(links.en).toBe("/posts/test-post");
      expect(links["x-default"]).toBe("/posts/test-post");
    });
  });
});

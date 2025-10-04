import { PostLocale, PostStatus, type Post } from "@prisma/client";
import prisma from "@/lib/prisma";
import { parseTags } from "@/lib/posts";
import JSZip from "jszip";

export type ExportOptions = {
  from?: string; // ISO8601 date
  to?: string; // ISO8601 date
  statuses?: PostStatus[];
  locales?: PostLocale[];
};

export type ExportManifest = {
  exportedAt: string;
  version: string;
  filters: ExportOptions;
  stats: {
    totalPosts: number;
    postsByLocale: Record<string, number>;
    totalAssets: number;
  };
};

/**
 * Export posts to a zip bundle with Markdown files and assets
 */
export async function exportContent(options: ExportOptions = {}): Promise<Buffer> {
  const { from, to, statuses, locales } = options;

  // Build query filters
  const where: Record<string, unknown> = {};

  if (from || to) {
    where.publishedAt = {};
    if (from) (where.publishedAt as Record<string, unknown>).gte = new Date(from);
    if (to) (where.publishedAt as Record<string, unknown>).lte = new Date(to);
  }

  if (statuses && statuses.length > 0) {
    where.status = { in: statuses };
  }

  if (locales && locales.length > 0) {
    where.locale = { in: locales };
  }

  // Fetch posts
  const posts = await prisma.post.findMany({
    where,
    include: { author: true },
    orderBy: { createdAt: "desc" },
  });

  // Create zip
  const zip = new JSZip();

  // Track assets
  const assetsUsed = new Set<string>();

  // Generate Markdown files
  for (const post of posts) {
    const markdown = generateMarkdown(post);
    const locale = post.locale === PostLocale.EN ? "en" : "zh";
    zip.file(`content/${locale}/${post.slug}.md`, markdown);

    // Track cover image
    if (post.coverImagePath) {
      assetsUsed.add(post.coverImagePath);
    }

    // Extract image references from content
    const imageMatches = post.content.match(/!\[.*?\]\((.*?)\)/g);
    if (imageMatches) {
      for (const match of imageMatches) {
        const urlMatch = match.match(/!\[.*?\]\((.*?)\)/);
        if (urlMatch && urlMatch[1]) {
          assetsUsed.add(urlMatch[1]);
        }
      }
    }
  }

  // Note: In production, you would copy actual asset files here
  // For now, we just document which assets are referenced
  // zip.file("content/uploads/.gitkeep", "");

  // Create manifest
  const manifest: ExportManifest = {
    exportedAt: new Date().toISOString(),
    version: "1.0",
    filters: options,
    stats: {
      totalPosts: posts.length,
      postsByLocale: {
        EN: posts.filter((p) => p.locale === PostLocale.EN).length,
        ZH: posts.filter((p) => p.locale === PostLocale.ZH).length,
      },
      totalAssets: assetsUsed.size,
    },
  };

  zip.file("manifest.json", JSON.stringify(manifest, null, 2));

  // Generate zip buffer
  return await zip.generateAsync({ type: "nodebuffer" });
}

/**
 * Generate Markdown file with frontmatter from Post
 */
function generateMarkdown(
  post: Post & { author: { id: string; name: string | null } | null }
): string {
  const tags = parseTags(post.tags);

  // Build frontmatter
  const frontmatter: Record<string, unknown> = {
    // Required core fields
    title: post.title,
    slug: post.slug,
    locale: post.locale,
    status: post.status,
    // Dates: required created date, optional publishedAt
    date: post.createdAt.toISOString(),
    // Associations and taxonomy
    groupId: post.groupId,
    tags,
  };

  // Optional fields
  if (post.excerpt) {
    frontmatter.excerpt = post.excerpt;
  }

  if (post.coverImagePath) {
    // Convert to relative path format
    const relativePath = post.coverImagePath.startsWith("/")
      ? `../uploads${post.coverImagePath}`
      : `../uploads/${post.coverImagePath}`;
    frontmatter.cover = relativePath;
  }

  if (post.author) {
    frontmatter.author = post.author.id;
  }

  if (post.publishedAt) {
    frontmatter.publishedAt = post.publishedAt.toISOString();
  }

  // Generate YAML frontmatter in deterministic order
  const orderedKeys = [
    "title",
    "slug",
    "locale",
    "status",
    "publishedAt",
    "date",
    "groupId",
    "excerpt",
    "tags",
    "cover",
    "author",
  ];

  const yaml = orderedKeys
    .filter((key) => key in frontmatter)
    .map((key) => {
      const value = frontmatter[key];
      if (Array.isArray(value)) {
        if (value.length === 0) return `${key}: []`;
        return `${key}:\n${value.map((v) => `  - ${JSON.stringify(v)}`).join("\n")}`;
      }
      return `${key}: ${JSON.stringify(value)}`;
    })
    .join("\n");

  return `---\n${yaml}\n---\n\n${post.content}\n`;
}

/**
 * Parse frontmatter and content from Markdown file
 */
export function parseMarkdown(markdown: string): {
  frontmatter: Record<string, unknown>;
  content: string;
} {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n\n([\s\S]*)$/);

  if (!match || !match[1] || !match[2]) {
    throw new Error("Invalid Markdown format: missing frontmatter");
  }

  const frontmatterText = match[1];
  const content = match[2];

  // Parse YAML frontmatter (simple implementation)
  const frontmatter: Record<string, unknown> = {};
  const lines = frontmatterText.split("\n");

  let currentKey: string | null = null;
  let currentArray: string[] = [];

  for (const line of lines) {
    // Array item
    if (line.trim().startsWith("- ")) {
      if (currentKey) {
        const value = line.trim().slice(2).trim();
        currentArray.push(JSON.parse(value));
      }
      continue;
    }

    // Save previous array
    if (currentKey && currentArray.length > 0) {
      frontmatter[currentKey] = currentArray;
      currentArray = [];
    }

    // Key-value pair
    const kvMatch = line.match(/^(\w+):\s*(.*)$/);
    if (kvMatch && kvMatch[1] && kvMatch[2] !== undefined) {
      const key = kvMatch[1];
      const value = kvMatch[2];
      currentKey = key;

      if (value === "[]") {
        frontmatter[key] = [];
        currentKey = null;
      } else if (value) {
        frontmatter[key] = JSON.parse(value);
        currentKey = null;
      }
      // else: value is empty, expecting array items on next lines
    }
  }

  // Save last array
  if (currentKey && currentArray.length > 0) {
    frontmatter[currentKey] = currentArray;
  }

  return { frontmatter, content: content.trim() };
}

/**
 * Validate frontmatter has all required fields
 */
export function validateFrontmatter(frontmatter: Record<string, unknown>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  const required = ["title", "date", "slug", "locale", "groupId", "tags", "status"];

  for (const field of required) {
    if (!(field in frontmatter)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate locale enum
  if (frontmatter.locale && !["EN", "ZH"].includes(frontmatter.locale as string)) {
    errors.push(`Invalid locale: ${frontmatter.locale}. Must be "EN" or "ZH"`);
  }

  // Validate status enum
  if (frontmatter.status && !["PUBLISHED", "DRAFT"].includes(frontmatter.status as string)) {
    errors.push(`Invalid status: ${frontmatter.status}. Must be "PUBLISHED" or "DRAFT"`);
  }

  // Validate date format
  if (frontmatter.date) {
    const date = new Date(frontmatter.date as string);
    if (isNaN(date.getTime())) {
      errors.push(`Invalid date format: ${frontmatter.date}`);
    }
  }

  // Validate tags is array
  if (frontmatter.tags && !Array.isArray(frontmatter.tags)) {
    errors.push(`Invalid tags: must be an array`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

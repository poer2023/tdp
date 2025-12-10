import { PostLocale, PostStatus, type Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { parseMarkdown, validateFrontmatter } from "@/lib/content-export";
import { serializeTags } from "@/lib/posts";
import JSZip from "jszip";
import { toPinyinString } from "@/lib/pinyin";

export type ImportResult = {
  dryRun: boolean;
  summary: {
    created: number;
    updated: number;
    skipped: number;
    errors: number;
  };
  details: ImportDetail[];
};

export type ImportDetail = {
  filename: string;
  action: "create" | "update" | "skip" | "error";
  post?: {
    title: string;
    slug: string;
    locale: PostLocale;
    status: PostStatus;
  };
  error?: string;
  warnings?: string[];
};

type ParsedPost = {
  filename: string;
  frontmatter: Record<string, unknown>;
  content: string;
};

/**
 * Import content from zip bundle (dry-run or apply)
 */
export async function importContent(
  zipBuffer: Buffer,
  options: { dryRun: boolean; adminId: string }
): Promise<ImportResult> {
  const { dryRun, adminId } = options;

  // Parse zip file
  const zip = new JSZip();
  await zip.loadAsync(zipBuffer);

  // Extract and parse Markdown files
  const parsedPosts: ParsedPost[] = [];
  const details: ImportDetail[] = [];

  // Process ALL .md files in the zip (not just content/en/ and content/zh/)
  const allFiles = Object.keys(zip.files).filter(
    (path) => path.endsWith(".md") && !zip.files[path]?.dir
  );

  // Check for empty zip or no markdown files
  if (allFiles.length === 0) {
    return {
      dryRun,
      summary: { created: 0, updated: 0, skipped: 0, errors: 0 },
      details: [
        {
          filename: "N/A",
          action: "error",
          error: "No markdown files found in zip archive",
        },
      ],
    };
  }

  for (const filepath of allFiles) {
    const file = zip.files[filepath];
    if (!file || file.dir) continue;

    const filename = filepath.split("/").pop() || filepath;

    try {
      const content = await file.async("string");
      const { frontmatter, content: body } = parseMarkdown(content);

      // Validate frontmatter
      const validation = validateFrontmatter(frontmatter);
      if (!validation.valid) {
        details.push({
          filename,
          action: "error",
          error: `Invalid frontmatter: ${validation.errors.join(", ")}`,
        });
        continue;
      }

      // Validate locale field is present
      if (!frontmatter.locale || (frontmatter.locale !== "EN" && frontmatter.locale !== "ZH")) {
        details.push({
          filename,
          action: "error",
          error: `Invalid or missing locale field. Expected EN or ZH, got: ${frontmatter.locale}`,
        });
        continue;
      }

      parsedPosts.push({
        filename,
        frontmatter,
        content: body,
      });
    } catch (error) {
      details.push({
        filename,
        action: "error",
        error: error instanceof Error ? error.message : "Parse error",
      });
    }
  }

  // Process each post
  let created = 0;
  let updated = 0;
  const skipped = 0;

  for (const parsed of parsedPosts) {
    const { filename, frontmatter, content } = parsed;

    try {
      const locale = frontmatter.locale as PostLocale;
      const groupId = frontmatter.groupId as string | null;
      let slug = frontmatter.slug as string;

      // Auto-generate pinyin slug for Chinese posts if missing
      if (!slug && locale === PostLocale.ZH) {
        slug = await generatePinyinSlug(frontmatter.title as string, locale);
      }

      if (!slug) {
        details.push({
          filename,
          action: "error",
          error: "Missing slug and could not auto-generate",
        });
        continue;
      }

      // Check for existing post
      const existing = await findExistingPost(groupId, locale, slug);

      if (existing) {
        // Update existing post
        if (!dryRun) {
          await updatePost(existing.id, frontmatter, content, adminId);
        }
        details.push({
          filename,
          action: "update",
          post: {
            title: frontmatter.title as string,
            slug,
            locale,
            status: frontmatter.status as PostStatus,
          },
        });
        updated++;
      } else {
        // Create new post
        if (!dryRun) {
          await createPost(frontmatter, content, slug, adminId);
        }
        details.push({
          filename,
          action: "create",
          post: {
            title: frontmatter.title as string,
            slug,
            locale,
            status: frontmatter.status as PostStatus,
          },
        });
        created++;
      }
    } catch (error) {
      const errorDetail: ImportDetail = {
        filename,
        action: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      };
      details.push(errorDetail);
    }
  }

  // Count errors from details (includes parsing errors AND processing errors)
  const errors = details.filter((d) => d.action === "error").length;

  return {
    dryRun,
    summary: { created, updated, skipped, errors },
    details,
  };
}

/**
 * Find existing post by matching rules
 */
async function findExistingPost(
  groupId: string | null,
  locale: PostLocale,
  slug: string
): Promise<{ id: string } | null> {
  // Match by (groupId, locale) if groupId exists
  if (groupId) {
    const post = await prisma.post.findFirst({
      where: { groupId, locale },
      select: { id: true },
    });
    if (post) return post;
  }

  // Match by (locale, slug)
  const post = await prisma.post.findUnique({
    where: { locale_slug: { locale, slug } },
    select: { id: true },
  });

  return post;
}

/**
 * Generate unique pinyin slug for Chinese text
 */
async function generatePinyinSlug(title: string, locale: PostLocale): Promise<string> {
  let pinyinText = title;
  try {
    pinyinText = await toPinyinString(title, {
      toneType: "none",
      separator: "-",
      type: "string",
      v: true,
    });
  } catch {
    // Fallback to original title if pinyin conversion fails (should not happen in Node runtime)
    pinyinText = title;
  }

  let baseSlug = pinyinText
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!baseSlug) {
    baseSlug = `post-${Date.now()}`;
  }

  // Check for duplicates
  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    const existing = await prisma.post.findFirst({
      where: { locale, slug: candidate },
    });

    if (!existing) return candidate;

    candidate = `${baseSlug}-${suffix}`;
    suffix++;
  }
}

/**
 * Create new post from frontmatter
 */
async function createPost(
  frontmatter: Record<string, unknown>,
  content: string,
  slug: string,
  adminId: string
): Promise<void> {
  const locale = frontmatter.locale as PostLocale;
  const status = frontmatter.status as PostStatus;
  const tags = frontmatter.tags as string[];

  const data: Prisma.PostCreateInput = {
    title: frontmatter.title as string,
    slug,
    excerpt: (frontmatter.excerpt as string) || "",
    content,
    tags: serializeTags(tags),
    locale,
    groupId: (frontmatter.groupId as string) || null,
    status,
    coverImagePath: frontmatter.cover ? convertToAbsolutePath(frontmatter.cover as string) : null,
    publishedAt:
      status === PostStatus.PUBLISHED
        ? new Date((frontmatter.publishedAt as string) || (frontmatter.date as string))
        : null,
    author: {
      connect: {
        id: (frontmatter.author as string) || adminId,
      },
    },
  };

  await prisma.post.create({ data });
}

/**
 * Update existing post from frontmatter
 */
async function updatePost(
  postId: string,
  frontmatter: Record<string, unknown>,
  content: string,
  _adminId?: string
): Promise<void> {
  const status = frontmatter.status as PostStatus;
  const tags = frontmatter.tags as string[];

  const data: Prisma.PostUpdateInput = {
    title: frontmatter.title as string,
    excerpt: (frontmatter.excerpt as string) || "",
    content,
    tags: serializeTags(tags),
    groupId: (frontmatter.groupId as string) || null,
    status,
    coverImagePath: frontmatter.cover ? convertToAbsolutePath(frontmatter.cover as string) : null,
    publishedAt:
      status === PostStatus.PUBLISHED
        ? new Date((frontmatter.publishedAt as string) || (frontmatter.date as string))
        : null,
  };

  await prisma.post.update({
    where: { id: postId },
    data,
  });
}

/**
 * Convert relative path to absolute path
 * "../uploads/image.jpg" -> "/uploads/image.jpg"
 */
function convertToAbsolutePath(relativePath: string): string {
  const cleaned = relativePath.replace(/^\.\.\/uploads\//, "/uploads/");
  return cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
}

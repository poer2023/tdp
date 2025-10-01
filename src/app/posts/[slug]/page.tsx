import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PostLocale, PostStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { generateBlogPostingSchema, generateAlternateLinks } from "@/lib/seo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LikeButton } from "@/components/like-button";
import { CommentsSection } from "@/components/comments-section";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const slug = safeDecode(params.slug);
  const post = await prisma.post.findUnique({
    where: {
      locale_slug: {
        locale: PostLocale.EN,
        slug,
      },
      status: PostStatus.PUBLISHED,
    },
  });

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  // Find alternate language version
  let alternateSlug: string | undefined;
  if (post.groupId) {
    const alternatePost = await prisma.post.findFirst({
      where: {
        groupId: post.groupId,
        locale: PostLocale.ZH,
      },
      select: { slug: true },
    });
    alternateSlug = alternatePost?.slug;
  }

  const url = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/posts/${slug}`;
  const alternateLinks = generateAlternateLinks(PostLocale.EN, slug, alternateSlug);

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.coverImagePath ? [post.coverImagePath] : undefined,
    },
    alternates: {
      languages: alternateLinks,
    },
  };
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const slug = safeDecode(params.slug);
  const post = await prisma.post.findUnique({
    where: {
      locale_slug: {
        locale: PostLocale.EN,
        slug,
      },
      status: PostStatus.PUBLISHED,
    },
    include: {
      author: {
        select: {
          name: true,
          image: true,
        },
      },
    },
  });

  if (!post) {
    notFound();
  }

  const formatted = post.publishedAt
    ? new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(post.publishedAt))
    : "Draft";

  const url = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/posts/${slug}`;
  const schema = generateBlogPostingSchema(post, url);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <div className="mx-auto max-w-3xl space-y-10 px-6 py-12 sm:px-8">
        {/* Language Switcher */}
        <div className="mb-8">
          <LanguageSwitcher
            currentLocale={PostLocale.EN}
            currentSlug={post.slug}
            groupId={post.groupId}
          />
        </div>

        <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
          <Link
            href="/"
            className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400"
          >
            ← Back to Home
          </Link>
          <time dateTime={post.publishedAt?.toISOString() ?? ""}>{formatted}</time>
        </div>

        <article className="space-y-8">
          <header className="space-y-6">
            <div className="space-y-3 text-center">
              <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">{post.title}</h1>
              <p className="text-base text-zinc-500 dark:text-zinc-400">{post.excerpt}</p>
            </div>
            {post.coverImagePath && (
              <div className="relative overflow-hidden rounded-3xl border border-zinc-200/70 bg-zinc-100 dark:border-zinc-800/70 dark:bg-zinc-900">
                <div className="relative aspect-[16/9]">
                  <Image
                    src={post.coverImagePath}
                    alt={post.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 768px"
                    className="object-cover"
                  />
                </div>
              </div>
            )}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap justify-center gap-3 text-sm">
                {post.tags.split(",").map((tag) => (
                  <span
                    key={`${post.id}-${tag}`}
                    className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-600 dark:bg-blue-950/50 dark:text-blue-300"
                  >
                    #{tag.trim()}
                  </span>
                ))}
              </div>
            )}
          </header>

          <div className="prose prose-zinc dark:prose-invert mx-auto max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
          </div>

          {/* Engagement Section */}
          <div className="mt-12 border-t border-zinc-200 pt-8 dark:border-zinc-800">
            <LikeButton slug={slug} locale="EN" />
          </div>
        </article>

        {/* Comments Section */}
        <CommentsSection slug={slug} locale="EN" />
      </div>
    </>
  );
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

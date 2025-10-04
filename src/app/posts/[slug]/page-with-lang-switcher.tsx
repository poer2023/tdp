import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { PostLocale, PostStatus } from "@prisma/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import prisma from "@/lib/prisma";
import { LanguageSwitcher } from "@/components/language-switcher";

// Ensure Node.js runtime for Prisma
export const runtime = "nodejs";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function EnglishPostPage({ params }: PageProps) {
  const { slug } = await params;

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

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      {/* Language Switcher */}
      <div className="mb-8">
        <LanguageSwitcher
          currentLocale={PostLocale.EN}
          currentSlug={post.slug}
          groupId={post.groupId}
        />
      </div>

      {/* Header */}
      <header className="mb-12">
        <h1 className="text-4xl leading-tight font-bold text-zinc-900 md:text-5xl dark:text-zinc-100">
          {post.title}
        </h1>

        {/* Metadata */}
        <div className="mt-6 flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
          {post.author?.name && <span>{post.author.name}</span>}
          {post.publishedAt && (
            <time dateTime={post.publishedAt.toISOString()}>
              {new Date(post.publishedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          )}
          {post.tags && <span className="text-blue-600 dark:text-blue-400">{post.tags}</span>}
        </div>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="mt-6 text-lg text-zinc-600 dark:text-zinc-400">{post.excerpt}</p>
        )}
      </header>

      {/* Cover Image */}
      {post.coverImagePath && (
        <div className="relative mb-12 aspect-video">
          <Image
            src={post.coverImagePath}
            alt={post.title}
            fill
            className="rounded-lg object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="prose prose-zinc dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
      </div>

      {/* Footer */}
      <footer className="mt-16 border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <Link href="/posts" className="text-blue-600 hover:underline dark:text-blue-400">
          ← Back to posts
        </Link>
      </footer>
    </article>
  );
}

export async function generateStaticParams() {
  const posts = await prisma.post.findMany({
    where: {
      locale: PostLocale.EN,
      status: PostStatus.PUBLISHED,
    },
    select: {
      slug: true,
    },
  });

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

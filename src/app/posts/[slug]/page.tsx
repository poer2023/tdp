import LocalizedPostPage, {
  generateMetadata as localizedGenerateMetadata,
} from "../../[locale]/posts/[slug]/page";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { PostLocale, PostStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { cache } from "react";

export const runtime = "nodejs";

type PageProps = {
  params: Promise<{ slug: string }>;
};

const findPostBySlug = cache(async (slug: string, locale: "en" | "zh") => {
  const l = locale === "zh" ? PostLocale.ZH : PostLocale.EN;
  let post = await prisma.post.findFirst({
    where: {
      slug,
      locale: l,
      status: PostStatus.PUBLISHED,
    },
    select: { slug: true },
  });

  if (!post) {
    const alias = await prisma.postAlias.findUnique({
      where: {
        locale_oldSlug: {
          locale: l,
          oldSlug: slug,
        },
      },
      select: {
        post: { select: { slug: true, status: true } },
      },
    });
    if (alias?.post && alias.post.status === PostStatus.PUBLISHED) {
      post = { slug: alias.post.slug };
    }
  }

  return post ? { locale, slug: post.slug } : null;
});

const resolvePostLocale = cache(async (slug: string) => {
  const en = await findPostBySlug(slug, "en");
  if (en) return en;
  return findPostBySlug(slug, "zh");
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await resolvePostLocale(slug);
  if (!resolved) {
    return { title: "Post Not Found" };
  }
  return localizedGenerateMetadata({
    params: Promise.resolve({ slug: resolved.slug, locale: resolved.locale }),
  });
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const resolved = await resolvePostLocale(slug);

  if (!resolved) {
    notFound();
  }

  if (resolved.locale === "zh") {
    permanentRedirect(`/zh/posts/${slug}`);
  }

  const paramsWithLocale = Promise.resolve({ slug, locale: "en" });
  return <LocalizedPostPage params={paramsWithLocale as any} />;
}

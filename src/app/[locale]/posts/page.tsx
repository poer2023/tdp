import { notFound } from "next/navigation";
import { listPublishedPosts, toBlog8Post } from "@/lib/posts";
import { Blog8 } from "@/components/ui/blog8";

// Querying Prisma – lock runtime to Node.js
export const runtime = "nodejs";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LocalizedPostsPage({ params }: PageProps) {
  const { locale } = await params;

  // Validate locale
  const normalizedLocale = locale.toUpperCase();
  if (normalizedLocale !== "EN" && normalizedLocale !== "ZH") {
    notFound();
  }

  const l = locale === "zh" ? "zh" : "en";
  const isZh = l === "zh";

  // Fetch all published posts via shared lib (supports E2E fallback)
  const allPosts = await listPublishedPosts();

  // Convert posts to Blog8 format
  const blog8Posts = allPosts.map((post) => toBlog8Post(post, l));

  // Prepare i18n content
  const heading = isZh ? "故事" : "Stories";
  const description = isZh
    ? "探索关于现代 Web 开发、UI 设计和组件驱动架构的最新见解与教程。"
    : "Discover the latest insights and tutorials about modern web development, UI design, and component-driven architecture.";

  return (
    <Blog8
      heading={heading}
      description={description}
      posts={blog8Posts}
      locale={l}
    />
  );
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}

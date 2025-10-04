import { notFound } from "next/navigation";
import Link from "next/link";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LocalizedHomePage({ params }: PageProps) {
  const { locale } = await params;

  // Validate locale
  if (locale !== "zh") {
    notFound();
  }

  // Redirect to localized posts page for now
  // In the future, this could be a localized home page
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">中文首页</h1>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">欢迎访问中文版本</p>
      <Link
        href="/zh/posts"
        className="mt-6 inline-block text-blue-600 hover:underline dark:text-blue-400"
      >
        查看文章列表 →
      </Link>
    </div>
  );
}

export function generateStaticParams() {
  return [{ locale: "zh" }];
}

import Link from "next/link";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LocalizedHomePage({ params }: PageProps) {
  const { locale } = await params;

  // Support both en and zh locales
  const l = locale === "zh" ? "zh" : "en";

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">
        {l === "zh" ? "首页" : "Home"}
      </h1>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">
        {l === "zh" ? "欢迎访问中文版本" : "Welcome to the English version"}
      </p>
      <Link
        href={`/${l}/posts`}
        className="mt-6 inline-block text-blue-600 hover:underline dark:text-blue-400"
      >
        {l === "zh" ? "查看文章列表 →" : "Browse posts →"}
      </Link>
    </div>
  );
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}

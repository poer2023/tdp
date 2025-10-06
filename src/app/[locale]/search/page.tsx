import { notFound } from "next/navigation";
import Link from "next/link";
import { searchPosts } from "@/lib/search";

export const runtime = "nodejs";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ q?: string }>;
};

export default async function LocalizedSearchPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const s = (await searchParams) || {};
  const q = (s.q || "").trim();

  const normalizedLocale = locale.toUpperCase();
  if (normalizedLocale !== "EN" && normalizedLocale !== "ZH") {
    notFound();
  }

  const isZh = locale === "zh";

  let results: Awaited<ReturnType<typeof searchPosts>> = [];
  if (q) {
    results = await searchPosts(q, { locale: normalizedLocale as "EN" | "ZH", limit: 50 });
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          {isZh ? "搜索" : "Search"}
        </h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          {q
            ? isZh
              ? `关于 “${q}” 的结果：${results.length} 条`
              : `Results for "${q}": ${results.length}`
            : isZh
              ? "请输入关键词"
              : "Enter a query"}
        </p>
      </header>

      {q && results.length === 0 ? (
        <p className="text-zinc-500 dark:text-zinc-400">
          {isZh ? "未找到相关内容" : "No results found"}
        </p>
      ) : null}

      {results.length > 0 ? (
        <div className="space-y-10">
          {results.map((r) => (
            <article key={r.id} className="border-b border-zinc-200 pb-8 dark:border-zinc-800">
              <Link href={`/${locale}/posts/${r.slug}`} className="group">
                <h2 className="text-2xl font-semibold text-zinc-900 group-hover:text-blue-600 dark:text-zinc-100 dark:group-hover:text-blue-400">
                  {r.title}
                </h2>
              </Link>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">{r.excerpt}</p>
              <div className="mt-3 flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
                {r.authorName && <span>{r.authorName}</span>}
                {r.publishedAt && (
                  <time dateTime={r.publishedAt}>
                    {new Date(r.publishedAt).toLocaleDateString(isZh ? "zh-CN" : "en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}

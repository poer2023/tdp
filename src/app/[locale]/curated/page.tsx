import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Link2, Heart } from "lucide-react";
import { listCuratedItems } from "@/lib/curated";
import { ZhiHeader, ZhiFooter } from "@/components/zhi";
import { localePath } from "@/lib/locale-path";

// Querying Prisma – lock runtime to Node.js
export const runtime = "nodejs";
// ISR: Revalidate every 5 minutes
export const revalidate = 300;

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const isZh = locale === "zh";

  return {
    title: isZh ? "精选" : "Curated",
    description: isZh
      ? "精心挑选的优质链接、工具和资源"
      : "Hand-picked quality links, tools, and resources",
    openGraph: {
      title: isZh ? "精选" : "Curated",
      description: isZh
        ? "精心挑选的优质链接、工具和资源"
        : "Hand-picked quality links, tools, and resources",
    },
  };
}

export default async function CuratedListPage({ params }: PageProps) {
  const { locale } = await params;

  // Validate locale
  if (locale !== "en" && locale !== "zh") {
    notFound();
  }

  const isZh = locale === "zh";

  // Fetch curated items (cached)
  const items = await listCuratedItems(50);

  const t = {
    heading: isZh ? "精选" : "Curated",
    description: isZh
      ? "精心挑选的优质链接、工具和资源"
      : "Hand-picked quality links, tools, and resources",
    noItems: isZh ? "暂无内容" : "No items yet",
    likes: isZh ? "喜欢" : "likes",
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(isZh ? "zh-CN" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      <ZhiHeader />
      <main className="min-h-screen bg-stone-50 dark:bg-[#0a0a0b]">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-3xl font-bold text-stone-900 sm:text-4xl dark:text-stone-100">
              {t.heading}
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-stone-600 dark:text-stone-400">
              {t.description}
            </p>
          </div>

          {/* Items Grid */}
          {items.length === 0 ? (
            <div className="py-20 text-center text-stone-500 dark:text-stone-400">
              {t.noItems}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <Link
                  key={item.id}
                  href={localePath(locale, `/curated/${item.id}`)}
                  className="group cursor-pointer overflow-hidden rounded-xl border border-stone-200 bg-white transition-all hover:shadow-lg dark:border-stone-800 dark:bg-stone-900"
                >
                  {/* Image */}
                  {item.imageUrl ? (
                    <div className="relative h-40 w-full overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-stone-700 backdrop-blur-sm dark:bg-black/70 dark:text-stone-300">
                        <Link2 size={10} />
                        {item.domain}
                      </div>
                    </div>
                  ) : (
                    <div className="relative flex h-40 items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-900">
                      <div
                        className="absolute inset-0 opacity-20"
                        style={{
                          backgroundImage:
                            "radial-gradient(#888 1px, transparent 1px)",
                          backgroundSize: "20px 20px",
                        }}
                      />
                      <ExternalLink
                        className="text-stone-300 dark:text-stone-600"
                        size={48}
                      />
                      <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full border border-stone-300 bg-white/80 px-2 py-1 text-xs font-medium text-stone-600 backdrop-blur-sm dark:border-stone-600 dark:bg-black/50 dark:text-stone-400">
                        <Link2 size={10} />
                        {item.domain}
                      </div>
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-4">
                    <h2 className="mb-2 line-clamp-2 font-semibold text-stone-800 transition-colors group-hover:text-sage-600 dark:text-stone-200 dark:group-hover:text-sage-400">
                      {item.title}
                    </h2>
                    {item.description && (
                      <p className="mb-3 line-clamp-2 text-sm text-stone-500 dark:text-stone-400">
                        {item.description}
                      </p>
                    )}

                    {/* Tags */}
                    {item.tags.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-1">
                        {item.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600 dark:bg-stone-800 dark:text-stone-400"
                          >
                            #{tag}
                          </span>
                        ))}
                        {item.tags.length > 3 && (
                          <span className="text-xs text-stone-400">
                            +{item.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Meta */}
                    <div className="flex items-center justify-between text-xs text-stone-400 dark:text-stone-500">
                      <span>{formatDate(item.createdAt)}</span>
                      <div className="flex items-center gap-1">
                        <Heart
                          size={12}
                          className={item.likes > 0 ? "text-rose-500" : ""}
                        />
                        <span>
                          {item.likes} {t.likes}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <ZhiFooter />
    </>
  );
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "zh" }];
}

"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/container";
import { LanguageBadge } from "@/components/ui/language-badge";
import { SearchResultSkeleton } from "@/components/search/search-skeleton";
import { SearchEmptyState } from "@/components/search/search-empty-state";
import { addToSearchHistory } from "@/lib/search-history";
import type { SearchResult, GallerySearchResult, MomentSearchResult } from "@/lib/search";
import { ZhiHeader, ZhiFooter } from "@/components/zhi";
import { localePath } from "@/lib/locale-path";

type SearchResults = {
    posts: SearchResult[];
    images: GallerySearchResult[];
    moments: MomentSearchResult[];
};

export function SearchPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const initialQuery = searchParams.get("q") || "";

    const [query, setQuery] = useState(initialQuery);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<SearchResults>({ posts: [], images: [], moments: [] });

    const locale = useMemo(() => {
        const segments = pathname.split("/").filter(Boolean);
        return segments[0] === "zh" ? "zh" : "en";
    }, [pathname]);

    const isZh = locale === "zh";
    const serverLocale = (locale === "zh" ? "ZH" : "EN") as "EN" | "ZH";

    // Perform search
    useEffect(() => {
        const q = query.trim();
        if (!q) {
            setResults({ posts: [], images: [], moments: [] });
            return;
        }

        const ctrl = new AbortController();
        setLoading(true);

        const timer = setTimeout(async () => {
            try {
                const res = await fetch(
                    `/api/search?q=${encodeURIComponent(q)}&locale=${serverLocale}&mode=full`,
                    { signal: ctrl.signal }
                );
                if (!res.ok) throw new Error("Search failed");
                const data = await res.json();
                setResults({
                    posts: data.posts || [],
                    images: data.images || [],
                    moments: data.moments || [],
                });

                // Save to search history
                addToSearchHistory(q);
            } catch (e) {
                if (!(e instanceof DOMException && e.name === "AbortError")) {
                    setResults({ posts: [], images: [], moments: [] });
                }
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => {
            ctrl.abort();
            clearTimeout(timer);
        };
    }, [query, serverLocale]);

    // Sync query with URL
    const handleSearch = (value: string) => {
        setQuery(value);
        const params = new URLSearchParams(searchParams);
        if (value.trim()) {
            params.set("q", value.trim());
        } else {
            params.delete("q");
        }
        router.replace(`${pathname}?${params.toString()}`);
    };

    const totalResults = results.posts.length + results.images.length + results.moments.length;

    return (
        <>
            <ZhiHeader />
            <Container width="standard" padding="px-4 py-6 sm:px-6 sm:py-8 md:py-10">
                {/* Breadcrumbs */}
                <nav
                    className="mb-4 flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400"
                    aria-label={isZh ? "面包屑导航" : "Breadcrumb navigation"}
                >
                    <Link
                        href={localePath(locale as "en" | "zh", "/")}
                        className="hover:text-stone-900 dark:hover:text-stone-100"
                    >
                        {isZh ? "首页" : "Home"}
                    </Link>
                    <span aria-hidden="true">/</span>
                    <span className="text-stone-900 dark:text-stone-100" aria-current="page">
                        {isZh ? "搜索" : "Search"}
                    </span>
                </nav>

                {/* Header with inline search */}
                <header className="mb-6 sm:mb-8">
                    <h1 className="mb-4 text-2xl font-bold text-stone-900 sm:text-3xl dark:text-stone-100">
                        {isZh ? "搜索" : "Search"}
                    </h1>

                    {/* Inline search input */}
                    <div className="relative" role="search">
                        <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm dark:border-stone-800 dark:bg-stone-900">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="h-5 w-5 text-stone-500"
                            >
                                <circle cx="11" cy="11" r="7"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder={isZh ? "搜索文章、图片、动态..." : "Search posts, images, moments..."}
                                aria-label={isZh ? "搜索输入框" : "Search input"}
                                role="searchbox"
                                className="flex-1 bg-transparent text-base text-stone-900 placeholder:text-stone-400 focus:outline-none dark:text-stone-100 dark:placeholder:text-stone-500"
                                autoFocus
                            />
                            {query && (
                                <button
                                    type="button"
                                    onClick={() => handleSearch("")}
                                    aria-label={isZh ? "清空搜索" : "Clear search"}
                                    className="rounded p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-stone-800"
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        className="h-4 w-4"
                                    >
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Result count */}
                    {query && (
                        <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">
                            {loading
                                ? isZh
                                    ? "搜索中..."
                                    : "Searching..."
                                : totalResults > 0
                                    ? isZh
                                        ? `找到 ${totalResults} 个结果`
                                        : `Found ${totalResults} results`
                                    : query.trim()
                                        ? isZh
                                            ? "未找到结果"
                                            : "No results found"
                                        : null}
                        </p>
                    )}
                </header>

                {/* Results */}
                <div className="space-y-8">
                    {loading ? (
                        <div className="space-y-4">
                            <SearchResultSkeleton />
                            <SearchResultSkeleton />
                            <SearchResultSkeleton />
                        </div>
                    ) : query.trim() && totalResults === 0 ? (
                        <SearchEmptyState query={query} locale={locale} />
                    ) : (
                        <>
                            {/* Posts section */}
                            {results.posts.length > 0 && (
                                <section>
                                    <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-stone-900 dark:text-stone-100">
                                        <span>📝</span>
                                        <span>{isZh ? "文章" : "Posts"}</span>
                                        <span className="text-sm font-normal text-stone-500">
                                            ({results.posts.length})
                                        </span>
                                    </h2>
                                    <div className="space-y-6">
                                        {results.posts.map((post) => (
                                            <article
                                                key={post.id}
                                                className="border-b border-stone-200 pb-6 last:border-0 dark:border-stone-800"
                                            >
                                                <Link
                                                    href={localePath(locale as "en" | "zh", `/posts/${post.slug}`)}
                                                    className="group block"
                                                >
                                                    <h3 className="text-xl font-semibold text-stone-900 group-hover:text-blue-600 dark:text-stone-100 dark:group-hover:text-blue-400">
                                                        {post.title}
                                                    </h3>
                                                    <p className="mt-2 line-clamp-2 text-stone-600 dark:text-stone-400">
                                                        {post.excerpt}
                                                    </p>
                                                    <div className="mt-3 flex items-center gap-3 text-sm text-stone-500 dark:text-stone-400">
                                                        <LanguageBadge locale={post.locale} />
                                                        {post.publishedAt && (
                                                            <>
                                                                <span className="text-stone-300 dark:text-stone-700">·</span>
                                                                <span className="flex items-center gap-1">
                                                                    <span>📅</span>
                                                                    <time dateTime={post.publishedAt}>
                                                                        {new Date(post.publishedAt).toLocaleDateString(
                                                                            isZh ? "zh-CN" : "en-US",
                                                                            { year: "numeric", month: "short", day: "numeric" }
                                                                        )}
                                                                    </time>
                                                                </span>
                                                            </>
                                                        )}
                                                        {post.authorName && (
                                                            <>
                                                                <span className="text-stone-300 dark:text-stone-700">·</span>
                                                                <span className="flex items-center gap-1">
                                                                    <span>👤</span>
                                                                    <span>{post.authorName}</span>
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </Link>
                                            </article>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Images section */}
                            {results.images.length > 0 && (
                                <section>
                                    <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-stone-900 dark:text-stone-100">
                                        <span>🖼️</span>
                                        <span>{isZh ? "图片" : "Images"}</span>
                                        <span className="text-sm font-normal text-stone-500">
                                            ({results.images.length})
                                        </span>
                                    </h2>
                                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                                        {results.images.map((image) => (
                                            <a
                                                key={image.id}
                                                href={`/gallery#${image.id}`}
                                                className="group relative aspect-square overflow-hidden rounded-lg bg-stone-100 dark:bg-stone-800"
                                            >
                                                {image.smallThumbPath && (
                                                    <Image
                                                        src={image.smallThumbPath}
                                                        alt={image.title || "Gallery image"}
                                                        fill
                                                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                                                        className="object-cover transition-transform duration-200 group-hover:scale-105"
                                                    />
                                                )}
                                            </a>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Moments section */}
                            {results.moments.length > 0 && (
                                <section>
                                    <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-stone-900 dark:text-stone-100">
                                        <span>💬</span>
                                        <span>{isZh ? "动态" : "Moments"}</span>
                                        <span className="text-sm font-normal text-stone-500">
                                            ({results.moments.length})
                                        </span>
                                    </h2>
                                    <div className="space-y-4">
                                        {results.moments.map((moment) => (
                                            <article
                                                key={moment.id}
                                                className="rounded-lg border border-stone-200 p-4 hover:bg-stone-50 dark:border-stone-800 dark:hover:bg-stone-900"
                                            >
                                                <a
                                                    href={`/moments${moment.slug ? `/${moment.slug}` : `#${moment.id}`}`}
                                                    className="block"
                                                >
                                                    <p className="text-stone-900 dark:text-stone-100">{moment.content}</p>
                                                    <div className="mt-2 flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
                                                        {moment.tags.length > 0 && (
                                                            <span className="flex items-center gap-1">
                                                                🏷️ {moment.tags.slice(0, 3).join(", ")}
                                                            </span>
                                                        )}
                                                        <span className="text-stone-300 dark:text-stone-700">·</span>
                                                        <span>
                                                            {new Date(moment.createdAt).toLocaleDateString(
                                                                isZh ? "zh-CN" : "en-US",
                                                                { month: "short", day: "numeric", year: "numeric" }
                                                            )}
                                                        </span>
                                                    </div>
                                                </a>
                                            </article>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </>
                    )}
                </div>

                {/* Empty state when no query */}
                {!query.trim() && !loading && (
                    <div className="py-12 text-center text-stone-500 dark:text-stone-400">
                        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-stone-100 text-4xl dark:bg-stone-800">
                            🔍
                        </div>
                        <p className="text-lg font-medium">
                            {isZh ? "输入关键词开始搜索" : "Enter keywords to start searching"}
                        </p>
                        <p className="mt-2 text-sm">
                            {isZh ? "搜索文章、图片和动态内容" : "Search posts, images, and moments"}
                        </p>
                    </div>
                )}
            </Container>
            <ZhiFooter />
        </>
    );
}

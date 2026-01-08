"use client";

import Image from "next/image";
import { localePath, type PublicLocale } from "@/lib/locale-path";
import { LanguageBadge } from "@/components/ui/language-badge";
import type { SearchResultsContainerProps } from "../types";

export function SearchResultsContainer({
    results,
    locale,
    variant = "desktop",
}: SearchResultsContainerProps) {
    const isMobile = variant === "mobile";
    const paddingX = isMobile ? "px-4" : "px-3";
    const textSize = isMobile ? "text-base" : "text-sm";
    const padding = isMobile ? "py-3" : "py-2.5";

    return (
        <div>
            {/* Posts section */}
            {results.posts.length > 0 && (
                <div className="mb-2">
                    <div
                        className={`mb-1.5 ${paddingX} pt-2 text-[10px] font-semibold tracking-wider text-stone-500 uppercase dark:text-stone-400`}
                    >
                        📝 {locale === "zh" ? "文章" : "Posts"} ({results.posts.length})
                    </div>
                    <ul>
                        {results.posts.map((post) => (
                            <li key={post.id}>
                                <a
                                    href={localePath(locale, `/posts/${post.slug}`)}
                                    className={`block ${paddingX} ${padding} ${textSize} text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800`}
                                >
                                    <div className="font-medium text-stone-900 dark:text-stone-100">{post.title}</div>
                                    <div className="line-clamp-1 text-xs text-stone-500 dark:text-stone-400">
                                        {post.excerpt}
                                    </div>
                                    <div className="mt-1.5 flex items-center gap-2 text-xs text-stone-500 dark:text-stone-500">
                                        <LanguageBadge locale={post.locale} />
                                        {post.publishedAt && (
                                            <>
                                                <span className="text-stone-300 dark:text-stone-700">·</span>
                                                <span className="flex items-center gap-1">
                                                    <span>📅</span>
                                                    {new Date(post.publishedAt).toLocaleDateString(
                                                        locale === "zh" ? "zh-CN" : "en-US",
                                                        { year: "numeric", month: "short", day: "numeric" }
                                                    )}
                                                </span>
                                            </>
                                        )}
                                        {post.authorName && (
                                            <>
                                                <span className="text-stone-300 dark:text-stone-700">·</span>
                                                <span className="flex items-center gap-1">
                                                    <span>👤</span>
                                                    {post.authorName}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Images section */}
            {results.images.length > 0 && (
                <div className="mb-2">
                    <div
                        className={`mb-1.5 ${paddingX} pt-2 text-[10px] font-semibold tracking-wider text-stone-500 uppercase dark:text-stone-400`}
                    >
                        🖼️ {locale === "zh" ? "图片" : "Images"} ({results.images.length})
                    </div>
                    <div className={`grid grid-cols-3 gap-2 ${paddingX}`}>
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
                                        sizes="33vw"
                                        className="object-cover transition-transform duration-200 group-hover:scale-105"
                                    />
                                )}
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Moments section */}
            {results.moments.length > 0 && (
                <div className="mb-2">
                    <div
                        className={`mb-1.5 ${paddingX} pt-2 text-[10px] font-semibold tracking-wider text-stone-500 uppercase dark:text-stone-400`}
                    >
                        💬 {locale === "zh" ? "动态" : "Moments"} ({results.moments.length})
                    </div>
                    <ul>
                        {results.moments.map((moment) => (
                            <li key={moment.id}>
                                <a
                                    href={`/moments${moment.slug ? `/${moment.slug}` : `#${moment.id}`}`}
                                    className={`block ${paddingX} ${padding} ${textSize} text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800`}
                                >
                                    <div className="line-clamp-2 text-sm text-stone-900 dark:text-stone-100">
                                        {moment.content}
                                    </div>
                                    <div className="mt-1 flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                                        {moment.tags.length > 0 && (
                                            <span className="flex items-center gap-1">
                                                🏷️ {moment.tags.slice(0, 2).join(", ")}
                                            </span>
                                        )}
                                        <span className="text-stone-300 dark:text-stone-700">·</span>
                                        <span>
                                            {new Date(moment.createdAt).toLocaleDateString(
                                                locale === "zh" ? "zh-CN" : "en-US",
                                                { month: "short", day: "numeric" }
                                            )}
                                        </span>
                                    </div>
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

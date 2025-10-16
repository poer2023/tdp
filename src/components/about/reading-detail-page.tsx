"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, FileText, TrendingUp, ExternalLink } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { ReadingData } from "@/types/live-data";
import { StatCard } from "./stat-card";
import { SkeletonCard } from "./skeleton-card";
import { ProgressBar } from "./progress-bar";

interface ReadingDetailPageProps {
  locale: "en" | "zh";
}

export function ReadingDetailPage({ locale }: ReadingDetailPageProps) {
  const [data, setData] = useState<ReadingData | null>(null);
  const [loading, setLoading] = useState(true);

  const t =
    locale === "zh"
      ? {
          title: "阅读记录",
          backToDashboard: "返回仪表盘",
          stats: "统计概览",
          thisMonth: "本月",
          thisYear: "今年",
          allTime: "总计",
          books: "书籍",
          articles: "文章",
          currentlyReading: "正在阅读",
          recentlyFinished: "最近读完",
          recentArticles: "最近文章",
          progress: "进度",
          startedAt: "开始阅读",
          finishedAt: "读完于",
          readAt: "阅读于",
          pages: "页",
        }
      : {
          title: "Reading Activity",
          backToDashboard: "Back to Dashboard",
          stats: "Statistics",
          thisMonth: "This Month",
          thisYear: "This Year",
          allTime: "All Time",
          books: "books",
          articles: "articles",
          currentlyReading: "Currently Reading",
          recentlyFinished: "Recently Finished",
          recentArticles: "Recent Articles",
          progress: "Progress",
          startedAt: "Started",
          finishedAt: "Finished",
          readAt: "Read",
          pages: "pages",
        };

  useEffect(() => {
    fetch("/api/about/live/reading")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 sm:py-12 md:px-12 md:py-16">
        <div className="mb-8">
          <Link
            href={`/${locale}/about/live`}
            className="inline-flex items-center gap-2 text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.backToDashboard}
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-neutral-900 sm:text-4xl dark:text-neutral-100">
            📚 {t.title}
          </h1>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={
              star <= rating ? "text-yellow-500" : "text-neutral-300 dark:text-neutral-700"
            }
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 sm:py-12 md:px-12 md:py-16">
      <div className="mb-8">
        <Link
          href={`/${locale}/about/live`}
          className="inline-flex items-center gap-2 text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.backToDashboard}
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-neutral-900 sm:text-4xl dark:text-neutral-100">
          📚 {t.title}
        </h1>
      </div>

      {/* Statistics */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          {t.stats}
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            icon={<BookOpen className="h-5 w-5" />}
            title={t.thisMonth}
            value={`${data.stats.thisMonth.books} ${t.books}`}
            subtitle={`${data.stats.thisMonth.articles} ${t.articles}`}
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5" />}
            title={t.thisYear}
            value={`${data.stats.thisYear.books} ${t.books}`}
            subtitle={`${data.stats.thisYear.articles} ${t.articles}`}
          />
          <StatCard
            icon={<BookOpen className="h-5 w-5" />}
            title={t.allTime}
            value={`${data.stats.allTime.books} ${t.books}`}
            subtitle={`${data.stats.allTime.articles} ${t.articles}`}
          />
        </div>
      </section>

      {/* Currently Reading */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          {t.currentlyReading}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {data.currentlyReading.map((book) => (
            <div
              key={book.title}
              className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="flex gap-4 p-4">
                {book.cover && (
                  <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded-lg">
                    <Image src={book.cover} alt={book.title} fill className="object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="mb-1 font-semibold text-neutral-900 dark:text-neutral-100">
                    {book.title}
                  </h3>
                  <p className="mb-3 text-sm text-neutral-500 dark:text-neutral-400">
                    {book.author}
                  </p>
                  {book.progress !== undefined && (
                    <div className="mb-2">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-neutral-600 dark:text-neutral-400">{t.progress}</span>
                        <span className="font-medium text-neutral-900 dark:text-neutral-100">
                          {book.currentPage} / {book.totalPages} {t.pages}
                        </span>
                      </div>
                      <ProgressBar progress={book.progress} color="purple" />
                    </div>
                  )}
                  {book.startedAt && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {t.startedAt} {formatDate(book.startedAt)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recently Finished */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          {t.recentlyFinished}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {data.recentlyFinished.map((book) => (
            <div
              key={book.title}
              className="group overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
            >
              {book.cover && (
                <div className="relative aspect-[2/3] overflow-hidden">
                  <Image
                    src={book.cover}
                    alt={book.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </div>
              )}
              <div className="p-3">
                <h3 className="mb-1 line-clamp-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {book.title}
                </h3>
                <p className="mb-2 line-clamp-1 text-xs text-neutral-500 dark:text-neutral-400">
                  {book.author}
                </p>
                <div className="flex items-center justify-between">
                  {renderStars(book.rating)}
                  {book.finishedAt && (
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      {formatDate(book.finishedAt)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Articles */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          {t.recentArticles}
        </h2>
        <div className="space-y-2">
          {data.recentArticles.map((article) => (
            <a
              key={article.url + article.readAt}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-3 transition-colors hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20">
                  <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-neutral-900 group-hover:text-purple-600 dark:text-neutral-100 dark:group-hover:text-purple-400">
                    {article.title}
                  </p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">{article.source}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                <span>{formatDate(article.readAt)}</span>
                <ExternalLink className="h-3 w-3" />
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

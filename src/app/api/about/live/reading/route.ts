import { NextResponse } from "next/server";
import type { ReadingData } from "@/types/live-data";

/**
 * GET /api/about/live/reading
 * Returns reading activity data (books and articles)
 */
export async function GET() {
  // TODO: Replace with real Goodreads/Notion/Local data integration
  const data: ReadingData = {
    stats: {
      thisMonth: { books: 2, articles: 15 },
      thisYear: { books: 24, articles: 180 },
      allTime: { books: 156, articles: 890 },
    },
    currentlyReading: [
      {
        title: "System Design Interview – An insider's guide",
        author: "Alex Xu",
        cover: "/images/about/mock-book-1.jpg",
        progress: 65,
        currentPage: 180,
        totalPages: 280,
        startedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Designing Data-Intensive Applications",
        author: "Martin Kleppmann",
        cover: "/images/about/mock-book-2.jpg",
        progress: 30,
        currentPage: 150,
        totalPages: 500,
        startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    ],
    recentlyFinished: [
      {
        title: "Clean Code",
        author: "Robert C. Martin",
        cover: "/images/about/mock-book-3.jpg",
        finishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        rating: 5,
      },
      {
        title: "The Pragmatic Programmer",
        author: "David Thomas, Andrew Hunt",
        cover: "/images/about/mock-book-4.jpg",
        finishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        rating: 5,
      },
      {
        title: "Refactoring",
        author: "Martin Fowler",
        cover: "/images/about/mock-book-5.jpg",
        finishedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        rating: 4,
      },
      {
        title: "Domain-Driven Design",
        author: "Eric Evans",
        cover: "/images/about/mock-book-6.jpg",
        finishedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        rating: 4,
      },
    ],
    recentArticles: [
      {
        title: "React Server Components: The Future of React",
        source: "React Blog",
        url: "https://react.dev",
        readAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Understanding Kubernetes Networking",
        source: "CNCF Blog",
        url: "https://cncf.io",
        readAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        title: "PostgreSQL Performance Tuning Guide",
        source: "PostgreSQL Wiki",
        url: "https://postgresql.org",
        readAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        title: "TypeScript 5.5: New Features",
        source: "TypeScript Blog",
        url: "https://devblogs.microsoft.com",
        readAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Microservices Patterns for Data Consistency",
        source: "Martin Fowler",
        url: "https://martinfowler.com",
        readAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    ],
  };

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
    },
  });
}

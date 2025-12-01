import Image from "next/image";
import React from "react";

export type ChangelogLocale = "en" | "zh";

export type ChangelogEntry = {
  version: string;
  date: string;
  title: string;
  description: string;
  changes: string[];
  images?: string[];
};

export type ChangelogContent = {
  metaTitle: string;
  metaDescription: string;
  pageTitle: string;
  pageSubtitle: string;
  entries: ChangelogEntry[];
};

export const changelogContent: Record<ChangelogLocale, ChangelogContent> = {
  en: {
    metaTitle: "Development Changelog",
    metaDescription:
      "Track the evolution of TDP - from feature launches to infrastructure improvements, documenting the journey of building a personal digital platform.",
    pageTitle: "Development Changelog",
    pageSubtitle:
      "Building in public - tracking features, improvements, and lessons learned along the way.",
    entries: [
      {
        version: "v1.5.0",
        date: "October 2025",
        title: "GitHub Developer Activity Sync",
        description:
          "Integrated GitHub REST API to automatically sync developer activity statistics, contributions, repositories, and coding languages to the live developer dashboard.",
        changes: [
          "✅ Implemented GitHub activity history synchronization",
          "✅ Added real-time developer statistics tracking (commits, PRs, repos, stars)",
          "✅ Integrated 365-day contribution heatmap visualization",
          "✅ Added active repositories and programming languages display",
        ],
        images: [
          "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=500&h=300&fit=crop",
          "https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=500&h=300&fit=crop",
        ],
      },
      {
        version: "v1.4.0",
        date: "January 2025",
        title: "Steam Game Sync Integration",
        description:
          "Integrated Steam Web API to automatically sync game history and playtime statistics to the live dashboard.",
        changes: [
          "✅ Implemented Steam game history synchronization",
          "✅ Added real-time playtime tracking for recently played games",
          "✅ Integrated with existing MediaWatch system",
          "✅ Fixed API endpoint version compatibility issues",
        ],
        images: [
          "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=500&h=300&fit=crop",
          "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&h=300&fit=crop",
        ],
      },
      {
        version: "v1.3.0",
        date: "December 2024",
        title: "Admin Panel Mobile-First Optimization",
        description:
          "Redesigned the admin panel with 2025 best practices, focusing on mobile responsiveness and touch-friendly interactions.",
        changes: [
          "✅ Rebuilt navigation with mobile-first approach",
          "✅ Improved touch target sizes and spacing",
          "✅ Enhanced dark mode consistency",
          "✅ Optimized performance for mobile devices",
        ],
        images: [
          "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=500&h=300&fit=crop",
          "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&h=300&fit=crop",
        ],
      },
      {
        version: "v1.2.0",
        date: "November 2024",
        title: "Internationalization Refactor",
        description:
          "Restructured the entire routing system to support true i18n with locale-specific paths and content.",
        changes: [
          "✅ Migrated to Next.js App Router locale segments",
          "✅ Implemented SSG for zh/en locales",
          "✅ Created centralized translation management",
          "✅ Added locale detection and fallback logic",
        ],
        images: ["https://images.unsplash.com/photo-1557804506-669a67965ba0?w=500&h=300&fit=crop"],
      },
      {
        version: "v1.1.0",
        date: "October 2024",
        title: "Media Sync Platform Integration",
        description:
          "Launched comprehensive media tracking by integrating Bilibili and Douban APIs for automatic content synchronization.",
        changes: [
          "✅ Bilibili video history sync with cookies authentication",
          "✅ Douban movie/book tracking integration",
          "✅ Implemented incremental sync strategy",
          "✅ Built sync job logging and monitoring dashboard",
        ],
        images: [
          "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=500&h=300&fit=crop",
          "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&h=300&fit=crop",
        ],
      },
      {
        version: "v1.0.0",
        date: "September 2024",
        title: "Initial Launch",
        description:
          "Launched the first version of TDP (The Digital Playground) with core blog, gallery, and about features.",
        changes: [
          "✅ Next.js 15 + TypeScript foundation",
          "✅ Markdown-based blog system with MDX support",
          "✅ Photo gallery with EXIF metadata extraction",
          "✅ Dark mode support across all pages",
          "✅ PostgreSQL database with Prisma ORM",
        ],
        images: [
          "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&h=300&fit=crop",
          "https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=500&h=300&fit=crop",
        ],
      },
    ],
  },
  zh: {
    metaTitle: "开发日志",
    metaDescription:
      "记录 TDP 的演进历程 - 从功能上线到基础设施改进,记录构建个人数字平台的每一步探索。",
    pageTitle: "开发日志",
    pageSubtitle: "公开构建 - 记录功能迭代、改进优化和经验教训。",
    entries: [
      {
        version: "v1.5.0",
        date: "2025年10月",
        title: "GitHub 开发者活动同步",
        description:
          "接入 GitHub REST API，自动同步开发者活动统计、贡献记录、仓库信息和编程语言数据到实时开发者动态面板。",
        changes: [
          "✅ 实现 GitHub 活动历史同步功能",
          "✅ 添加实时开发者统计追踪（commits、PRs、repos、stars）",
          "✅ 集成 365 天贡献热力图可视化",
          "✅ 添加活跃仓库和编程语言展示",
        ],
        images: [
          "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=500&h=300&fit=crop",
          "https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=500&h=300&fit=crop",
        ],
      },
      {
        version: "v1.4.0",
        date: "2025年1月",
        title: "Steam 游戏同步集成",
        description: "接入 Steam Web API,自动同步游戏历史记录和游玩时长统计到实时动态面板。",
        changes: [
          "✅ 实现 Steam 游戏历史同步功能",
          "✅ 添加近期游玩游戏的实时游玩时长追踪",
          "✅ 与现有 MediaWatch 系统集成",
          "✅ 修复 API 端点版本兼容性问题",
        ],
        images: [
          "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=500&h=300&fit=crop",
          "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&h=300&fit=crop",
        ],
      },
      {
        version: "v1.3.0",
        date: "2024年12月",
        title: "管理后台移动端优先优化",
        description: "基于 2025 年最佳实践重新设计管理后台,专注于移动端响应式和触控友好交互。",
        changes: [
          "✅ 采用移动端优先方法重构导航系统",
          "✅ 优化触控目标尺寸和间距",
          "✅ 增强暗色模式一致性",
          "✅ 优化移动设备性能",
        ],
        images: [
          "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=500&h=300&fit=crop",
          "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&h=300&fit=crop",
        ],
      },
      {
        version: "v1.2.0",
        date: "2024年11月",
        title: "国际化路由重构",
        description: "重构整个路由系统,支持真正的国际化,实现基于语言的路径和内容管理。",
        changes: [
          "✅ 迁移到 Next.js App Router 语言路由段",
          "✅ 实现中英文静态站点生成 (SSG)",
          "✅ 创建集中式翻译管理系统",
          "✅ 添加语言检测和回退逻辑",
        ],
        images: ["https://images.unsplash.com/photo-1557804506-669a67965ba0?w=500&h=300&fit=crop"],
      },
      {
        version: "v1.1.0",
        date: "2024年10月",
        title: "媒体同步平台集成",
        description: "接入 Bilibili 和豆瓣 API,实现自动内容同步,推出全面的媒体追踪功能。",
        changes: [
          "✅ Bilibili 视频历史同步 (基于 Cookie 认证)",
          "✅ 豆瓣电影/图书追踪集成",
          "✅ 实现增量同步策略",
          "✅ 构建同步任务日志和监控面板",
        ],
        images: [
          "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=500&h=300&fit=crop",
          "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&h=300&fit=crop",
        ],
      },
      {
        version: "v1.0.0",
        date: "2024年9月",
        title: "首次发布",
        description:
          "发布 TDP (The Digital Playground) 第一个版本,包含核心博客、相册和关于页面功能。",
        changes: [
          "✅ Next.js 15 + TypeScript 技术栈",
          "✅ 基于 Markdown 的博客系统 (支持 MDX)",
          "✅ 带 EXIF 元数据提取的照片相册",
          "✅ 全站暗色模式支持",
          "✅ PostgreSQL 数据库 + Prisma ORM",
        ],
        images: [
          "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&h=300&fit=crop",
          "https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=500&h=300&fit=crop",
        ],
      },
    ],
  },
};

export function resolveChangelogLocale(locale: string | undefined): ChangelogLocale {
  return locale === "zh" ? "zh" : "en";
}

// Helper function to generate Timeline data from changelog entries
export function generateTimelineData(entries: ChangelogEntry[]) {
  return entries.map((entry) => ({
    id: `${entry.version}-${entry.date}`,
    title: entry.date,
    content: (
      <div key={`${entry.version}-${entry.date}`}>
        <div className="mb-4">
          <h4 className="mb-1 text-lg font-semibold text-stone-900 md:text-xl dark:text-stone-100">
            {entry.version} - {entry.title}
          </h4>
          <p className="mb-6 text-xs font-normal text-stone-800 md:text-sm dark:text-stone-200">
            {entry.description}
          </p>
        </div>

        <div className="mb-8">
          {entry.changes.map((change) => (
            <div
              key={change}
              className="flex items-center gap-2 text-xs text-stone-700 md:text-sm dark:text-stone-300"
            >
              {change}
            </div>
          ))}
        </div>

        {entry.images && entry.images.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {entry.images.map((imageSrc, idx) => (
              <Image
                key={imageSrc}
                src={imageSrc}
                alt={`${entry.title} screenshot ${idx + 1}`}
                width={500}
                height={300}
                className="h-20 w-full rounded-lg object-cover shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset] md:h-44 lg:h-60"
              />
            ))}
          </div>
        )}
      </div>
    ),
  }));
}

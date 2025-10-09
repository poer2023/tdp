# 超轻量访问统计实现方案

## 方案对比

| 方案             | 免费额度    | 脚本大小 | 隐私友好 | Admin集成 | 推荐度     |
| ---------------- | ----------- | -------- | -------- | --------- | ---------- |
| Umami            | 无限制      | ~2KB     | ✅       | API支持   | ⭐⭐⭐⭐⭐ |
| Vercel Analytics | 2500事件/月 | ~1KB     | ✅       | 需付费    | ⭐⭐⭐⭐   |
| 自建统计         | 无限制      | 0KB      | ✅       | 原生支持  | ⭐⭐⭐⭐   |
| Plausible        | 10K/月      | ~1KB     | ✅       | API支持   | ⭐⭐⭐     |

## 推荐：自建轻量统计系统

### 1. 数据库 Schema

```prisma
// prisma/schema.prisma

model PageView {
  id        String   @id @default(cuid())
  path      String   // 访问路径
  locale    String?  // 语言
  userAgent String?  // 浏览器信息
  referrer  String?  // 来源
  ip        String?  // IP地址（可选，注意隐私）
  createdAt DateTime @default(now())

  @@index([path])
  @@index([createdAt])
}

model UniqueVisitor {
  id          String   @id @default(cuid())
  fingerprint String   @unique // 浏览器指纹
  firstVisit  DateTime @default(now())
  lastVisit   DateTime @updatedAt
  visitCount  Int      @default(1)

  @@index([fingerprint])
}
```

### 2. 统计 API

```typescript
// src/app/api/analytics/track/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { path, locale } = await req.json();
    const userAgent = req.headers.get("user-agent") || "";
    const referrer = req.headers.get("referer") || "";
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "";

    // 生成浏览器指纹（隐私友好）
    const fingerprint = crypto
      .createHash("sha256")
      .update(userAgent + (ip || "unknown"))
      .digest("hex");

    // 记录页面访问
    await prisma.pageView.create({
      data: { path, locale, userAgent, referrer, ip: ip.split(",")[0] },
    });

    // 更新独立访客
    await prisma.uniqueVisitor.upsert({
      where: { fingerprint },
      create: { fingerprint },
      update: {
        lastVisit: new Date(),
        visitCount: { increment: 1 },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
```

### 3. 客户端追踪组件

```typescript
// src/components/analytics-tracker.tsx
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function AnalyticsTracker({ locale }: { locale: string }) {
  const pathname = usePathname();

  useEffect(() => {
    // 发送页面访问统计
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, locale }),
    }).catch(() => {}); // 静默失败
  }, [pathname, locale]);

  return null;
}
```

### 4. 添加到 Layout

```typescript
// src/app/[locale]/layout.tsx
import { AnalyticsTracker } from '@/components/analytics-tracker';

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;

  return (
    <>
      {children}
      <AnalyticsTracker locale={locale} />
    </>
  );
}
```

### 5. Admin 统计页面

```typescript
// src/app/admin/analytics/page.tsx
import prisma from '@/lib/prisma';

export default async function AdminAnalyticsPage() {
  // 今日访问量
  const todayViews = await prisma.pageView.count({
    where: {
      createdAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    }
  });

  // 本周访问量
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const weekViews = await prisma.pageView.count({
    where: { createdAt: { gte: weekStart } }
  });

  // 总独立访客
  const uniqueVisitors = await prisma.uniqueVisitor.count();

  // 热门页面（最近7天）
  const topPages = await prisma.pageView.groupBy({
    by: ['path'],
    where: { createdAt: { gte: weekStart } },
    _count: { path: true },
    orderBy: { _count: { path: 'desc' } },
    take: 10
  });

  // 语言分布
  const localeStats = await prisma.pageView.groupBy({
    by: ['locale'],
    where: { createdAt: { gte: weekStart } },
    _count: { locale: true }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">访问统计</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="今日访问" value={todayViews} />
        <StatCard title="本周访问" value={weekViews} />
        <StatCard title="独立访客" value={uniqueVisitors} />
      </div>

      <div className="rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">热门页面</h2>
        <ul className="space-y-2">
          {topPages.map((page) => (
            <li key={page.path} className="flex justify-between">
              <span>{page.path}</span>
              <span className="text-zinc-500">{page._count.path} 次</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">语言分布</h2>
        <ul className="space-y-2">
          {localeStats.map((stat) => (
            <li key={stat.locale} className="flex justify-between">
              <span>{stat.locale === 'zh' ? '中文' : 'English'}</span>
              <span className="text-zinc-500">{stat._count.locale} 次</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-lg border p-6">
      <p className="text-sm text-zinc-500">{title}</p>
      <p className="text-3xl font-bold">{value.toLocaleString()}</p>
    </div>
  );
}
```

## 性能优化建议

### 1. 异步统计（不阻塞页面）

```typescript
// 使用 sendBeacon API（更可靠）
navigator.sendBeacon("/api/analytics/track", JSON.stringify(data));
```

### 2. 定期清理旧数据

```typescript
// src/lib/cron/cleanup-analytics.ts
export async function cleanupOldAnalytics() {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  await prisma.pageView.deleteMany({
    where: { createdAt: { lt: threeMonthsAgo } },
  });
}
```

### 3. 使用聚合表加速查询

```prisma
model DailyStats {
  id         String   @id @default(cuid())
  date       DateTime @unique
  totalViews Int
  uniqueVisitors Int
  createdAt  DateTime @default(now())
}
```

## 推荐实施步骤

1. **快速启动**：先用 Umami 云服务（5分钟集成）
2. **中期**：自建统计系统（完全掌控）
3. **长期**：根据需求决定是否迁移到付费专业服务

## Umami 快速集成示例

```typescript
// 1. 注册 https://cloud.umami.is
// 2. 创建网站，获取 website-id

// src/app/layout.tsx
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script
          src="https://cloud.umami.is/script.js"
          data-website-id="YOUR-WEBSITE-ID"
          strategy="afterInteractive"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

// Admin 页面直接嵌入 Umami 仪表盘
// src/app/admin/analytics/page.tsx
export default function AnalyticsPage() {
  return (
    <iframe
      src="https://cloud.umami.is/share/YOUR-SHARE-URL"
      width="100%"
      height="800px"
      className="border-0"
    />
  );
}
```

## 总结

- **最快方案**：Umami 云服务（5分钟）
- **最佳方案**：自建统计系统（完全免费、无限制、完全掌控）
- **Vercel 用户**：直接用 Vercel Analytics（零配置）

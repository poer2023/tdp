"use client";

import { ActionCard } from "@/components/admin/action-card";
import { ActionCardHeroUI } from "@/components/admin/action-card-heroui";
import { MetricCard } from "@/components/admin/metric-card";
import { MetricCardHeroUI } from "@/components/admin/metric-card-heroui";

export default function HeroUIComparePage() {
  return (
    <div className="min-h-screen space-y-12 p-8">
      <header>
        <h1 className="text-3xl font-bold">HeroUI v3 组件对比</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          对比原版组件和 HeroUI v3 重构版本
        </p>
      </header>

      {/* ActionCard 对比 */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">ActionCard 组件对比</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            左侧为原版，右侧为 HeroUI v3 版本
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* 原版 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-zinc-500">原版 (自定义样式)</h3>
            <ActionCard
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              }
              title="文章管理"
              description="创建和管理博客文章"
              primaryAction={{ label: "新建文章", href: "/admin/posts/new" }}
            />

            <ActionCard
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              }
              title="图库"
              description="上传和组织照片"
              primaryAction={{ label: "上传", href: "/admin/gallery" }}
              secondaryAction={{ label: "查看", href: "/admin/gallery" }}
            />
          </div>

          {/* HeroUI 版本 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-zinc-500">HeroUI v3 版本</h3>
            <ActionCardHeroUI
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              }
              title="文章管理"
              description="创建和管理博客文章"
              primaryAction={{ label: "新建文章", href: "/admin/posts/new" }}
            />

            <ActionCardHeroUI
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              }
              title="图库"
              description="上传和组织照片"
              primaryAction={{ label: "上传", href: "/admin/gallery" }}
              secondaryAction={{ label: "查看", href: "/admin/gallery" }}
            />
          </div>
        </div>
      </section>

      {/* MetricCard 对比 */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">MetricCard 组件对比</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            左侧为原版，右侧为 HeroUI v3 版本
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* 原版 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-zinc-500">原版 (自定义样式)</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <MetricCard label="总文章" value={42} meta="12 篇草稿" href="/admin/posts" />
              <MetricCard label="图库" value={128} meta="4 张最近上传" href="/admin/gallery" />
              <MetricCard label="访问量" value="1.2k" meta="本月访问" alert />
              <MetricCard label="同步任务" value={5} meta="3 个进行中" />
            </div>
          </div>

          {/* HeroUI 版本 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-zinc-500">HeroUI v3 版本</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <MetricCardHeroUI label="总文章" value={42} meta="12 篇草稿" href="/admin/posts" />
              <MetricCardHeroUI label="图库" value={128} meta="4 张最近上传" href="/admin/gallery" />
              <MetricCardHeroUI label="访问量" value="1.2k" meta="本月访问" alert />
              <MetricCardHeroUI label="同步任务" value={5} meta="3 个进行中" />
            </div>
          </div>
        </div>
      </section>

      {/* 对比总结 */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-4 text-lg font-semibold">对比总结</h2>
        <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
          <div>
            <strong className="text-zinc-900 dark:text-zinc-100">优势：</strong>
            <ul className="ml-6 mt-1 list-disc space-y-1">
              <li>使用 HeroUI v3 统一的组件系统</li>
              <li>更少的自定义 CSS 代码</li>
              <li>内置无障碍访问支持</li>
              <li>一致的深色模式表现</li>
              <li>更小的打包体积（HeroUI v3 优化）</li>
            </ul>
          </div>
          <div>
            <strong className="text-zinc-900 dark:text-zinc-100">视觉差异：</strong>
            <ul className="ml-6 mt-1 list-disc space-y-1">
              <li>边框和圆角可能略有不同</li>
              <li>按钮样式使用 HeroUI 标准样式</li>
              <li>悬停效果可能有细微差异</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

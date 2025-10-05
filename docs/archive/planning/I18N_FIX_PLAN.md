# i18n 路由与导航修复方案（实施指南）

本文档给出一套可落地的修复与迁移方案，目标是在不引入长时间 404/SEO 回退的前提下，将现有“半完成”的 i18n 架构收敛为一致、可维护的路由体系，同时补齐 Gallery 的双语能力，并修复导航/链接的一致性问题。

---

## 背景与目标

- 背景痛点（现状）
  - 根路径 `/` 是旧中文首页；`/[locale]` 仅接受 `zh`；`/en` 直接 404。
  - Posts 有部分 i18n；Gallery 完全无 i18n；`/zh|/en/gallery` 全部 404。
  - 导航计算 locale 的逻辑以 `pathname.startsWith("/zh")` 粗判，导致生成不存在路由。
  - `middleware.ts` 未做语言自动检测与 `/` → `/{locale}` 重定向。
- 目标（期望行为）
  - 路由统一：所有前台页面均走 `/{locale}` 前缀（`/zh`, `/en`）。
  - 访问 `/` 根据浏览器 `Accept-Language` 自动 302 跳转到 `/zh` 或 `/en`。
  - Gallery/Posts/Home 均支持中英文；导航与页脚链接总是指向存在的路由。
  - 全局语言切换器支持在当前页面路径上“位保持”切换语言。
  - 保留旧路由的 301 迁移期，避免外链断裂，随后下线旧页面源文件。

---

## 分阶段路线图

- P0 快速止血（当天可交付）
  - 中间件为 `/` 增加语言自动检测重定向（`/` → `/zh|/en`）。
  - 修正导航与 Footer 的 locale 解析与链接生成，避免再生成 404 链接。
  - 放开 `src/app/[locale]/page.tsx` 对 `en` 的拒绝（临时跳转到 `/{locale}/posts` 亦可）。
- P1 完成路由与页面收敛（1–2 天）
  - 新增 `src/app/[locale]/gallery/**`，复用现有 Gallery 组件，输出双语文案。
  - 扩展 `src/app/[locale]/posts/[slug]/page.tsx` 同时支持 EN/ZH。
  - 在 `middleware.ts` 增加旧→新路由的 301：`/posts`、`/gallery` → `/{preferred}/…`。
- P2 体验完善与 SEO（1–2 天）
  - 添加全局语言切换器，保留路径位切换（`/zh/foo/bar` ↔ `/en/foo/bar`）。
  - 为首页/Gallery/Posts 配置 `alternates.languages` 与 `canonical`。
  - 补充 `sitemap-*.xml` 覆盖新路由（现有 sitemap 已基础具备）。
- P3 清理（1 天）
  - 缩短过渡期后移除旧页面源：`src/app/page.tsx`、`src/app/posts/**`、`src/app/gallery/**`。

---

## 具体改动清单（按文件）

以下改动为“建议实现”的最小集合，代码片段仅示意关键差异。

- 文件：`middleware.ts`
  - 新增语言检测与 `/` 重定向；增加旧路由 → 新路由迁移（保留查询串）。

  ```ts
  // 片段：增加到 middleware 顶部合适位置
  function pickPreferredLocale(acceptLanguage: string | null): "zh" | "en" {
    const al = (acceptLanguage || "").toLowerCase();
    // 简化实现：命中 zh 则 zh，否则 en
    return /\bzh\b|zh-cn|zh-hans/.test(al) ? "zh" : "en";
  }

  export async function middleware(request: NextRequest) {
    const { pathname, searchParams } = request.nextUrl;

    // 1) 访问根路径 → 按语言首选项跳转 /zh 或 /en
    if (pathname === "/") {
      const target = pickPreferredLocale(request.headers.get("accept-language"));
      const url = new URL(`/${target}`, request.nextUrl.origin);
      searchParams.forEach((v, k) => url.searchParams.set(k, v));
      return NextResponse.redirect(url, { status: 302 });
    }

    // 2) 旧路由迁移（阶段性开启）：/posts 与 /gallery → /{preferred}/…
    if (pathname === "/posts" || pathname.startsWith("/posts/")) {
      const pref = pickPreferredLocale(request.headers.get("accept-language"));
      const rest = pathname.slice("/posts".length); // 保留可能的 /:slug
      const url = new URL(`/${pref}/posts${rest}`, request.nextUrl.origin);
      searchParams.forEach((v, k) => url.searchParams.set(k, v));
      return NextResponse.redirect(url, { status: 301 });
    }
    if (pathname === "/gallery" || pathname.startsWith("/gallery/")) {
      const pref = pickPreferredLocale(request.headers.get("accept-language"));
      const rest = pathname.slice("/gallery".length);
      const url = new URL(`/${pref}/gallery${rest}`, request.nextUrl.origin);
      searchParams.forEach((v, k) => url.searchParams.set(k, v));
      return NextResponse.redirect(url, { status: 301 });
    }

    // …其余逻辑保持现有实现（Admin 保护、PostAlias 重定向等）
  }
  ```

- 文件：`src/app/[locale]/page.tsx`
  - 允许 `en` 与 `zh`，临时将首页跳转/引导到各自的 posts 列表，避免空白。

  ```tsx
  // 替换原来的 zh-only 逻辑
  export default async function LocalizedHomePage({
    params,
  }: {
    params: Promise<{ locale: string }>;
  }) {
    const { locale } = await params;
    const l = locale === "zh" ? "zh" : "en";

    return (
      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-4xl font-bold">{l === "zh" ? "首页" : "Home"}</h1>
        <p className="mt-4 text-zinc-600">{l === "zh" ? "欢迎访问中文站" : "Welcome"}</p>
        <Link href={`/${l}/posts`} className="mt-6 inline-block text-blue-600 hover:underline">
          {l === "zh" ? "查看文章列表 →" : "Browse posts →"}
        </Link>
      </div>
    );
  }

  export function generateStaticParams() {
    return [{ locale: "en" }, { locale: "zh" }];
  }
  ```

- 新增：`src/app/[locale]/gallery/page.tsx`
  - 基于 `src/app/gallery/page.tsx` 复制并本地化文案、链接前缀。

  ```tsx
  import Link from "next/link";
  import { listGalleryImages } from "@/lib/gallery";

  export const revalidate = 0;

  export default async function LocalizedGalleryPage({
    params,
  }: {
    params: Promise<{ locale: string }>;
  }) {
    const { locale } = await params;
    const l = locale === "zh" ? "zh" : "en";
    const images = await listGalleryImages();

    return (
      <div className="mx-auto max-w-[1200px] space-y-10 px-6 py-12 md:px-8 md:py-16">
        <header className="max-w-3xl space-y-3">
          <p className="text-xs tracking-[0.2em] text-zinc-400 uppercase">Gallery</p>
          <h1 className="text-4xl font-bold">{l === "zh" ? "灵感相册" : "Gallery"}</h1>
          <p className="text-base text-zinc-600">
            {l === "zh" ? "用照片记录创作瞬间" : "Moments captured while creating"}
          </p>
        </header>
        {images.length ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {images.map((img) => (
              <Link key={img.id} href={`/${l}/gallery/${img.id}`} className="group block">
                {/* 复用现有卡片/图片样式（略） */}
                <div className="aspect-[4/3] rounded-lg bg-zinc-100" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed px-6 py-16 text-center">
            <p className="text-sm text-zinc-500">{l === "zh" ? "相册暂空" : "No photos yet"}</p>
          </div>
        )}
      </div>
    );
  }
  ```

- 新增：`src/app/[locale]/gallery/[id]/page.tsx`
  - 复用 `PhotoViewer`，仅修正返回与相邻图片链接为 `/{locale}/gallery/...`。

  ```tsx
  import { notFound } from "next/navigation";
  import { getGalleryImageById, getAdjacentImageIds } from "@/lib/gallery";

  export default async function LocalizedPhotoDetail({
    params,
  }: {
    params: Promise<{ locale: string; id: string }>;
  }) {
    const { locale, id } = await params;
    const l = locale === "zh" ? "zh" : "en";
    const image = await getGalleryImageById(id);
    if (!image) notFound();

    const { prev, next } = await getAdjacentImageIds(id);
    // 注意：如果你在 PhotoViewer 内生成链接，需要按 l 拼接 `/${l}/gallery/...`
    return null; // 这里放入实际 PhotoViewer 组件调用（略）
  }
  ```

- 文件：`src/app/[locale]/posts/[slug]/page.tsx`
  - 当前仅支持 `zh`，请改为根据 `params.locale` 选择 `PostLocale.EN | ZH` 并查询对应文章；SEO `alternates` 也随之调整。

  ```tsx
  // 替换 zh-only 检查：
  const { locale, slug } = await params;
  const upper = locale.toUpperCase();
  const postLocale = upper === "ZH" ? PostLocale.ZH : upper === "EN" ? PostLocale.EN : null;
  if (!postLocale) notFound();
  // 之后 prisma 查询使用 postLocale
  ```

- 文件：`src/components/main-nav.tsx`
  - 使用 `getLocaleFromPathname(pathname)` 一致解析 locale；链接一律 `/${locale}/...`。

  ```tsx
  import { getLocaleFromPathname } from "@/lib/i18n";
  const l = getLocaleFromPathname(pathname) ?? "en";
  const links = [
    { href: `/${l}/posts`, label: l === "zh" ? "博客" : "Blog" },
    { href: `/${l}/gallery`, label: l === "zh" ? "相册" : "Gallery" },
  ];
  ```

- 文件：`src/components/footer.tsx`
  - 修正硬编码 `/gallery` → `/${locale}/gallery`；同样用 `getLocaleFromPathname`。

  ```tsx
  import { getLocaleFromPathname } from "@/lib/i18n";
  const l = getLocaleFromPathname(pathname) ?? "en";
  const links = [
    { href: `/${l}/posts`, label: l === "zh" ? "博客" : "Blog" },
    { href: `/${l}/gallery`, label: l === "zh" ? "相册" : "Gallery" },
  ];
  ```

- 新增：全局语言切换器 `src/components/global-language-switcher.tsx`
  - 逻辑：基于 `usePathname()` 将第一段 locale 替换为目标 locale，其余路径位保持；若 URL 无 locale 段，则前缀上目标 locale。

  ```tsx
  "use client";
  import { usePathname } from "next/navigation";
  import { getLocaleFromPathname } from "@/lib/i18n";

  function switchLocalePath(pathname: string, target: "en" | "zh"): string {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length === 0) return `/${target}`;
    if (parts[0] === "en" || parts[0] === "zh") {
      parts[0] = target;
      return `/${parts.join("/")}`;
    }
    return `/${target}/${parts.join("/")}`;
  }

  export function GlobalLanguageSwitcher() {
    const pathname = usePathname();
    const current = getLocaleFromPathname(pathname) ?? "en";
    const other = current === "zh" ? "en" : "zh";
    return (
      <a href={switchLocalePath(pathname, other)} className="rounded px-2 py-1 text-sm">
        {other === "zh" ? "中文" : "EN"}
      </a>
    );
  }
  ```

  - 将其放到 `src/app/layout.tsx` 顶栏（建议挨着 `AuthHeader`）。

- 可选：`next.config.ts`
  - 暂不启用 `i18n` 配置（App Router 使用 URL 段更直观）。如需为老链接追加永久跳转，也可使用 `redirects()` 实现，但本方案统一在 `middleware.ts` 处理，便于按阶段开关与保留查询串。

---

## 测试清单（手动）

- 基础路由
  - 访问 `/`，根据浏览器语言跳转 `/zh` 或 `/en`。
  - 访问 `/zh`、`/en` 能看到首页，引导到各自 `/{locale}/posts`。
  - 访问 `/{locale}/posts`、`/{locale}/posts/:slug`、`/{locale}/gallery`、`/{locale}/gallery/:id` 均 200。
- 导航与页脚
  - MainNav 与 Footer 的链接均指向 `/{locale}/...`，不会出现 404。
  - 全局语言切换器切换后路径位保持，语言与文案变化正确。
- 旧路由迁移
  - `/posts`、`/posts/:slug`、`/gallery`、`/gallery/:id` 返回 301 → `/{preferred}/...`。
  - Query 参数在跳转后完整保留。
- SEO
  - 文章与列表页含 `alternates.languages` 与 `canonical`。
  - `sitemap-*.xml` 覆盖新路由（若新增页面需同步）。

---

## 登录“直接成功”说明与可选优化

- 现象为 OAuth 正常行为（浏览器登录且已授权）。如需每次选择账号：

  ```tsx
  // 文件：src/components/auth-header.tsx:144
  onClick={() => signIn("google", {
    callbackUrl: window.location.pathname,
    prompt: "select_account", // 强制显示账号选择
  })}
  ```

- 若测试需要“冷启动”场景，请清空浏览器 cookies 与 localStorage 后再试。

---

## 下线与回滚策略

- 迁移期（建议 2–4 周）保留旧路由 301 以利 SEO 收敛与外链承接。
- 若出现大面积 404，可临时关闭旧→新重定向分支，仅保留 `/` 语言重定向；问题定位后再开启。

---

## 交付物检查清单（Done 定义）

- 所有前台入口均为 `/{locale}` 前缀；`/` 会跳转。
- Gallery/Posts/Home 三类页面均具备 EN/ZH 两套内容与链接。
- 顶栏与页脚链接 100% 指向存在路由；全局语言切换器可用。
- 旧路由返回 301 并保留查询串；Search Console 0 断链告警。
- 文章详情 `alternates` 正确成对（互指 EN↔ZH）。

---

## 备注

- Admin 后台建议维持非 i18n 路由（`/admin`），避免引入额外维度；若后续需要多语言后台，再单独规划。
- 由于项目已存在 `ROADMAP_i18n_Upgrade.md`，本方案专注“把现状落到可运行”，与 Roadmap 并行推进不冲突。

> 如需我直接提交上述文件改动，请告诉我，我可以分阶段开 PR，并附带最小可验证的 E2E 步骤。

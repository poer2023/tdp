"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getHtmlLang, getLocaleFromPathname } from "@/lib/i18n";

/**
 * Keep <html lang> in sync on client-side navigations.
 * Next.js App Router不会在客户端导航时重渲染根布局，
 * 这里在路由变化后根据 pathname 主动更新 document.documentElement.lang，
 * 以满足可访问性与 E2E 断言需求。
 */
export function HtmlLangSync() {
  const pathname = usePathname() || "/";

  useEffect(() => {
    const resolvedPath =
      pathname === "/" && typeof window !== "undefined" ? window.location.pathname : pathname;
    const locale = getLocaleFromPathname(resolvedPath || "/") || "en";
    const lang = getHtmlLang(locale);
    try {
      document.documentElement.setAttribute("lang", lang);
    } catch {}
  }, [pathname]);

  return null;
}

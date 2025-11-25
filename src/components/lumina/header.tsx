"use client";

import React, { useState, useEffect, startTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, User as UserIcon, LogOut, LayoutDashboard, Moon, Sun, Languages } from "lucide-react";
import { getLocaleFromPathname } from "@/lib/i18n";
import { localePath } from "@/lib/locale-path";
import { useTheme } from "next-themes";

interface NavLink {
  label: string;
  labelZh: string;
  path: string;
}

const NAV_LINKS: NavLink[] = [
  { label: "Home", labelZh: "首页", path: "/" },
  { label: "Projects", labelZh: "项目", path: "/projects" },
  { label: "Gallery", labelZh: "相册", path: "/gallery" },
  { label: "Life Log", labelZh: "生活日志", path: "/about/live" },
];

export function LuminaHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  // Detect current locale from pathname
  const locale = getLocaleFromPathname(pathname) ?? "en";

  // Wait for client-side hydration to avoid theme mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    startTransition(() => setIsMobileMenuOpen(false));
  }, [pathname]);

  // Helper to determine if a link is active based on current path
  const isActive = (path: string) => {
    const localizedPath = localePath(locale, path);
    if (path === "/") {
      return pathname === `/${locale}` || pathname === "/en" || pathname === "/zh";
    }
    return pathname.startsWith(localizedPath);
  };

  const handleNavClick = (path: string) => {
    const localizedPath = localePath(locale, path);
    router.push(localizedPath);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const toggleLanguage = () => {
    const newLocale = locale === "en" ? "zh" : "en";
    // Replace locale in current path
    const pathWithoutLocale = pathname.replace(/^\/(en|zh)/, "");
    router.push(`/${newLocale}${pathWithoutLocale || ""}`);
  };

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      en: {
        Login: "Login",
        Logout: "Logout",
        Admin: "Admin",
        Theme: "Theme",
        Language: "Language",
        "Login / Sign up": "Login / Sign up",
      },
      zh: {
        Login: "登录",
        Logout: "登出",
        Admin: "管理",
        Theme: "主题",
        Language: "语言",
        "Login / Sign up": "登录 / 注册",
      },
    };
    return translations[locale]?.[key] || key;
  };

  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-stone-200 bg-stone-50/80 backdrop-blur-md transition-colors duration-300 dark:border-stone-800 dark:bg-stone-950/80">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="shrink-0 cursor-pointer" onClick={() => handleNavClick("/")}>
            <h1 className="font-serif text-2xl font-bold tracking-tighter text-stone-900 dark:text-stone-100">
              ZHI<span className="text-sage-600 dark:text-sage-400">.</span>
            </h1>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden space-x-8 md:flex">
            {NAV_LINKS.map((link) => (
              <button
                key={link.path}
                onClick={() => handleNavClick(link.path)}
                className={`text-sm font-medium transition-colors duration-200 ${
                  isActive(link.path)
                    ? "border-b-2 border-sage-500 text-stone-900 dark:text-stone-100"
                    : "text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
                }`}
              >
                {locale === "zh" ? link.labelZh : link.label}
              </button>
            ))}
          </nav>

          {/* Desktop User & Settings Menu */}
          <div className="hidden items-center gap-4 md:flex">
            {/* Settings Controls */}
            <div className="mr-1 flex items-center gap-2 border-r border-stone-200 pr-4 dark:border-stone-800">
              <button
                onClick={toggleTheme}
                className="rounded-full p-1.5 text-stone-500 transition-all hover:bg-stone-100 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
                title="Toggle Theme"
              >
                {mounted && (theme === "light" ? <Moon size={18} /> : <Sun size={18} />)}
                {!mounted && <Moon size={18} />}
              </button>
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-1 rounded-full p-1.5 font-sans text-xs font-bold text-stone-500 transition-all hover:bg-stone-100 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
                title="Switch Language"
              >
                <Languages size={18} />
                <span>{locale.toUpperCase()}</span>
              </button>
            </div>

            {session ? (
              <div className="flex items-center gap-4">
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 rounded-full bg-stone-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300"
                  >
                    <LayoutDashboard size={14} /> {t("Admin")}
                  </Link>
                )}
                <div className="flex items-center gap-2 text-stone-600 dark:text-stone-300">
                  <UserIcon size={16} />
                  <span className="text-sm font-medium">{session.user?.name || session.user?.email}</span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="text-stone-400 transition-colors hover:text-rose-500"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-sm font-medium text-stone-900 transition-colors hover:text-sage-600 dark:text-stone-100 dark:hover:text-sage-400"
              >
                {t("Login")}
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-4 md:hidden">
            {session && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-200 text-sm font-bold text-stone-800 dark:bg-stone-800 dark:text-stone-100">
                {(session.user?.name ?? session.user?.email ?? "U")[0]?.toUpperCase() ?? "U"}
              </div>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
        <div className="border-b border-stone-200 bg-white shadow-lg md:hidden dark:border-stone-800 dark:bg-stone-900">
          <div className="space-y-1 px-4 pt-2 pb-6">
            {NAV_LINKS.map((link) => (
              <button
                key={link.path}
                onClick={() => handleNavClick(link.path)}
                className={`block w-full rounded-md px-3 py-3 text-left text-base font-medium ${
                  isActive(link.path)
                    ? "bg-sage-50 text-sage-600 dark:bg-sage-900/30 dark:text-sage-400"
                    : "text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
                }`}
              >
                {locale === "zh" ? link.labelZh : link.label}
              </button>
            ))}

            <div className="mt-2 flex items-center justify-between border-t border-stone-100 px-3 pt-4 pb-2 dark:border-stone-800">
              <span className="text-sm text-stone-500 dark:text-stone-400">{t("Theme")}</span>
              <button onClick={toggleTheme} className="rounded-full bg-stone-100 p-2 dark:bg-stone-800">
                {mounted ? (
                  theme === "light" ? (
                    <Moon size={18} className="text-stone-600" />
                  ) : (
                    <Sun size={18} className="text-stone-300" />
                  )
                ) : (
                  <Moon size={18} className="text-stone-600" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between px-3 pt-2 pb-2">
              <span className="text-sm text-stone-500 dark:text-stone-400">{t("Language")}</span>
              <button
                onClick={toggleLanguage}
                className="rounded bg-stone-100 px-3 py-1 text-sm font-medium text-stone-600 dark:bg-stone-800 dark:text-stone-300"
              >
                {locale === "en" ? "English" : "中文"}
              </button>
            </div>

            <div className="mt-2 border-t border-stone-100 pt-2 dark:border-stone-800">
              {!session ? (
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full rounded-md px-3 py-3 text-left text-base font-medium text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
                >
                  {t("Login / Sign up")}
                </Link>
              ) : (
                <>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full rounded-md px-3 py-3 text-left text-base font-medium text-stone-800 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800"
                    >
                      {t("Admin")}
                    </Link>
                  )}
                  <button
                    onClick={() => signOut()}
                    className="block w-full rounded-md px-3 py-3 text-left text-base font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                  >
                    {t("Logout")}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default LuminaHeader;

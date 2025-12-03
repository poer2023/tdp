"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { startTransition, useState, useEffect } from "react";
import { getLocaleFromPathname } from "@/lib/i18n";
import { localePath } from "@/lib/locale-path";
import { Menu, Info, FileText } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  match: string;
  exact: boolean;
  icon?: React.ReactNode;
  description?: string;
  items?: {
    href: string;
    label: string;
    match: string;
    icon?: React.ReactNode;
    description?: string;
  }[];
}

export function MainNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Detect current locale from pathname using utility function
  const locale = getLocaleFromPathname(pathname) ?? "en";

  const links: NavItem[] = [
    {
      href: localePath(locale, "/posts"),
      label: locale === "zh" ? "博客" : "Blog",
      match: "/posts",
      exact: false,
    },
    {
      href: localePath(locale, "/m"),
      label: locale === "zh" ? "瞬间" : "Moments",
      match: "/m",
      exact: false,
    },
    {
      href: localePath(locale, "/gallery"),
      label: locale === "zh" ? "相册" : "Gallery",
      match: "/gallery",
      exact: false,
    },
    {
      href: "#",
      label: locale === "zh" ? "关于" : "About",
      match: "/about",
      exact: false,
      items: [
        {
          href: localePath(locale, "/about"),
          label: locale === "zh" ? "关于" : "About",
          match: "/about",
          icon: <Info className="size-5 shrink-0" />,
          description: locale === "zh" ? "了解更多关于我们的信息" : "Learn more about us",
        },
        {
          href: localePath(locale, "/about/changelog"),
          label: locale === "zh" ? "开发日志" : "Changelog",
          match: "/about/changelog",
          icon: <FileText className="size-5 shrink-0" />,
          description: locale === "zh" ? "查看项目更新日志" : "View project changelog",
        },
      ],
    },
  ];

  // Close mobile menu on route change
  useEffect(() => {
    startTransition(() => setMobileMenuOpen(false));
  }, [pathname]);

  const renderDesktopMenuItem = (link: NavItem) => {
    if (link.items) {
      // Render dropdown menu for items with subitems
      return (
        <NavigationMenuItem key={link.label}>
          <NavigationMenuTrigger className="text-sm leading-6 text-stone-600 transition-colors hover:text-stone-900 data-[state=open]:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 dark:data-[state=open]:text-stone-100">
            {link.label}
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="w-80 p-3">
              {link.items.map((subItem) => {
                const isActive = pathname.includes(subItem.match);
                return (
                  <li key={subItem.href}>
                    <NavigationMenuLink asChild>
                      <Link
                        href={subItem.href}
                        className={cn(
                          "flex gap-4 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none hover:bg-stone-100 hover:text-stone-900 dark:hover:bg-stone-800 dark:hover:text-stone-100",
                          isActive && "bg-stone-100 dark:bg-stone-800"
                        )}
                      >
                        {subItem.icon}
                        <div>
                          <div className="text-sm font-semibold">{subItem.label}</div>
                          {subItem.description && (
                            <p className="text-sm leading-snug text-stone-600 dark:text-stone-400">
                              {subItem.description}
                            </p>
                          )}
                        </div>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                );
              })}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      );
    }

    // Render simple link
    const isActive = link.exact
      ? pathname === link.href || pathname === localePath(locale, link.match)
      : pathname.includes(link.match);

    return (
      <Link
        key={link.href}
        href={link.href}
        className={cn(
          "text-sm leading-6 transition-colors",
          isActive
            ? "font-medium text-stone-900 dark:text-stone-100"
            : "text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
        )}
        aria-current={isActive ? "page" : undefined}
      >
        {link.label}
      </Link>
    );
  };

  const renderMobileMenuItem = (link: NavItem) => {
    if (link.items) {
      // Render accordion for items with subitems
      return (
        <AccordionItem key={link.label} value={link.label} className="border-b-0">
          <AccordionTrigger className="py-0 font-semibold text-stone-700 hover:no-underline dark:text-stone-200">
            {link.label}
          </AccordionTrigger>
          <AccordionContent className="mt-2">
            {link.items.map((subItem) => {
              const isActive = pathname.includes(subItem.match);
              return (
                <Link
                  key={subItem.href}
                  href={subItem.href}
                  className={cn(
                    "flex gap-4 rounded-md p-3 leading-none transition-colors outline-none select-none hover:bg-stone-100 dark:hover:bg-stone-800",
                    isActive && "bg-stone-100 dark:bg-stone-800"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {subItem.icon}
                  <div>
                    <div className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                      {subItem.label}
                    </div>
                    {subItem.description && (
                      <p className="text-sm leading-snug text-stone-600 dark:text-stone-400">
                        {subItem.description}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </AccordionContent>
        </AccordionItem>
      );
    }

    // Render simple link
    const isActive = link.exact
      ? pathname === link.href || pathname === localePath(locale, link.match)
      : pathname.includes(link.match);

    return (
      <Link
        key={link.href}
        href={link.href}
        className={cn(
          "rounded-lg px-4 py-3 text-base font-medium transition-all",
          isActive
            ? "bg-stone-900 text-white shadow-sm dark:bg-white dark:text-stone-900"
            : "text-stone-700 hover:bg-stone-100/70 hover:text-stone-900 dark:text-stone-200 dark:hover:bg-stone-800/70 dark:hover:text-stone-100"
        )}
        aria-current={isActive ? "page" : undefined}
        onClick={() => setMobileMenuOpen(false)}
      >
        {link.label}
      </Link>
    );
  };

  return (
    <nav className="flex items-center gap-6" role="navigation" aria-label="Main navigation">
      <Link
        href={localePath(locale, "/")}
        className="text-lg font-semibold text-stone-900 dark:text-stone-100"
        aria-label="Home"
      >
        ZHI
      </Link>

      {/* Desktop Navigation - hidden on mobile */}
      <div className="hidden items-center gap-6 md:flex">
        <NavigationMenu>
          <NavigationMenuList>
            {links.map((link) => renderDesktopMenuItem(link))}
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      {/* Mobile Menu Sheet */}
      <div className="md:hidden">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
              aria-label={locale === "zh" ? "打开菜单" : "Open menu"}
            >
              <Menu className="h-6 w-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="top" className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>
                <Link
                  href={localePath(locale, "/")}
                  className="text-lg font-semibold"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  ZHI
                </Link>
              </SheetTitle>
            </SheetHeader>
            <div className="my-6 flex flex-col gap-4">
              <Accordion type="single" collapsible className="flex w-full flex-col gap-4">
                {links.map((link) => renderMobileMenuItem(link))}
              </Accordion>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}

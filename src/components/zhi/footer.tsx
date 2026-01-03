"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Github, Mail } from "lucide-react";

// X (Twitter) Logo Component
const XLogo = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
import { usePathname, useRouter } from "next/navigation";
import { getLocaleFromPathname } from "@/lib/i18n";
import { localePath } from "@/lib/locale-path";

export function ZhiFooter() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = getLocaleFromPathname(pathname) ?? "en";

  // Secret entrance: click "Zhi" 5 times within 2 seconds to access friends page
  const [clickCount, setClickCount] = useState(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldNavigateRef = useRef(false);

  // Handle navigation outside of setState to avoid React warning
  useEffect(() => {
    if (shouldNavigateRef.current) {
      shouldNavigateRef.current = false;
      router.push(localePath(locale, "/m/friends"));
    }
  }, [clickCount, locale, router]);

  const handleSecretClick = useCallback(() => {
    // Reset timeout on each click
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    clickTimeoutRef.current = setTimeout(() => {
      setClickCount(0);
    }, 2000);

    setClickCount((prev) => {
      const newCount = prev + 1;

      // Mark for navigation on 5th click
      if (newCount >= 5) {
        shouldNavigateRef.current = true;
        if (clickTimeoutRef.current) {
          clearTimeout(clickTimeoutRef.current);
        }
        return 0; // Reset count
      }

      return newCount;
    });
  }, []);

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      en: {
        "Let's connect": "Let's connect",
        "Updated casually": "Updated casually.",
      },
      zh: {
        "Let's connect": "保持联系",
        "Updated casually": "随性更新。",
      },
    };
    return translations[locale]?.[key] || key;
  };

  return (
    <footer className="mt-20 w-full border-t border-stone-100 bg-white py-12 transition-colors dark:border-[#1f1f23] dark:bg-[#0a0a0b]">
      <div className="mx-auto flex max-w-4xl flex-col items-center px-4 text-center">
        <h2 className="mb-6 font-serif text-2xl text-stone-800 dark:text-stone-100">
          {t("Let's connect")}
        </h2>

        <div className="mb-8 flex gap-6">
          <a
            href="https://x.com/poerpo5"
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer rounded-full p-2 text-stone-400 transition-all hover:bg-stone-50 hover:text-stone-800 dark:hover:bg-[#1f1f23] dark:hover:text-stone-100"
          >
            <XLogo size={20} />
          </a>
          <a
            href="https://github.com/poer2023/"
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer rounded-full p-2 text-stone-400 transition-all hover:bg-stone-50 hover:text-stone-800 dark:hover:bg-[#1f1f23] dark:hover:text-stone-100"
          >
            <Github size={20} />
          </a>
          <a
            href="mailto:dj521522@gmail.com"
            className="cursor-pointer rounded-full p-2 text-stone-400 transition-all hover:bg-stone-50 hover:text-stone-800 dark:hover:bg-[#1f1f23] dark:hover:text-stone-100"
          >
            <Mail size={20} />
          </a>
        </div>

        <p className="text-sm text-stone-400">
          © {new Date().getFullYear()}{" "}
          <span
            onClick={handleSecretClick}
            className="cursor-default select-none"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                handleSecretClick();
              }
            }}
          >
            Zhi
          </span>
          . {t("Updated casually")}
        </p>
      </div>
    </footer>
  );
}

export default ZhiFooter;

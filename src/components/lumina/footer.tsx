"use client";

import React from "react";
import { Twitter, Github, Linkedin, Mail } from "lucide-react";
import { usePathname } from "next/navigation";
import { getLocaleFromPathname } from "@/lib/i18n";

export function LuminaFooter() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname) ?? "en";

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      en: {
        "Let's connect": "Let's connect",
        "Designed with": "Designed with",
      },
      zh: {
        "Let's connect": "保持联系",
        "Designed with": "精心设计",
      },
    };
    return translations[locale]?.[key] || key;
  };

  return (
    <footer className="mt-20 w-full border-t border-stone-100 bg-white py-12 transition-colors dark:border-stone-800 dark:bg-stone-900">
      <div className="mx-auto flex max-w-4xl flex-col items-center px-4 text-center">
        <h2 className="mb-6 font-serif text-2xl text-stone-800 dark:text-stone-100">
          {t("Let's connect")}
        </h2>

        <div className="mb-8 flex gap-6">
          <a
            href="#"
            className="rounded-full p-2 text-stone-400 transition-all hover:bg-stone-50 hover:text-stone-800 dark:hover:bg-stone-800 dark:hover:text-stone-100"
          >
            <Twitter size={20} />
          </a>
          <a
            href="#"
            className="rounded-full p-2 text-stone-400 transition-all hover:bg-stone-50 hover:text-stone-800 dark:hover:bg-stone-800 dark:hover:text-stone-100"
          >
            <Github size={20} />
          </a>
          <a
            href="#"
            className="rounded-full p-2 text-stone-400 transition-all hover:bg-stone-50 hover:text-stone-800 dark:hover:bg-stone-800 dark:hover:text-stone-100"
          >
            <Linkedin size={20} />
          </a>
          <a
            href="#"
            className="rounded-full p-2 text-stone-400 transition-all hover:bg-stone-50 hover:text-stone-800 dark:hover:bg-stone-800 dark:hover:text-stone-100"
          >
            <Mail size={20} />
          </a>
        </div>

        <p className="text-sm text-stone-400">
          © {new Date().getFullYear()} Lumina Space. {t("Designed with")} React, Tailwind & Caffeine.
        </p>
      </div>
    </footer>
  );
}

export default LuminaFooter;

"use client";

import { startTransition, useEffect, useState } from "react";

type Theme = "light" | "dark";

export function ThemeToggle({ size = "md" }: { size?: "sm" | "md" } = {}) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");

  const applyTheme = (next: Theme) => {
    const root = document.documentElement;
    if (next === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  };

  useEffect(() => {
    startTransition(() => setMounted(true));
    try {
      const saved = (localStorage.getItem("theme") as Theme | null) ?? null;
      const prefersDark =
        window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      const next: Theme = saved ?? (prefersDark ? "dark" : "light");
      applyTheme(next);
      startTransition(() => setTheme(next));
    } catch {
      // no-op
    }
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    startTransition(() => setTheme(next));
    try {
      localStorage.setItem("theme", next);
    } catch {}
    applyTheme(next);
  }

  // Avoid hydration mismatch by not rendering icon until mounted
  const label = theme === "dark" ? "切换到浅色" : "切换到深色";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      aria-pressed={theme === "dark"}
      title={label}
      data-testid="theme-toggle"
      className={`inline-flex items-center justify-center rounded-full border border-stone-300 bg-white/80 text-stone-700 transition hover:bg-stone-50 dark:border-[#2C2C2E] dark:bg-[#1C1C1E] dark:text-stone-300 dark:hover:bg-[#2C2C2E] ${
        size === "sm" ? "h-7 w-7" : "h-9 w-9"
      }`}
    >
      {/* Icon with smooth transition */}
      <span
        className={`inline-flex items-center justify-center transition-all duration-300 ease-out ${
          theme === "dark" ? "scale-100 rotate-0 opacity-100" : "scale-90 -rotate-90 opacity-90"
        }`}
      >
        {mounted && (theme === "dark" ? <MoonIcon /> : <SunIcon />)}
      </span>
    </button>
  );
}

function SunIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

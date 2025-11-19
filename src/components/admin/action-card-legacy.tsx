"use client";

import Link from "next/link";

type ActionCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  href?: string;
  primaryAction?: {
    label: string;
    href: string;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
};

export function ActionCardLegacy({
  icon,
  title,
  description,
  href,
  primaryAction,
  secondaryAction,
}: ActionCardProps) {
  const content = (
    <div className="group flex h-[96px] items-center gap-4 rounded-xl border border-zinc-200 bg-white p-5 transition-all duration-200 focus-within:border-zinc-400 focus-within:ring-2 focus-within:ring-zinc-200 hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:focus-within:border-zinc-600 dark:focus-within:ring-zinc-800 dark:hover:border-zinc-700 dark:hover:shadow-none">
      {/* Icon */}
      <div className="flex-shrink-0 text-zinc-600 dark:text-zinc-400">{icon}</div>

      {/* Content */}
      <div className="flex-1 space-y-0.5">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
        <p className="text-xs leading-tight text-zinc-600 dark:text-zinc-400">{description}</p>
      </div>

      {/* Actions or Arrow */}
      {primaryAction || secondaryAction ? (
        <div className="flex flex-shrink-0 items-center gap-2">
          {secondaryAction && (
            <Link
              href={secondaryAction.href}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
              onClick={(e) => e.stopPropagation()}
            >
              {secondaryAction.label}
            </Link>
          )}
          {primaryAction && (
            <Link
              href={primaryAction.href}
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:hover:bg-zinc-300"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-white dark:text-zinc-900">{primaryAction.label}</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="flex-shrink-0 text-zinc-400 transition-transform group-hover:translate-x-0.5">
          →
        </div>
      )}
    </div>
  );

  if (href && !primaryAction && !secondaryAction) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

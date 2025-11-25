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

export function ActionCard({
  icon,
  title,
  description,
  href,
  primaryAction,
  secondaryAction,
}: ActionCardProps) {
  const content = (
    <div className="group flex h-[96px] items-center gap-4 rounded-xl border border-stone-200 bg-white p-5 transition-all duration-200 focus-within:border-sage-400 focus-within:ring-2 focus-within:ring-sage-200 hover:border-stone-300 hover:shadow-sm dark:border-stone-800 dark:bg-stone-950 dark:focus-within:border-sage-600 dark:focus-within:ring-sage-800 dark:hover:border-stone-700 dark:hover:shadow-none">
      {/* Icon */}
      <div className="flex-shrink-0 text-stone-600 dark:text-stone-400">{icon}</div>

      {/* Content */}
      <div className="flex-1 space-y-0.5">
        <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">{title}</h3>
        <p className="text-xs leading-tight text-stone-600 dark:text-stone-400">{description}</p>
      </div>

      {/* Actions or Arrow */}
      {primaryAction || secondaryAction ? (
        <div className="flex flex-shrink-0 items-center gap-2">
          {secondaryAction && (
            <Link
              href={secondaryAction.href}
              className="rounded-xl border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50 dark:border-stone-800 dark:text-stone-300 dark:hover:bg-stone-900"
              onClick={(e) => e.stopPropagation()}
            >
              {secondaryAction.label}
            </Link>
          )}
          {primaryAction && (
            <Link
              href={primaryAction.href}
              className="rounded-xl bg-stone-900 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-stone-700 dark:bg-stone-100 dark:hover:bg-stone-300"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-white dark:text-stone-900">{primaryAction.label}</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="flex-shrink-0 text-stone-400 transition-transform group-hover:translate-x-0.5">
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

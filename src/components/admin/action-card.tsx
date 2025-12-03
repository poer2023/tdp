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
    <div className="group flex items-center gap-4 rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition-all duration-200 hover:border-stone-300 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700">
      {/* Icon */}
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400">
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-stone-800 dark:text-stone-100">{title}</h3>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 truncate">
          {description}
        </p>
      </div>

      {/* Actions or Arrow */}
      {primaryAction || secondaryAction ? (
        <div className="flex flex-shrink-0 items-center gap-2">
          {secondaryAction && (
            <Link
              href={secondaryAction.href}
              className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
              onClick={(e) => e.stopPropagation()}
            >
              {secondaryAction.label}
            </Link>
          )}
          {primaryAction && (
            <Link
              href={primaryAction.href}
              className="rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90 dark:bg-stone-100 dark:text-stone-900"
              onClick={(e) => e.stopPropagation()}
            >
              {primaryAction.label}
            </Link>
          )}
        </div>
      ) : (
        <div className="flex-shrink-0 text-stone-400 transition-transform group-hover:translate-x-0.5">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
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

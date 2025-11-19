"use client";

import Link from "next/link";
import { Card, CardContent, Button } from "@/components/ui-heroui";

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

/**
 * HeroUI v3 ActionCard
 * 替代旧版 Tailwind 卡片，统一按钮/卡片风格
 */
export function ActionCard({
  icon,
  title,
  description,
  href,
  primaryAction,
  secondaryAction,
}: ActionCardProps) {
  const cardContent = (
    <Card variant="default" className="group h-[96px]">
      <CardContent className="flex h-full items-center gap-4 p-5">
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
              <Link href={secondaryAction.href} onClick={(e) => e.stopPropagation()}>
                <Button variant="secondary" size="sm">
                  {secondaryAction.label}
                </Button>
              </Link>
            )}
            {primaryAction && (
              <Link href={primaryAction.href} onClick={(e) => e.stopPropagation()}>
                <Button variant="primary" size="sm">
                  {primaryAction.label}
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="flex-shrink-0 text-zinc-400 transition-transform group-hover:translate-x-0.5">
            →
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (href && !primaryAction && !secondaryAction) {
    return (
      <Link href={href} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}

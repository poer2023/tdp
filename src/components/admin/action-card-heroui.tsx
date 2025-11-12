"use client";

import Link from "next/link";
import { Card, Button } from "@/components/ui-heroui";

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
 * ActionCard 组件 - HeroUI v3 版本
 * 使用 HeroUI Card 和 Button 组件重构
 */
export function ActionCardHeroUI({
  icon,
  title,
  description,
  href,
  primaryAction,
  secondaryAction,
}: ActionCardProps) {
  const cardContent = (
    <Card variant="secondary" className="h-[96px]">
      <Card.Content className="flex h-full items-center gap-4 p-5">
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
      </Card.Content>
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

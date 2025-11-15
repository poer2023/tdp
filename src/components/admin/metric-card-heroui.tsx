import Link from "next/link";
import { Card } from "@/components/ui-heroui";

type MetricCardProps = {
  label: string;
  value: number | string;
  meta?: string;
  href?: string;
  alert?: boolean;
};

/**
 * MetricCard 组件 - HeroUI v3 版本
 * 使用 HeroUI Card 组件重构
 */
export function MetricCardHeroUI({ label, value, meta, href, alert }: MetricCardProps) {
  const cardContent = (
    <Card variant="secondary" className="min-h-[96px]">
      <Card.Content className="flex flex-col gap-2 p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{label}</span>
          {href && (
            <span className="text-xs font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100">
              View all →
            </span>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-semibold text-zinc-900 tabular-nums sm:text-3xl dark:text-zinc-100">
            {value}
          </p>
          {meta && (
            <p
              className={`text-xs ${
                alert
                  ? "font-medium text-zinc-800 dark:text-zinc-200"
                  : "text-zinc-500 dark:text-zinc-500"
              }`}
            >
              {meta}
            </p>
          )}
        </div>
      </Card.Content>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}

import Link from "next/link";
import { Card, CardContent } from "@/components/ui-heroui";

type MetricCardProps = {
  label: string;
  value: number | string;
  meta?: string;
  href?: string;
  alert?: boolean;
};

/**
 * HeroUI v3 MetricCard
 * 统一仪表盘指标样式
 */
export function MetricCard({ label, value, meta, href, alert }: MetricCardProps) {
  const cardContent = (
    <Card variant="default" className="min-h-[96px]">
      <CardContent className="flex flex-col gap-2 p-4 sm:p-5">
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
      </CardContent>
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

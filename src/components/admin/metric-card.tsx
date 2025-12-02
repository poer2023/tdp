import Link from "next/link";

type MetricCardProps = {
  label: string;
  value: number | string;
  meta?: string;
  href?: string;
  alert?: boolean;
};

export function MetricCard({ label, value, meta, href, alert }: MetricCardProps) {
  const content = (
    <div className="flex min-h-[96px] flex-col gap-2 rounded-xl border border-stone-200 bg-white p-4 transition-all duration-200 focus-within:border-sage-400 focus-within:ring-2 focus-within:ring-sage-200 hover:border-stone-300 sm:p-5 dark:border-stone-800 dark:bg-stone-950 dark:focus-within:border-sage-600 dark:focus-within:ring-sage-800 dark:hover:border-stone-700">
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-stone-600 dark:text-stone-400">{label}</span>
        {href && (
          <span className="text-xs font-medium text-stone-600 transition-colors hover:text-stone-900 dark:text-stone-500 dark:hover:text-stone-100">
            View all →
          </span>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-semibold text-stone-900 tabular-nums sm:text-3xl dark:text-stone-100">
          {value}
        </p>
        {meta && (
          <p
            className={`text-xs ${
              alert
                ? "font-medium text-stone-800 dark:text-stone-200"
                : "text-stone-500 dark:text-stone-500"
            }`}
          >
            {meta}
          </p>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

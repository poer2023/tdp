import Link from "next/link";

type MetricCardProps = {
  label: string;
  value: number;
  meta?: string;
  href?: string;
  alert?: boolean;
};

export function MetricCard({ label, value, meta, href, alert }: MetricCardProps) {
  const content = (
    <div className="flex min-h-[96px] flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-5 transition-all duration-200 focus-within:border-zinc-400 focus-within:ring-2 focus-within:ring-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-within:border-zinc-600 dark:focus-within:ring-zinc-800 dark:hover:border-zinc-700">
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{label}</span>
        {href && (
          <span className="text-xs font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100">
            View all →
          </span>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-semibold text-zinc-900 tabular-nums dark:text-zinc-100">
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

import Link from "next/link";

type MetricCardProps = {
  label: string;
  value: number | string;
  meta?: string;
  href?: string;
  icon?: React.ReactNode;
  iconColor?: string;
};

export function MetricCard({
  label,
  value,
  meta,
  href,
  icon,
  iconColor = "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400",
}: MetricCardProps) {
  const content = (
    <div className="flex items-center gap-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm transition-all duration-200 hover:border-stone-300 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700">
      {icon && <div className={`p-3 rounded-lg ${iconColor}`}>{icon}</div>}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
          {label}
        </p>
        <h3 className="text-2xl font-bold text-stone-900 dark:text-stone-100">{value}</h3>
        {meta && (
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{meta}</p>
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

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900 ${className}`}
    >
      <div className="mb-4 h-12 w-12 rounded-lg bg-stone-200 dark:bg-stone-800" />
      <div className="space-y-3">
        <div className="h-4 w-24 rounded bg-stone-200 dark:bg-stone-800" />
        <div className="h-8 w-32 rounded bg-stone-200 dark:bg-stone-800" />
        <div className="h-4 w-40 rounded bg-stone-200 dark:bg-stone-800" />
      </div>
    </div>
  );
}

export function SkeletonGrid({
  count = 4,
  className = "",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SearchResultSkeleton() {
  return (
    <div className="animate-pulse px-3 py-2.5">
      <div className="h-5 w-3/4 rounded bg-stone-200 dark:bg-stone-800" />
      <div className="mt-2 h-3.5 w-full rounded bg-stone-100 dark:bg-stone-900" />
      <div className="mt-1.5 flex items-center gap-2">
        <div className="h-4 w-12 rounded bg-stone-100 dark:bg-stone-900" />
        <div className="h-4 w-24 rounded bg-stone-100 dark:bg-stone-900" />
      </div>
    </div>
  );
}

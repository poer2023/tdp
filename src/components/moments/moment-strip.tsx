import { listMoments } from "@/lib/moments";
import { localePath } from "@/lib/locale-path";

export async function MomentStrip({ locale = "en" }: { locale?: "en" | "zh" }) {
  const moments = await listMoments({ limit: 6 });
  if (moments.length === 0) return null;
  return (
    <section className="mt-4 sm:mt-6">
      <div className="flex items-center justify-between px-0.5 sm:px-1">
        <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300">
          {locale === "zh" ? "最近瞬间" : "Recent Moments"}
        </h3>
        <a href={localePath(locale, "/moments")} className="text-xs text-stone-500 hover:underline">
          {locale === "zh" ? "查看全部" : "View all"}
        </a>
      </div>
      <div className="-mx-4 mt-2.5 overflow-x-auto px-4 sm:mx-0 sm:mt-3 sm:px-0">
        <div className="flex gap-2.5 pb-2 sm:gap-3">
          {moments.map((m) => (
            <a
              key={m.id}
              href={localePath(locale, `/moments/${m.slug || m.id}`)}
              className="w-[200px] flex-shrink-0 rounded-xl border border-stone-200 bg-white p-3 text-sm shadow-sm transition hover:bg-stone-50 sm:w-[220px] dark:border-stone-800 dark:bg-stone-900 dark:hover:bg-stone-800/80"
            >
              <p className="line-clamp-3 text-stone-800 dark:text-stone-200">{m.content}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

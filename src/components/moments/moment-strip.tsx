import { listMoments } from "@/lib/moments";
import { localePath } from "@/lib/locale-path";

export async function MomentStrip({ locale = "en" }: { locale?: "en" | "zh" }) {
  const moments = await listMoments({ limit: 6 });
  if (moments.length === 0) return null;
  return (
    <section className="mt-4 sm:mt-6">
      <div className="flex items-center justify-between px-0.5 sm:px-1">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          {locale === "zh" ? "最近瞬间" : "Recent Moments"}
        </h3>
        <a href={localePath(locale, "/m")} className="text-xs text-zinc-500 hover:underline">
          {locale === "zh" ? "查看全部" : "View all"}
        </a>
      </div>
      <div className="-mx-4 mt-2.5 overflow-x-auto px-4 sm:mx-0 sm:mt-3 sm:px-0">
        <div className="flex gap-2.5 pb-2 sm:gap-3">
          {moments.map((m) => (
            <a
              key={m.id}
              href={localePath(locale, `/m/${m.slug || m.id}`)}
              className="w-[200px] flex-shrink-0 rounded-xl border border-zinc-200 bg-white p-3 text-sm shadow-sm transition hover:bg-zinc-50 sm:w-[220px] dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/80"
            >
              <p className="line-clamp-3 text-zinc-800 dark:text-zinc-200">{m.content}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

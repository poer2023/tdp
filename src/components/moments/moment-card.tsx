import Link from "next/link";
import type { MomentImage } from "@/lib/moments";
import { localePath } from "@/lib/locale-path";

export function MomentCard({
  id,
  slug,
  content,
  images = [],
  createdAt,
  visibility,
  tags = [],
  locationName,
  locale = "en",
}: {
  id: string;
  slug: string | null;
  content: string;
  images?: MomentImage[] | null;
  createdAt: string | Date;
  visibility: "PUBLIC" | "UNLISTED" | "PRIVATE";
  tags?: string[];
  locationName?: string | null;
  locale?: "en" | "zh";
}) {
  const href = localePath(locale, `/m/${slug || id}`);
  const date = new Date(createdAt);
  const time = new Intl.RelativeTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    numeric: "auto",
  });
  const diffMinutes = Math.round((Date.now() - date.getTime()) / 60000);
  const rel =
    diffMinutes < 60
      ? time.format(-diffMinutes, "minute")
      : time.format(-Math.round(diffMinutes / 60), "hour");

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-2 flex items-center gap-2 text-xs text-zinc-500">
        <span>{rel}</span>
        {visibility !== "PUBLIC" && (
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] dark:bg-zinc-800">
            {visibility === "UNLISTED"
              ? locale === "zh"
                ? "未收录"
                : "Unlisted"
              : locale === "zh"
                ? "私密"
                : "Private"}
          </span>
        )}
      </div>
      <div className="text-[15px] leading-relaxed whitespace-pre-wrap text-zinc-900 dark:text-zinc-100">
        {content}
      </div>
      {images && images.length > 0 && (
        <div className="mt-3 overflow-hidden rounded-xl">
          {images.length === 1 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={images[0]!.url}
              alt={images[0]?.alt || ""}
              className="h-auto w-full object-cover"
            />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {images.slice(0, 4).map((im, idx) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={idx}
                  src={im.url}
                  alt={im.alt || ""}
                  className="h-28 w-full rounded-lg object-cover"
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-1 text-[11px] text-zinc-500">
          {locationName && <span>📍 {locationName}</span>}
          {tags.slice(0, 5).map((t) => (
            <span key={t} className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">
              #{t}
            </span>
          ))}
        </div>
        <Link
          href={href}
          className="text-xs font-medium text-zinc-600 underline underline-offset-2 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          {locale === "zh" ? "查看详情" : "View"}
        </Link>
      </div>
    </article>
  );
}

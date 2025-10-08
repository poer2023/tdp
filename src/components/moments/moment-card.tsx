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
  const detailHref = localePath(locale, `/m/${slug || id}`);
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
          {renderTwitterLikeGrid(images, detailHref)}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1 text-[11px] text-zinc-500">
        {locationName && <span>📍 {locationName}</span>}
        {tags.slice(0, 5).map((t) => (
          <span key={t} className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">
            #{t}
          </span>
        ))}
      </div>
    </article>
  );
}

function renderTwitterLikeGrid(images: MomentImage[], detailHref: string) {
  const count = images.length;

  if (count === 1) {
    const im = images[0]!;

    return (
      <a href={im.url} target="_blank" rel="noopener">
        <img
          src={im.previewUrl || im.url}
          alt={im.alt || ""}
          className="h-auto w-full object-cover"
        />
      </a>
    );
  }

  if (count === 2) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {images.slice(0, 2).map((im, i) => (
          <a key={i} href={im.url} target="_blank" rel="noopener">
            <img
              src={im.previewUrl || im.url}
              alt={im.alt || ""}
              className="h-48 w-full rounded-lg object-cover"
            />
          </a>
        ))}
      </div>
    );
  }

  if (count === 3) {
    // 左侧大图，右侧上下两个
    const [a, b, c] = images;
    return (
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          {}
          <a href={a!.url} target="_blank" rel="noopener">
            <img
              src={a!.previewUrl || a!.url}
              alt={a!.alt || ""}
              className="h-48 w-full rounded-lg object-cover"
            />
          </a>
        </div>
        <div className="flex flex-col gap-2">
          {}
          <a href={b!.url} target="_blank" rel="noopener">
            <img
              src={b!.previewUrl || b!.url}
              alt={b!.alt || ""}
              className="h-24 w-full rounded-lg object-cover"
            />
          </a>
          {}
          <a href={c!.url} target="_blank" rel="noopener">
            <img
              src={c!.previewUrl || c!.url}
              alt={c!.alt || ""}
              className="h-24 w-full rounded-lg object-cover"
            />
          </a>
        </div>
      </div>
    );
  }

  // 4 张或以上：2x2 网格，最后一格显示 +N 覆盖
  const first4 = images.slice(0, 4);
  const more = count - 4;
  return (
    <div className="grid grid-cols-2 gap-2">
      {first4.map((im, i) => (
        <div key={i} className="relative">
          {}
          <a href={im.url} target="_blank" rel="noopener">
            <img
              src={im.previewUrl || im.url}
              alt={im.alt || ""}
              className="h-36 w-full rounded-lg object-cover"
            />
          </a>
          {i === 3 && more > 0 && (
            <Link
              href={`${detailHref}?image=3`}
              className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 text-lg font-semibold text-white"
            >
              +{more}
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}

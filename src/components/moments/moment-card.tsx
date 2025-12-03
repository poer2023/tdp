import Link from "next/link";
import Image from "next/image";
import type { MomentImage } from "@/lib/moments";
import { localePath } from "@/lib/locale-path";
import { toOptimizedImageUrl } from "@/lib/image-proxy";

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
  const formattedDate = date.toLocaleString(locale === "zh" ? "zh-CN" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900">
      <div className="mb-2 flex items-center gap-2 text-xs text-stone-500">
        <span>{formattedDate}</span>
        {visibility !== "PUBLIC" && (
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] dark:bg-stone-800">
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
      <div className="text-[15px] leading-relaxed whitespace-pre-wrap text-stone-900 dark:text-stone-100">
        {content}
      </div>
      {images && images.length > 0 && (
        <div className="mt-3 overflow-hidden rounded-xl">
          {renderTwitterLikeGrid(images, detailHref)}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1 text-[11px] text-stone-500">
        {locationName && <span>📍 {locationName}</span>}
        {tags.slice(0, 5).map((t) => (
          <span key={t} className="rounded bg-stone-100 px-1.5 py-0.5 dark:bg-stone-800">
            #{t}
          </span>
        ))}
      </div>
    </article>
  );
}

function renderTwitterLikeGrid(images: MomentImage[] | null | unknown, detailHref: string) {
  if (!images || !Array.isArray(images) || images.length === 0) return null;

  const count = images.length;

  if (count === 1) {
    const im = images[0]!;
    const imgSrc = toOptimizedImageUrl(im.previewUrl || im.url) || im.url;

    return (
      <a
        href={im.url}
        target="_blank"
        rel="noopener"
          className="relative block aspect-[4/3] w-full"
      >
        <Image
          src={imgSrc}
          alt={im.alt || ""}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          loading="lazy"
        />
      </a>
    );
  }

  if (count === 2) {
    return (
      <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
        {images.slice(0, 2).map((im, i) => (
          <a
            key={i}
            href={im.url}
            target="_blank"
            rel="noopener"
            className="relative block h-40 overflow-hidden rounded-lg sm:h-48"
          >
            <Image
              src={toOptimizedImageUrl(im.previewUrl || im.url) || im.url}
              alt={im.alt || ""}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover"
              loading="lazy"
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
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        <div className="col-span-2">
          {}
          <a
            href={a!.url}
            target="_blank"
            rel="noopener"
            className="relative block h-40 overflow-hidden rounded-lg sm:h-48"
          >
            <Image
              src={toOptimizedImageUrl(a!.previewUrl || a!.url) || a!.url}
              alt={a!.alt || ""}
              fill
              sizes="(max-width: 768px) 66vw, 33vw"
              className="object-cover"
              loading="lazy"
            />
          </a>
        </div>
        <div className="flex flex-col gap-1.5 sm:gap-2">
          {}
          <a
            href={b!.url}
            target="_blank"
            rel="noopener"
            className="relative block h-[calc(50%-0.375rem)] overflow-hidden rounded-lg sm:h-[calc(50%-0.25rem)]"
          >
            <Image
              src={toOptimizedImageUrl(b!.previewUrl || b!.url) || b!.url}
              alt={b!.alt || ""}
              fill
              sizes="(max-width: 768px) 34vw, 17vw"
              className="object-cover"
              loading="lazy"
            />
          </a>
          {}
          <a
            href={c!.url}
            target="_blank"
            rel="noopener"
            className="relative block h-[calc(50%-0.375rem)] overflow-hidden rounded-lg sm:h-[calc(50%-0.25rem)]"
          >
            <Image
              src={toOptimizedImageUrl(c!.previewUrl || c!.url) || c!.url}
              alt={c!.alt || ""}
              fill
              sizes="(max-width: 768px) 34vw, 17vw"
              className="object-cover"
              loading="lazy"
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
    <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
      {first4.map((im, i) => (
        <div key={i} className="relative h-32 overflow-hidden rounded-lg sm:h-36">
          {}
          <a href={im.url} target="_blank" rel="noopener" className="relative block h-full w-full">
            <Image
              src={toOptimizedImageUrl(im.previewUrl || im.url) || im.url}
              alt={im.alt || ""}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover"
              loading="lazy"
            />
          </a>
          {i === 3 && more > 0 && (
            <Link
              href={`${detailHref}?image=3`}
              className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-black/50 text-lg font-semibold text-white"
            >
              +{more}
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}

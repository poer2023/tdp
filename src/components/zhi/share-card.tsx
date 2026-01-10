"use client";
/* eslint-disable @next/next/no-img-element */

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Heart, ExternalLink, Link2 } from "lucide-react";
import { getLocaleFromPathname } from "@/lib/i18n";
import { localePath } from "@/lib/locale-path";

interface ShareItem {
  id: string;
  title: string;
  description: string;
  url: string;
  domain: string;
  imageUrl?: string;
  date: string;
  tags: string[];
  likes: number;
}

interface ShareCardProps {
  item: ShareItem;
  onLike?: (id: string) => void;
}

export function ZhiShareCard({ item, onLike }: ShareCardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname) ?? "en";

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session) {
      router.push("/login");
      return;
    }
    onLike?.(item.id);
  };

  const handleExternalLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(item.url, "_blank", "noopener,noreferrer");
  };

  const detailPath = localePath(locale, `/curated/${item.id}`);

  return (
    <div className="group mb-8 break-inside-avoid">
      <Link href={detailPath} prefetch={false} className="block cursor-pointer">
        <div className="relative overflow-hidden rounded-xl border border-stone-200 bg-white transition-all duration-300 hover:shadow-lg dark:border-stone-800 dark:bg-stone-900">
          {/* Top: Image (if any) or pattern */}
          {item.imageUrl ? (
            <div className="relative h-32 w-full overflow-hidden">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute top-2 right-2 flex items-center gap-2">
                {/* External Link Button */}
                {item.url && (
                  <button
                    onClick={handleExternalLink}
                    className="flex cursor-pointer items-center gap-1 rounded bg-white/90 px-2 py-1 font-mono text-[10px] text-stone-700 backdrop-blur-md transition-colors hover:bg-white dark:bg-black/70 dark:text-stone-300 dark:hover:bg-black/90"
                    title={locale === "zh" ? "访问原站" : "Visit Site"}
                  >
                    <ExternalLink size={10} />
                  </button>
                )}
                {/* Domain Badge */}
                <div className="flex items-center gap-1 rounded bg-black/60 px-2 py-1 font-mono text-[10px] text-white backdrop-blur-md">
                  <Link2 size={10} /> {item.domain}
                </div>
              </div>
            </div>
          ) : (
            <div className="relative flex h-24 items-center justify-center overflow-hidden bg-stone-100 p-6 dark:bg-stone-800">
              <div
                className="absolute inset-0 opacity-10"
                style={{ backgroundImage: "radial-gradient(#888 1px, transparent 1px)", backgroundSize: "20px 20px" }}
              ></div>
              <div className="absolute top-2 right-2 flex items-center gap-2">
                {/* External Link Button */}
                {item.url && (
                  <button
                    onClick={handleExternalLink}
                    className="flex cursor-pointer items-center gap-1 rounded border border-stone-200 bg-white/80 px-2 py-1 font-mono text-[10px] text-stone-600 backdrop-blur-md transition-colors hover:bg-white dark:border-stone-700 dark:bg-black/50 dark:text-stone-300 dark:hover:bg-black/70"
                    title={locale === "zh" ? "访问原站" : "Visit Site"}
                  >
                    <ExternalLink size={10} />
                  </button>
                )}
                {/* Domain Badge */}
                <div className="flex items-center gap-1 rounded border border-stone-200 bg-white/80 px-2 py-1 font-mono text-[10px] text-stone-600 backdrop-blur-md dark:border-stone-700 dark:bg-black/50 dark:text-stone-300">
                  <Link2 size={10} /> {item.domain}
                </div>
              </div>
              <ExternalLink className="text-stone-300 dark:text-stone-600" size={32} />
            </div>
          )}

          {/* Content */}
          <div className="p-5">
            <h3 className="mb-2 font-bold leading-tight text-stone-800 transition-colors group-hover:text-sage-600 dark:text-stone-100 dark:group-hover:text-sage-400">
              {item.title}
            </h3>
            <p className="mb-4 line-clamp-2 text-sm text-stone-600 dark:text-stone-400">
              {item.description}
            </p>

            <div className="mt-2 flex items-center justify-between border-t border-stone-100 pt-3 dark:border-stone-800">
              <div className="flex flex-wrap gap-2 text-[10px] text-stone-400">
                {item.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="rounded bg-stone-100 px-1.5 py-0.5 dark:bg-stone-800">
                    #{tag}
                  </span>
                ))}
                {item.tags.length > 3 && (
                  <span className="text-stone-400">+{item.tags.length - 3}</span>
                )}
              </div>
              <button
                onClick={handleLike}
                className={`relative z-10 flex cursor-pointer items-center gap-1 text-xs transition-colors hover:text-rose-500 ${item.likes > 0 ? "text-rose-500" : "text-stone-400"
                  }`}
              >
                <Heart size={12} className={item.likes > 0 ? "fill-current" : ""} />
                <span>{item.likes}</span>
              </button>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default ZhiShareCard;

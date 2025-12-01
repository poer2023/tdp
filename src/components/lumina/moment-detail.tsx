"use client";

import React, { useEffect, useCallback } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Heart, X, Calendar } from "lucide-react";
import { getLocaleFromPathname } from "@/lib/i18n";
import type { FeedMoment } from "./feed";

interface MomentDetailProps {
  moment: FeedMoment;
  onClose: () => void;
  onLike?: (id: string) => void;
}

export function LuminaMomentDetail({ moment, onClose, onLike }: MomentDetailProps) {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname) ?? "en";
  const hasImages = moment.images && moment.images.length > 0;

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      en: {
        likes: "likes",
      },
      zh: {
        likes: "赞",
      },
    };
    return translations[locale]?.[key] || key;
  };

  // Handle ESC key to close modal
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLike?.(moment.id);
  };

  return (
    <div
      className="animate-in fade-in fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm duration-200"
      onClick={handleBackdropClick}
    >
      <div
        className={`animate-in zoom-in-95 relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl duration-300 md:flex-row dark:bg-stone-900 ${
          hasImages ? "max-w-4xl" : "max-w-xl"
        }`}
      >
        {/* Close button for Mobile (Absolute) */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-20 rounded-full bg-black/20 p-2 text-white transition-colors hover:bg-black/40 md:hidden"
        >
          <X size={20} />
        </button>

        {/* Left Side: Images (Scrollable if multiple) */}
        {hasImages && (
          <div className="flex max-h-[40vh] w-full items-center justify-center overflow-y-auto bg-stone-950 md:max-h-full md:w-3/5">
            <div className="flex w-full flex-col gap-1 p-0">
              {moment.images!.map((img, idx) => (
                <div key={idx} className="relative w-full">
                  <Image
                    src={img}
                    alt={`Detail ${idx + 1}`}
                    width={800}
                    height={600}
                    className="h-auto max-h-[80vh] w-full object-contain"
                    priority={idx === 0}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Right Side: Content */}
        <div className={`flex h-full flex-col ${hasImages ? "w-full md:w-2/5" : "w-full"}`}>
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-100 bg-white p-4 md:p-6 dark:border-stone-800 dark:bg-stone-900">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sage-100 to-stone-200 font-serif font-bold text-stone-600 dark:from-stone-800 dark:to-stone-700 dark:text-stone-300">
                L
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100">Lumina</h3>
                <span className="flex items-center gap-1 text-xs text-stone-400">
                  <Calendar size={10} /> {moment.date}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="hidden text-stone-400 hover:text-stone-800 md:block dark:hover:text-stone-200"
            >
              <X size={24} />
            </button>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto bg-stone-50/50 p-4 md:p-6 dark:bg-stone-950/50">
            <p
              className={`whitespace-pre-wrap font-serif leading-relaxed text-stone-800 dark:text-stone-200 ${
                hasImages ? "text-base md:text-lg" : "text-lg md:text-xl"
              }`}
            >
              {moment.content}
            </p>

            {moment.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {moment.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-sage-50 px-2 py-1 text-xs font-medium text-sage-600 dark:bg-sage-900/20 dark:text-sage-400"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-stone-100 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                  moment.likes > 0 ? "text-rose-500" : "text-stone-400 hover:text-rose-500"
                }`}
              >
                <Heart size={20} className={moment.likes > 0 ? "fill-current" : ""} />
                <span>
                  {moment.likes || 0} {t("likes")}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LuminaMomentDetail;

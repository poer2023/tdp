"use client";

import React, { useEffect, useCallback, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Heart, X, Calendar, MessageCircle, ChevronUp } from "lucide-react";
import { getLocaleFromPathname } from "@/lib/i18n";

// Import from extracted modules
import type { MomentDetailProps } from "./types";
import { getMomentDetailTranslation } from "./translations";
import { useComments, useImageCarousel } from "./hooks";
import { CommentList } from "./comment-list";
import { CommentInput } from "./comment-input";

export function ZhiMomentDetail({ moment, onClose, onLike }: MomentDetailProps) {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname) ?? "en";
  const hasImages = moment.images && moment.images.length > 0;
  const { data: session } = useSession();

  const [likeCount, setLikeCount] = useState(moment.likes);
  const [liked, setLiked] = useState(Boolean(moment.liked));
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const resetTimer = window.setTimeout(() => {
      if (!cancelled) {
        setLikeCount(moment.likes);
        setLiked(Boolean(moment.liked));
      }
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(resetTimer);
    };
  }, [moment.id, moment.likes, moment.liked]);

  const imageCount = moment.images?.length || 0;

  // Use extracted hooks
  const commentsHook = useComments({ momentId: moment.id });
  const { fetchComments } = commentsHook;
  const carousel = useImageCarousel({ imageCount });

  const t = (key: string) => getMomentDetailTranslation(locale, key);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (drawerOpen) {
          setDrawerOpen(false);
        } else {
          onClose();
        }
      }
      if (imageCount > 1 && !drawerOpen) {
        if (e.key === "ArrowLeft") carousel.goToPrev();
        else if (e.key === "ArrowRight") carousel.goToNext();
      }
    },
    [onClose, drawerOpen, imageCount, carousel]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    fetchComments();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown, fetchComments]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    (async () => {
      try {
        const res = await onLike?.(moment.id);
        if (res && typeof res === "object" && "likeCount" in res) {
          setLikeCount(res.likeCount ?? likeCount);
          setLiked(res.liked ?? liked);
        } else {
          setLiked((prev) => !prev);
          setLikeCount((prev) => Math.max(0, prev + (liked ? -1 : 1)));
        }
      } catch (error) {
        console.error("Failed to like moment", error);
      }
    })();
  };

  const formatDate = (dateString: string) => commentsHook.formatCommentDate(dateString, locale);

  return (
    <>
      {/* ==================== MOBILE LAYOUT ==================== */}
      <div className="md:hidden fixed inset-0 z-[60] bg-black" onClick={handleBackdropClick}>
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-[70] rounded-full bg-black/40 p-2 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/60 hover:text-white"
        >
          <X size={22} />
        </button>

        <div
          className="flex h-full w-full items-center justify-center relative"
          onTouchStart={carousel.handleTouchStart}
          onTouchMove={carousel.handleTouchMove}
          onTouchEnd={carousel.handleTouchEnd}
        >
          {hasImages ? (
            <>
              <Image
                src={moment.images?.[carousel.currentImageIndex]?.mediumUrl || moment.images?.[carousel.currentImageIndex]?.url || ""}
                alt={`Moment image ${carousel.currentImageIndex + 1}`}
                width={1200}
                height={900}
                className="max-h-full max-w-full object-contain select-none pointer-events-none"
                priority
                draggable={false}
              />
              {imageCount > 1 && (
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[66] flex gap-1.5">
                  {moment.images!.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => { e.stopPropagation(); carousel.setCurrentImageIndex(idx); }}
                      className={`h-2 rounded-full transition-all ${idx === carousel.currentImageIndex ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/70"}`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center p-8">
              <p className="text-center font-serif text-xl leading-relaxed text-white/90">{moment.content}</p>
            </div>
          )}
        </div>

        {/* Floating Action Bar */}
        <div className="absolute bottom-0 inset-x-0 z-[65] bg-gradient-to-t from-black/90 via-black/60 to-transparent pb-6 pt-16 px-4">
          <div className="flex items-center gap-3 mb-3">
            {moment.author?.image ? (
              <Image src={moment.author.image} alt={moment.author.name || "Author"} width={36} height={36} className="h-9 w-9 rounded-full object-cover ring-2 ring-white/20" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 font-serif font-bold text-white">
                {moment.author?.name?.[0]?.toUpperCase() || "?"}
              </div>
            )}
            <div>
              <h3 className="text-sm font-semibold text-white">{moment.author?.name || "Anonymous"}</h3>
              <span className="text-xs text-white/60">{moment.date}</span>
            </div>
          </div>
          {hasImages && moment.content && (
            <p className="text-sm text-white/85 leading-relaxed line-clamp-2 mb-4">{moment.content}</p>
          )}
          <div className="flex items-center gap-6">
            <button onClick={handleLike} className={`flex items-center gap-2 text-sm font-medium transition-colors ${liked ? "text-rose-400" : "text-white/80 hover:text-white"}`}>
              <Heart size={22} className={liked ? "fill-current" : ""} />
              <span>{likeCount || 0}</span>
            </button>
            <button onClick={() => setDrawerOpen(true)} className="flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white transition-colors">
              <MessageCircle size={22} />
              <span>{commentsHook.comments.length}</span>
            </button>
          </div>
        </div>

        {/* Mobile Bottom Drawer */}
        <div className={`fixed inset-x-0 bottom-0 z-[75] transform transition-transform duration-300 ease-out ${drawerOpen ? "translate-y-0" : "translate-y-full"}`}>
          {drawerOpen && <div className="fixed inset-0 bg-black/40 -z-10" onClick={() => setDrawerOpen(false)} />}
          <div className="bg-white dark:bg-stone-900 rounded-t-2xl max-h-[75vh] flex flex-col">
            <button onClick={() => setDrawerOpen(false)} className="w-full py-3 flex flex-col items-center gap-1">
              <div className="w-10 h-1 bg-stone-300 dark:bg-stone-600 rounded-full" />
              <ChevronUp size={16} className="text-stone-400 rotate-180" />
            </button>
            <div className="px-4 pb-3 border-b border-stone-100 dark:border-stone-800">
              <h3 className="font-semibold text-stone-800 dark:text-stone-100">{t("comments")} ({commentsHook.comments.length})</h3>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <CommentList comments={commentsHook.comments} isLoading={commentsHook.isLoading} formatCommentDate={formatDate} t={t} />
            </div>
            <CommentInput
              value={commentsHook.newComment}
              onChange={commentsHook.setNewComment}
              onSubmit={commentsHook.handleSubmitComment}
              isSubmitting={commentsHook.isSubmitting}
              isLoggedIn={!!session?.user}
              t={t}
              variant="mobile"
            />
          </div>
        </div>
      </div>

      {/* ==================== DESKTOP LAYOUT ==================== */}
      <div className="animate-in fade-in hidden md:flex fixed inset-0 z-[60] items-center justify-center bg-black/60 p-4 backdrop-blur-sm duration-200" onClick={handleBackdropClick}>
        <div className={`animate-in zoom-in-95 relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl duration-300 md:flex-row dark:bg-stone-900 ${hasImages ? "max-w-4xl" : "max-w-xl"}`}>
          {hasImages && (
            <div className="w-full overflow-y-auto bg-stone-950 md:w-3/5 md:max-h-[90vh]">
              <div className="flex w-full flex-col">
                {moment.images!.map((img, idx) => (
                  <div key={idx} className="relative w-full flex items-center justify-center">
                    <Image src={img.mediumUrl || img.url} alt={`Detail ${idx + 1}`} width={1200} height={900} className="w-full h-auto object-contain" priority={idx === 0} sizes="(max-width: 768px) 100vw, 60vw" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={`flex h-full flex-col ${hasImages ? "w-full md:w-2/5" : "w-full"}`}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-100 bg-white p-4 md:p-6 dark:border-stone-800 dark:bg-stone-900">
              <div className="flex items-center gap-3">
                {moment.author?.image ? (
                  <Image src={moment.author.image} alt={moment.author.name || "Author"} width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sage-100 to-stone-200 font-serif font-bold text-stone-600 dark:from-stone-800 dark:to-stone-700 dark:text-stone-300">
                    {moment.author?.name?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100">{moment.author?.name || "Anonymous"}</h3>
                  <span className="flex items-center gap-1 text-xs text-stone-400"><Calendar size={10} /> {moment.date}</span>
                </div>
              </div>
              <button onClick={onClose} className="text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto bg-stone-50/50 dark:bg-stone-950/50">
              <div className="p-4 md:p-6">
                <p className={`whitespace-pre-wrap font-serif leading-relaxed text-stone-800 dark:text-stone-200 ${hasImages ? "text-base md:text-lg" : "text-lg md:text-xl"}`}>{moment.content}</p>
                {moment.tags.length > 0 && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {moment.tags.map((tag) => (
                      <span key={tag} className="rounded bg-sage-50 px-2 py-1 text-xs font-medium text-sage-600 dark:bg-sage-900/20 dark:text-sage-400">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="border-t border-stone-100 p-4 md:p-6 dark:border-stone-800">
                <div className="mb-4 flex items-center gap-2 text-sm font-medium text-stone-600 dark:text-stone-400">
                  <MessageCircle size={16} />
                  <span>{t("comments")} ({commentsHook.comments.length})</span>
                </div>
                <CommentList comments={commentsHook.comments} isLoading={commentsHook.isLoading} formatCommentDate={formatDate} t={t} />
              </div>
            </div>

            <div className="border-t border-stone-100 bg-white dark:border-stone-800 dark:bg-stone-900">
              <div className="flex items-center gap-4 border-b border-stone-100 p-4 dark:border-stone-800">
                <button onClick={handleLike} className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${liked ? "text-rose-500" : "text-stone-400 hover:text-rose-500"}`}>
                  <Heart size={20} className={liked ? "fill-current" : ""} />
                  <span>{likeCount || 0} {t("likes")}</span>
                </button>
              </div>
              <CommentInput
                value={commentsHook.newComment}
                onChange={commentsHook.setNewComment}
                onSubmit={commentsHook.handleSubmitComment}
                isSubmitting={commentsHook.isSubmitting}
                isLoggedIn={!!session?.user}
                t={t}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ZhiMomentDetail;

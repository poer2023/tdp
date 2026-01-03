"use client";

import React, { useEffect, useCallback, useState, useRef } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Heart, X, Calendar, MessageCircle, Send, User, ChevronUp } from "lucide-react";
import { getLocaleFromPathname } from "@/lib/i18n";
import type { FeedMoment } from "./feed";

interface MomentComment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface MomentDetailProps {
  moment: FeedMoment;
  onClose: () => void;
  onLike?: (id: string) => Promise<{ liked: boolean; likeCount: number } | void> | void;
}

export function ZhiMomentDetail({ moment, onClose, onLike }: MomentDetailProps) {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname) ?? "en";
  const hasImages = moment.images && moment.images.length > 0;
  const { data: session } = useSession();

  const [likeCount, setLikeCount] = useState(moment.likes);
  const [liked, setLiked] = useState(Boolean(moment.liked));

  const [comments, setComments] = useState<MomentComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mobile drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Image carousel state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const imageCount = moment.images?.length || 0;

  // Touch swipe state for mobile image navigation
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 50; // minimum distance for a swipe

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) {
      touchStartX.current = touch.clientX;
      touchEndX.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) {
      touchEndX.current = touch.clientX;
    }
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;

    const distance = touchStartX.current - touchEndX.current;
    const isSwipe = Math.abs(distance) > minSwipeDistance;

    if (isSwipe && imageCount > 1) {
      if (distance > 0) {
        // Swiped left -> next image
        setCurrentImageIndex((prev) => (prev + 1) % imageCount);
      } else {
        // Swiped right -> previous image
        setCurrentImageIndex((prev) => (prev - 1 + imageCount) % imageCount);
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      en: {
        likes: "likes",
        comments: "Comments",
        noComments: "No comments yet",
        writeComment: "Write a comment...",
        loginToComment: "Login to comment",
        send: "Send",
        viewComments: "View comments",
      },
      zh: {
        likes: "赞",
        comments: "评论",
        noComments: "暂无评论",
        writeComment: "写下你的评论...",
        loginToComment: "登录后评论",
        send: "发送",
        viewComments: "查看评论",
      },
    };
    return translations[locale]?.[key] || key;
  };

  useEffect(() => {
    setLikeCount(moment.likes);
    setLiked(Boolean(moment.liked));
  }, [moment.id, moment.likes, moment.liked]);

  // Fetch comments
  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/moments/${moment.id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setIsLoading(false);
    }
  }, [moment.id]);

  // Submit comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !session?.user) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/moments/${moment.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [...prev, data.comment]);
        setNewComment("");
      }
    } catch (error) {
      console.error("Failed to submit comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
      // Image navigation with arrow keys
      if (imageCount > 1 && !drawerOpen) {
        if (e.key === "ArrowLeft") {
          setCurrentImageIndex((prev) => (prev - 1 + imageCount) % imageCount);
        } else if (e.key === "ArrowRight") {
          setCurrentImageIndex((prev) => (prev + 1) % imageCount);
        }
      }
    },
    [onClose, drawerOpen, imageCount]
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

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
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

  const formatCommentDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      {/* ==================== MOBILE LAYOUT ==================== */}
      <div className="md:hidden fixed inset-0 z-[60] bg-black" onClick={handleBackdropClick}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-[70] rounded-full bg-black/40 p-2 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/60 hover:text-white"
        >
          <X size={22} />
        </button>

        {/* Fullscreen Image Container with Swipe Support */}
        <div
          className="flex h-full w-full items-center justify-center relative"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {hasImages ? (
            <>
              {/* Current Image */}
              <Image
                src={moment.images?.[currentImageIndex]?.url || ""}
                alt={`Moment image ${currentImageIndex + 1}`}
                width={1200}
                height={900}
                className="max-h-full max-w-full object-contain select-none pointer-events-none"
                priority
                draggable={false}
              />

              {/* Dot Indicators (only if multiple images) */}
              {imageCount > 1 && (
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[66] flex gap-1.5">
                  {moment.images!.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex(idx);
                      }}
                      className={`h-2 rounded-full transition-all ${idx === currentImageIndex
                        ? "w-6 bg-white"
                        : "w-2 bg-white/50 hover:bg-white/70"
                        }`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center p-8">
              <p className="text-center font-serif text-xl leading-relaxed text-white/90">
                {moment.content}
              </p>
            </div>
          )}
        </div>

        {/* Floating Action Bar - Bottom of screen */}
        <div className="absolute bottom-0 inset-x-0 z-[65] bg-gradient-to-t from-black/90 via-black/60 to-transparent pb-6 pt-16 px-4">
          {/* Author Info */}
          <div className="flex items-center gap-3 mb-3">
            {moment.author?.image ? (
              <Image
                src={moment.author.image}
                alt={moment.author.name || "Author"}
                width={36}
                height={36}
                className="h-9 w-9 rounded-full object-cover ring-2 ring-white/20"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 font-serif font-bold text-white">
                {moment.author?.name?.[0]?.toUpperCase() || "?"}
              </div>
            )}
            <div>
              <h3 className="text-sm font-semibold text-white">
                {moment.author?.name || "Anonymous"}
              </h3>
              <span className="text-xs text-white/60">{moment.date}</span>
            </div>
          </div>

          {/* Content Preview (if has images, show content here) */}
          {hasImages && moment.content && (
            <p className="text-sm text-white/85 leading-relaxed line-clamp-2 mb-4">
              {moment.content}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-6">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${liked ? "text-rose-400" : "text-white/80 hover:text-white"
                }`}
            >
              <Heart size={22} className={liked ? "fill-current" : ""} />
              <span>{likeCount || 0}</span>
            </button>

            <button
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              <MessageCircle size={22} />
              <span>{comments.length}</span>
            </button>
          </div>
        </div>

        {/* Mobile Bottom Drawer for Comments */}
        <div
          className={`fixed inset-x-0 bottom-0 z-[75] transform transition-transform duration-300 ease-out ${drawerOpen ? "translate-y-0" : "translate-y-full"
            }`}
        >
          {/* Backdrop for drawer */}
          {drawerOpen && (
            <div
              className="fixed inset-0 bg-black/40 -z-10"
              onClick={() => setDrawerOpen(false)}
            />
          )}

          {/* Drawer Content */}
          <div className="bg-white dark:bg-stone-900 rounded-t-2xl max-h-[75vh] flex flex-col">
            {/* Drawer Handle */}
            <button
              onClick={() => setDrawerOpen(false)}
              className="w-full py-3 flex flex-col items-center gap-1"
            >
              <div className="w-10 h-1 bg-stone-300 dark:bg-stone-600 rounded-full" />
              <ChevronUp size={16} className="text-stone-400 rotate-180" />
            </button>

            {/* Comments Header */}
            <div className="px-4 pb-3 border-b border-stone-100 dark:border-stone-800">
              <h3 className="font-semibold text-stone-800 dark:text-stone-100">
                {t("comments")} ({comments.length})
              </h3>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {isLoading ? (
                <div className="py-8 text-center text-sm text-stone-400">Loading...</div>
              ) : comments.length === 0 ? (
                <p className="py-8 text-center text-sm italic text-stone-400">
                  {t("noComments")}
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700">
                      {comment.author.image ? (
                        <Image
                          src={comment.author.image}
                          alt={comment.author.name || "User"}
                          width={32}
                          height={32}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User size={16} className="text-stone-500 dark:text-stone-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium text-stone-800 dark:text-stone-200">
                          {comment.author.name || "Anonymous"}
                        </span>
                        <span className="text-xs text-stone-400">
                          {formatCommentDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment Input */}
            <form
              onSubmit={handleSubmitComment}
              className="flex items-center gap-2 p-4 border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50"
            >
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={session?.user ? t("writeComment") : t("loginToComment")}
                disabled={!session?.user || isSubmitting}
                className="flex-1 rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-800 placeholder-stone-400 outline-none transition-colors focus:border-sage-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-200 dark:placeholder-stone-400"
              />
              <button
                type="submit"
                disabled={!session?.user || !newComment.trim() || isSubmitting}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-500 text-white transition-colors hover:bg-sage-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ==================== DESKTOP LAYOUT (Original) ==================== */}
      <div
        className="animate-in fade-in hidden md:flex fixed inset-0 z-[60] items-center justify-center bg-black/60 p-4 backdrop-blur-sm duration-200"
        onClick={handleBackdropClick}
      >
        <div
          className={`animate-in zoom-in-95 relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl duration-300 md:flex-row dark:bg-stone-900 ${hasImages ? "max-w-4xl" : "max-w-xl"
            }`}
        >
          {/* Left Side: Images (Scrollable if multiple) */}
          {hasImages && (
            <div className="w-full overflow-y-auto bg-stone-950 md:w-3/5 md:max-h-[90vh] flex items-center">
              <div className="flex w-full flex-col">
                {moment.images!.map((img, idx) => (
                  <div key={idx} className="relative w-full flex items-center justify-center">
                    <Image
                      src={img.url}
                      alt={`Detail ${idx + 1}`}
                      width={1200}
                      height={900}
                      className="w-full h-auto object-contain max-h-[90vh]"
                      priority={idx === 0}
                      sizes="(max-width: 768px) 100vw, 60vw"
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
                {moment.author?.image ? (
                  <Image
                    src={moment.author.image}
                    alt={moment.author.name || "Author"}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sage-100 to-stone-200 font-serif font-bold text-stone-600 dark:from-stone-800 dark:to-stone-700 dark:text-stone-300">
                    {moment.author?.name?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100">
                    {moment.author?.name || "Anonymous"}
                  </h3>
                  <span className="flex items-center gap-1 text-xs text-stone-400">
                    <Calendar size={10} /> {moment.date}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-stone-400 hover:text-stone-800 dark:hover:text-stone-200"
              >
                <X size={24} />
              </button>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto bg-stone-50/50 dark:bg-stone-950/50">
              {/* Moment Content */}
              <div className="p-4 md:p-6">
                <p
                  className={`whitespace-pre-wrap font-serif leading-relaxed text-stone-800 dark:text-stone-200 ${hasImages ? "text-base md:text-lg" : "text-lg md:text-xl"
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

              {/* Comments Section */}
              <div className="border-t border-stone-100 p-4 md:p-6 dark:border-stone-800">
                <div className="mb-4 flex items-center gap-2 text-sm font-medium text-stone-600 dark:text-stone-400">
                  <MessageCircle size={16} />
                  <span>
                    {t("comments")} ({comments.length})
                  </span>
                </div>

                {/* Comments List */}
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="py-4 text-center text-sm text-stone-400">Loading...</div>
                  ) : comments.length === 0 ? (
                    <p className="py-4 text-center text-sm italic text-stone-400">
                      {t("noComments")}
                    </p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700">
                          {comment.author.image ? (
                            <Image
                              src={comment.author.image}
                              alt={comment.author.name || "User"}
                              width={32}
                              height={32}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <User size={16} className="text-stone-500 dark:text-stone-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-medium text-stone-800 dark:text-stone-200">
                              {comment.author.name || "Anonymous"}
                            </span>
                            <span className="text-xs text-stone-400">
                              {formatCommentDate(comment.createdAt)}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Footer with Like & Comment Input */}
            <div className="border-t border-stone-100 bg-white dark:border-stone-800 dark:bg-stone-900">
              {/* Like Button */}
              <div className="flex items-center gap-4 border-b border-stone-100 p-4 dark:border-stone-800">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${liked ? "text-rose-500" : "text-stone-400 hover:text-rose-500"
                    }`}
                >
                  <Heart size={20} className={liked ? "fill-current" : ""} />
                  <span>
                    {likeCount || 0} {t("likes")}
                  </span>
                </button>
              </div>

              {/* Comment Input */}
              <form onSubmit={handleSubmitComment} className="flex items-center gap-2 p-4">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={session?.user ? t("writeComment") : t("loginToComment")}
                  disabled={!session?.user || isSubmitting}
                  className="flex-1 rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm text-stone-800 placeholder-stone-400 outline-none transition-colors focus:border-sage-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 dark:placeholder-stone-500 dark:focus:border-sage-500"
                />
                <button
                  type="submit"
                  disabled={!session?.user || !newComment.trim() || isSubmitting}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-500 text-white transition-colors hover:bg-sage-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ZhiMomentDetail;

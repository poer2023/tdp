"use client";

import React, { useEffect, useCallback, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Heart, X, Calendar, MessageCircle, Send, User } from "lucide-react";
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

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      en: {
        likes: "likes",
        comments: "Comments",
        noComments: "No comments yet",
        writeComment: "Write a comment...",
        loginToComment: "Login to comment",
        send: "Send",
      },
      zh: {
        likes: "赞",
        comments: "评论",
        noComments: "暂无评论",
        writeComment: "写下你的评论...",
        loginToComment: "登录后评论",
        send: "发送",
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
    <div
      className="animate-in fade-in fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm duration-200"
      onClick={handleBackdropClick}
    >
      <div
        className={`animate-in zoom-in-95 relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl duration-300 md:flex-row dark:bg-stone-900 ${hasImages ? "max-w-4xl" : "max-w-xl"
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
              className="hidden text-stone-400 hover:text-stone-800 md:block dark:hover:text-stone-200"
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
  );
}

export default ZhiMomentDetail;

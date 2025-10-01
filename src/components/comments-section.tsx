"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { signIn } from "next-auth/react";
import Image from "next/image";

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  author: {
    name: string | null;
    image: string | null;
  };
  replies?: Comment[];
};

type CommentsSectionProps = {
  slug: string;
  locale?: "EN" | "ZH";
};

export function CommentsSection({ slug, locale = "EN" }: CommentsSectionProps) {
  const { data: session, status } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Fetch comments
  useEffect(() => {
    fetch(`/api/posts/${slug}/comments?locale=${locale}`)
      .then((res) => res.json())
      .then((data) => setComments(data.comments || []))
      .catch(console.error);
  }, [slug, locale]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/posts/${slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          parentId: replyTo,
          locale,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
        setContent("");
        setReplyTo(null);

        // Refresh comments if published immediately
        if (data.comment.status === "PUBLISHED") {
          const refreshRes = await fetch(`/api/posts/${slug}/comments?locale=${locale}`);
          const refreshData = await refreshRes.json();
          setComments(refreshData.comments || []);
        }
      } else {
        setMessage(data.error || "Failed to post comment");
      }
    } catch (error) {
      setMessage("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return <div className="animate-pulse">Loading comments...</div>;
  }

  return (
    <section className="mt-16 border-t border-zinc-200 pt-8 dark:border-zinc-800">
      <h2 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        Comments ({comments.length})
      </h2>

      {/* Comment Form */}
      {status === "authenticated" ? (
        <form onSubmit={handleSubmit} className="mb-8">
          {replyTo && (
            <div className="mb-2 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <span>Replying to comment</span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                Cancel
              </button>
            </div>
          )}

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={locale === "ZH" ? "发表评论..." : "Write a comment..."}
            rows={4}
            maxLength={2000}
            className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-zinc-900 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-400"
          />

          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {content.length}/2000
            </span>
            <button
              type="submit"
              disabled={!content.trim() || isSubmitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (locale === "ZH" ? "发送中..." : "Posting...") : (locale === "ZH" ? "发表评论" : "Post Comment")}
            </button>
          </div>

          {message && (
            <p className={`mt-2 text-sm ${message.includes("error") || message.includes("Failed") ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
              {message}
            </p>
          )}
        </form>
      ) : (
        <div className="mb-8 rounded-lg border border-zinc-200 bg-zinc-50 p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="mb-3 text-zinc-600 dark:text-zinc-400">
            {locale === "ZH" ? "登录后发表评论" : "Sign in to comment"}
          </p>
          <button
            onClick={() => signIn("google", { callbackUrl: window.location.pathname })}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {locale === "ZH" ? "登录" : "Sign In"}
          </button>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-6">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            onReply={(id) => setReplyTo(id)}
            locale={locale}
          />
        ))}
      </div>

      {comments.length === 0 && (
        <p className="text-center text-zinc-500 dark:text-zinc-400">
          {locale === "ZH" ? "还没有评论" : "No comments yet"}
        </p>
      )}
    </section>
  );
}

function CommentItem({
  comment,
  onReply,
  locale,
  isReply = false,
}: {
  comment: Comment;
  onReply: (id: string) => void;
  locale: "EN" | "ZH";
  isReply?: boolean;
}) {
  const { status } = useSession();

  return (
    <div className={`flex gap-3 ${isReply ? "ml-12 border-l-2 border-zinc-200 pl-4 dark:border-zinc-800" : ""}`}>
      {comment.author.image ? (
        <Image
          src={comment.author.image}
          alt={comment.author.name || "User"}
          width={40}
          height={40}
          className="h-10 w-10 rounded-full"
        />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {comment.author.name?.charAt(0).toUpperCase() || "U"}
          </span>
        </div>
      )}

      <div className="flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {comment.author.name || "Anonymous"}
          </span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {new Date(comment.createdAt).toLocaleDateString(
              locale === "ZH" ? "zh-CN" : "en-US",
              { year: "numeric", month: "short", day: "numeric" }
            )}
          </span>
        </div>

        <p className="text-zinc-700 dark:text-zinc-300">{comment.content}</p>

        {!isReply && status === "authenticated" && (
          <button
            onClick={() => onReply(comment.id)}
            className="mt-2 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            {locale === "ZH" ? "回复" : "Reply"}
          </button>
        )}

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-4">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                onReply={onReply}
                locale={locale}
                isReply={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

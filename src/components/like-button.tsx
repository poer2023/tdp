"use client";

import { useState, useEffect } from "react";

type LikeButtonProps = {
  slug: string;
  locale?: "EN" | "ZH";
};

export function LikeButton({ slug, locale = "EN" }: LikeButtonProps) {
  const [likeCount, setLikeCount] = useState<number>(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch initial like count
  useEffect(() => {
    fetch(`/api/posts/${slug}/reactions?locale=${locale}`)
      .then((res) => res.json())
      .then((data) => setLikeCount(data.likeCount))
      .catch(console.error);
  }, [slug, locale]);

  const handleLike = async () => {
    if (isLiked || isLoading) return;

    setIsLoading(true);

    try {
      const res = await fetch(`/api/posts/${slug}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });

      if (res.ok) {
        const data = await res.json();
        setLikeCount(data.likeCount);
        setIsLiked(true);
      } else if (res.status === 429) {
        alert("Rate limit exceeded. Please try again later.");
      }
    } catch (error) {
      console.error("Failed to like post:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={isLiked || isLoading}
      className={`flex items-center gap-2 rounded-lg border px-4 py-2 transition-colors ${
        isLiked
          ? "border-red-300 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400"
          : "border-zinc-200 bg-white text-zinc-700 hover:border-red-300 hover:bg-red-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-red-800 dark:hover:bg-red-950"
      } ${isLoading ? "cursor-wait opacity-50" : ""} ${isLiked ? "cursor-not-allowed" : "cursor-pointer"}`}
    >
      <svg
        className={`h-5 w-5 transition-transform ${isLiked ? "scale-110" : ""}`}
        fill={isLiked ? "currentColor" : "none"}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      <span className="font-medium">{likeCount}</span>
      {isLiked && <span className="text-xs">Liked</span>}
    </button>
  );
}

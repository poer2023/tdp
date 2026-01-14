"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";

type LikeButtonProps = {
  slug: string;
  locale?: "EN" | "ZH";
};

type LikeState = {
  likeCount: number;
  isLiked: boolean;
};

export function LikeButton({ slug, locale = "EN" }: LikeButtonProps) {
  const [serverState, setServerState] = useState<LikeState>({
    likeCount: 0,
    isLiked: false,
  });
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastClickTime = useRef<number>(0);
  const prefersReducedMotion = useReducedMotion();

  const [displayState, setDisplayState] = useState<LikeState>(serverState);

  useEffect(() => {
    setDisplayState(serverState);
  }, [serverState]);

  // Fetch initial like count and whether this session already liked
  useEffect(() => {
    setIsInitialLoading(true);
    fetch(`/api/posts/${slug}/reactions?locale=${locale}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch reactions");
        return res.json();
      })
      .then((data) => {
        setServerState({
          likeCount: data.likeCount ?? 0,
          isLiked: data.alreadyLiked ?? false,
        });
        setError(null);
      })
      .catch((err) => {
        console.error("Failed to fetch reactions:", err);
        setError("Failed to load likes");
      })
      .finally(() => setIsInitialLoading(false));
  }, [slug, locale]);

  const handleLike = async () => {
    // Already liked or submitting
    if (serverState.isLiked || isSubmitting) return;

    // Debounce: prevent rapid clicks (300ms instead of 500ms for snappier feel)
    const now = Date.now();
    if (now - lastClickTime.current < 300) return;
    lastClickTime.current = now;

    // Clear any previous errors
    setError(null);

    const previousState = serverState;
    const optimisticState: LikeState = {
      likeCount: serverState.likeCount + 1,
      isLiked: true,
    };

    // Optimistically update UI immediately
    setDisplayState(optimisticState);
    setServerState(optimisticState);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/posts/${slug}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });

      if (!res.ok) {
        let errorMessage = "Failed to like post";

        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Response is not JSON, use status-based message
          if (res.status === 429) {
            errorMessage = "Too many requests. Please try again later.";
          } else if (res.status === 404) {
            errorMessage = "Post not found";
          } else {
            errorMessage = `Server error (${res.status})`;
          }
        }

        throw new Error(errorMessage);
      }

      const data = await res.json();

      // Update server state with actual response
      setServerState({
        likeCount: data.likeCount,
        isLiked: true,
      });
      setDisplayState({
        likeCount: data.likeCount,
        isLiked: true,
      });
    } catch (err) {
      // Rollback on error - restore UI state
      setDisplayState(previousState);
      setServerState(previousState);

      const errorMessage = err instanceof Error ? err.message : "Failed to like post";
      setError(errorMessage);
      console.error("Failed to like post:", err);

      // Auto-clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Animation variants
  const buttonVariants = {
    tap: { scale: 0.94 },
    hover: { scale: 1.03 },
  };

  const heartVariants = {
    liked: {
      scale: [1, 1.3, 1],
      transition: { duration: 0.3, ease: "easeOut" as const },
    },
    idle: { scale: 1 },
  };

  return (
    <div className="flex flex-col gap-2">
      <motion.button
        onClick={handleLike}
        disabled={displayState.isLiked || isSubmitting || isInitialLoading}
        data-testid="like-button"
        variants={prefersReducedMotion ? undefined : buttonVariants}
        whileTap={prefersReducedMotion ? undefined : "tap"}
        whileHover={prefersReducedMotion ? undefined : "hover"}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className={`flex items-center gap-2 rounded-lg border px-4 py-2 transition-colors ${displayState.isLiked
          ? "border-red-300 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400"
          : "border-stone-200 bg-white text-stone-700 hover:border-red-300 hover:bg-red-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-red-800 dark:hover:bg-red-950"
          } ${isSubmitting || isInitialLoading ? "cursor-wait opacity-50" : ""} ${displayState.isLiked ? "cursor-not-allowed" : "cursor-pointer"}`}
        aria-label={displayState.isLiked ? "Already liked" : "Like this post"}
        aria-live="polite"
      >
        <motion.svg
          className="h-5 w-5"
          fill={displayState.isLiked ? "currentColor" : "none"}
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
          variants={prefersReducedMotion ? undefined : heartVariants}
          animate={displayState.isLiked ? "liked" : "idle"}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </motion.svg>
        <span className="font-medium">{displayState.likeCount}</span>
        {displayState.isLiked && <span className="text-xs">Liked</span>}
        {isSubmitting && <span className="text-xs">Saving...</span>}
      </motion.button>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400"
          role="alert"
        >
          {error}
        </motion.div>
      )}
    </div>
  );
}


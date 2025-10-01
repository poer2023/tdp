"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CommentStatus } from "@prisma/client";

type ModerationActionsProps = {
  commentId: string;
  status: CommentStatus;
};

export function CommentModerationActions({ commentId, status }: ModerationActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleModerate = async (action: "approve" | "hide" | "delete") => {
    if (
      action === "delete" &&
      !confirm("Permanently delete this comment? This action cannot be undone.")
    ) {
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`/api/admin/comments/${commentId}/moderate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(`Error: ${error.error || "Failed to moderate comment"}`);
        return;
      }

      router.refresh();
    } catch (error) {
      console.error("Moderation error:", error);
      alert("Failed to moderate comment");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-3">
      {status !== CommentStatus.PUBLISHED && (
        <button
          onClick={() => handleModerate("approve")}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-900 underline decoration-1 underline-offset-4 transition-colors duration-150 hover:text-zinc-600 disabled:opacity-50 dark:text-zinc-100 dark:hover:text-zinc-400"
        >
          Approve
        </button>
      )}

      {status !== CommentStatus.HIDDEN && (
        <button
          onClick={() => handleModerate("hide")}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 underline decoration-1 underline-offset-4 transition-colors duration-150 hover:text-zinc-900 disabled:opacity-50 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          Hide
        </button>
      )}

      <button
        onClick={() => handleModerate("delete")}
        disabled={isLoading}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 underline decoration-1 underline-offset-4 transition-colors duration-150 hover:text-zinc-900 disabled:opacity-50 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        Delete
      </button>
    </div>
  );
}

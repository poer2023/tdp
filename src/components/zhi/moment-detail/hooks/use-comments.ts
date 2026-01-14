"use client";

import { useState, useCallback, useEffect } from "react";
import type { MomentComment } from "../types";

export type UseCommentsOptions = {
    momentId: string;
};

export type UseCommentsReturn = {
    comments: MomentComment[];
    isLoading: boolean;
    isSubmitting: boolean;
    newComment: string;
    setNewComment: (value: string) => void;
    refetch: () => Promise<void>;
    handleSubmitComment: (e: React.FormEvent) => Promise<void>;
    formatCommentDate: (dateString: string, locale: string) => string;
};

export function useComments({ momentId }: UseCommentsOptions): UseCommentsReturn {
    const [comments, setComments] = useState<MomentComment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchComments = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/moments/${momentId}/comments`);
            if (res.ok) {
                const data = await res.json();
                setComments(data.comments || []);
            }
        } catch (error) {
            console.error("Failed to fetch comments:", error);
        } finally {
            setIsLoading(false);
        }
    }, [momentId]);

    // Auto-fetch on mount and when momentId changes
    useEffect(() => {
        fetchComments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [momentId]); // Only depend on primitive momentId to prevent infinite loop

    const handleSubmitComment = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/moments/${momentId}/comments`, {
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
    }, [momentId, newComment]);

    const formatCommentDate = useCallback((dateString: string, locale: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }, []);

    return {
        comments,
        isLoading,
        isSubmitting,
        newComment,
        setNewComment,
        refetch: fetchComments,
        handleSubmitComment,
        formatCommentDate,
    };
}

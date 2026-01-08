"use client";

import React from "react";
import Image from "next/image";
import { User } from "lucide-react";
import type { MomentComment } from "./types";

export type CommentListProps = {
    comments: MomentComment[];
    isLoading: boolean;
    formatCommentDate: (dateString: string) => string;
    t: (key: string) => string;
};

export function CommentList({ comments, isLoading, formatCommentDate, t }: CommentListProps) {
    if (isLoading) {
        return <div className="py-4 text-center text-sm text-stone-400">Loading...</div>;
    }

    if (comments.length === 0) {
        return (
            <p className="py-4 text-center text-sm italic text-stone-400">
                {t("noComments")}
            </p>
        );
    }

    return (
        <div className="space-y-4">
            {comments.map((comment) => (
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
            ))}
        </div>
    );
}

"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Heart } from "lucide-react";
import Image from "next/image";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  imageUrl?: string;
  tags: string[];
  likes: number;
}

interface PostCardProps {
  post: BlogPost;
  onClick?: () => void;
  onLike?: (id: string) => void;
}

export function LuminaPostCard({ post, onClick, onLike }: PostCardProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session) {
      router.push("/login");
      return;
    }
    onLike?.(post.id);
  };

  return (
    <div className="group mb-8 cursor-pointer break-inside-avoid" onClick={onClick}>
      <article className="border-b-2 border-stone-100 bg-white pb-6 transition-colors duration-300 hover:border-stone-300 dark:border-[#27272a] dark:bg-transparent dark:hover:border-stone-600">
        {/* Image - Plain and sharp, full color */}
        {post.imageUrl && (
          <div className="relative mb-5 aspect-video w-full overflow-hidden rounded-sm">
            <Image
              src={post.imageUrl}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 600px"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              quality={80}
            />
            <div className="absolute top-3 left-3 z-10 border border-stone-200 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest dark:border-[#2a2a2e] dark:bg-[#141416]">
              {post.category}
            </div>
          </div>
        )}

        <div className="px-3">
          {!post.imageUrl && (
            <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-stone-400">
              {post.category}
            </div>
          )}

          <h3 className="mb-3 font-serif text-xl font-bold leading-tight text-stone-900 transition-colors group-hover:text-stone-600 md:text-2xl dark:text-stone-100 dark:group-hover:text-stone-300">
            {post.title}
          </h3>

          <p className="mb-4 line-clamp-3 font-serif text-sm leading-relaxed text-stone-600 dark:text-stone-400">
            {post.excerpt}
          </p>

          <div className="flex items-center justify-between font-sans text-xs text-stone-400">
            <div className="flex items-center gap-3">
              <span>{post.date}</span>
              <span className="h-1 w-1 rounded-full bg-stone-300"></span>
              <span>{post.readTime}</span>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1 transition-colors hover:text-rose-500 ${post.likes > 0 ? "text-rose-500" : ""
                  }`}
              >
                <Heart size={14} className={post.likes > 0 ? "fill-current" : ""} />
                <span>{post.likes}</span>
              </button>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

export default LuminaPostCard;

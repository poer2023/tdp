"use client";

import React, { useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Heart, MessageCircle, Share2, Sparkles } from "lucide-react";
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "framer-motion";
import Image from "next/image";

interface Moment {
  id: string;
  content: string;
  images?: string[];
  date: string;
  tags: string[];
  likes: number;
  liked?: boolean;
}

interface MomentCardProps {
  moment: Moment;
  onClick?: () => void;
  onLike?: (id: string) => void;
}

export function LuminaMomentCard({ moment, onClick, onLike }: MomentCardProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const hasImages = moment.images && moment.images.length > 0;

  // --- Physics & 3D Logic (Desktop) ---
  const ref = useRef<HTMLDivElement>(null);

  // Motion values for mouse position (normalized from -0.5 to 0.5)
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Use springs for smooth movement buffering (Physics effect)
  const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15 });

  function handleMouseMove({ clientX, clientY }: React.MouseEvent) {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const xPct = (clientX - left) / width - 0.5;
    const yPct = (clientY - top) / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  // Maps mouse position to rotation degrees
  const rotateX = useTransform(mouseY, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-7deg", "7deg"]);

  // Spotlight effect gradient that follows mouse
  const spotlightBg = useMotionTemplate`radial-gradient(650px circle at ${useTransform(
    mouseX,
    [-0.5, 0.5],
    ["0%", "100%"]
  )} ${useTransform(mouseY, [-0.5, 0.5], ["0%", "100%"])}, rgba(255,255,255,0.15), transparent 80%)`;

  // --- Interaction Logic ---
  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session) {
      router.push("/login");
      return;
    }
    onLike?.(moment.id);
  };

  // --- Dynamic Styles ---
  const getGradient = (id: string) => {
    const gradients = [
      "from-rose-500/10 via-orange-500/10 to-amber-500/10 border-rose-200/50 dark:border-rose-900/30",
      "from-sage-500/10 via-teal-500/10 to-emerald-500/10 border-sage-200/50 dark:border-sage-900/30",
      "from-indigo-500/10 via-violet-500/10 to-purple-500/10 border-indigo-200/50 dark:border-indigo-900/30",
      "from-blue-500/10 via-sky-500/10 to-cyan-500/10 border-blue-200/50 dark:border-blue-900/30",
    ];
    const index = id.charCodeAt(id.length - 1) % gradients.length;
    return gradients[index];
  };

  const bgStyle = hasImages
    ? "bg-[#141416] border-[#27272a]"
    : `bg-white dark:bg-[#141416]/80 backdrop-blur-xl border ${getGradient(moment.id)}`;

  return (
    <div className="mb-8 break-inside-avoid" style={{ perspective: "1000px" }}>
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        style={{
          transformStyle: "preserve-3d",
          rotateX,
          rotateY,
        }}
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5 }}
        whileTap={{ scale: 0.98 }}
        className={`group relative w-full cursor-pointer overflow-hidden rounded-3xl shadow-lg transition-shadow duration-500 hover:shadow-2xl ${bgStyle}`}
      >
        {/* 0. Mobile Only: Shimmer Effect */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden md:hidden">
          <div className="shimmer-effect absolute top-0 -inset-full h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 dark:opacity-10" />
        </div>

        {/* 1. Desktop Only: Mouse Spotlight Overlay */}
        <motion.div
          style={{ background: spotlightBg }}
          className="pointer-events-none absolute inset-0 z-10 hidden opacity-0 transition-opacity duration-500 group-hover:opacity-100 md:block"
        />

        {/* 2. Image Layer */}
        {hasImages && moment.images![0] && (
          <div className="absolute inset-0 z-0">
            <Image
              src={moment.images![0]}
              alt="Background"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 400px"
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              quality={75}
            />
            {/* Dark gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-90" />
          </div>
        )}

        {/* 3. Content Container (Lifted in 3D space) */}
        <div
          className={`relative z-20 flex h-full flex-col justify-between p-6 ${hasImages ? "min-h-[360px]" : "min-h-[220px]"}`}
          style={{ transform: "translateZ(20px)" }}
        >
          {/* Header */}
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border ${
                  hasImages
                    ? "border-white/20 bg-white/10 text-white backdrop-blur-md"
                    : "border-stone-200 bg-stone-100 text-stone-600 dark:border-[#2a2a2e] dark:bg-[#1f1f23] dark:text-stone-300"
                }`}
              >
                <span className="font-serif font-bold">L</span>
              </div>
              <div>
                <p
                  className={`text-xs font-bold uppercase tracking-wider ${hasImages ? "text-white/90" : "text-stone-500 dark:text-stone-400"}`}
                >
                  {moment.date}
                </p>
                {moment.tags.length > 0 && (
                  <p
                    className={`text-[10px] ${hasImages ? "text-sage-300" : "text-sage-600 dark:text-sage-400"}`}
                  >
                    #{moment.tags[0]}
                  </p>
                )}
              </div>
            </div>
            {/* Visual flair icon */}
            {hasImages && <Sparkles size={16} className="animate-pulse text-yellow-200" />}
          </div>

          {/* Main Content */}
          <div className="mt-auto">
            <p
              className={`mb-6 line-clamp-4 font-serif text-xl leading-relaxed md:text-2xl ${hasImages ? "text-white drop-shadow-md" : "text-stone-800 dark:text-stone-100"}`}
            >
              {moment.content}
            </p>

            {/* Actions Bar */}
            <div
              className={`flex items-center justify-between rounded-2xl p-2 backdrop-blur-md transition-all duration-300 ${
                hasImages
                  ? "border border-white/10 bg-white/10 text-white hover:bg-white/20"
                  : "border border-stone-200 bg-stone-100/50 text-stone-600 hover:bg-stone-100 dark:border-[#2a2a2e] dark:bg-[#1f1f23]/50 dark:text-stone-400 dark:hover:bg-[#27272a]"
              }`}
            >
              <div className="flex gap-1">
                <button
                  onClick={handleLike}
                  className="rounded-full p-2 transition-transform hover:bg-black/5 active:scale-90 dark:hover:bg-white/10"
                >
                  <Heart
                    size={18}
                    className={
                      moment.liked
                        ? "fill-rose-500 text-rose-500"
                        : moment.likes > 0
                          ? "text-rose-500"
                          : ""
                    }
                  />
                </button>
                <button className="rounded-full p-2 transition-transform hover:bg-black/5 active:scale-90 dark:hover:bg-white/10">
                  <MessageCircle size={18} />
                </button>
                <button className="rounded-full p-2 transition-transform hover:bg-black/5 active:scale-90 md:hidden dark:hover:bg-white/10">
                  <Share2 size={18} />
                </button>
              </div>
              <span className="px-3 text-xs font-medium opacity-80">
                {moment.likes} {moment.likes === 1 ? "like" : "likes"}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      <style jsx>{`
        @keyframes shimmer {
          100% {
            left: 125%;
          }
        }
        .shimmer-effect {
          animation: shimmer 3s infinite;
        }
      `}</style>
    </div>
  );
}

export default LuminaMomentCard;

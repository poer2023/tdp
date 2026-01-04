"use client";

import React, { useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Heart, MessageCircle } from "lucide-react";
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "framer-motion";
import Image from "next/image";

// Image type matching FeedImage
interface MomentImageData {
  url: string;
  w?: number | null;
  h?: number | null;
}

interface Moment {
  id: string;
  content: string;
  images?: MomentImageData[];
  date: string;
  tags: string[];
  likes: number;
  liked?: boolean;
  author?: { name: string | null; image: string | null };
}

interface MomentCardProps {
  moment: Moment;
  onClick?: () => void;
  onLike?: (id: string) => void;
}

// Threads-style horizontal image gallery for mobile
// Fixed height (320px), width calculated from aspect ratio for single image
// For multiple images: uniform square thumbnails with object-cover
const GALLERY_HEIGHT = 320;
const MULTI_IMAGE_SIZE = 280; // Square thumbnails for multi-image galleries

function ThreadsImageGallery({ images, onImageClick }: { images: MomentImageData[]; onImageClick?: () => void }) {
  // DEBUG: Log image dimension data

  // Calculate width from aspect ratio for single images
  const getImageWidth = (img: MomentImageData): number => {
    const calculatedWidth = (img.w && img.h && img.h > 0)
      ? Math.round(GALLERY_HEIGHT * (img.w / img.h))
      : Math.round(GALLERY_HEIGHT * (4 / 3));

    return calculatedWidth;
  };

  // Single image: left-aligned, fixed height, width based on aspect ratio
  if (images.length === 1) {
    const img = images[0]!;
    const hasValidDimensions = !!(img.w && img.h && img.h > 0);

    // If we have valid dimensions, calculate exact container size
    if (hasValidDimensions) {
      const width = getImageWidth(img);
      // Container sized to exact aspect ratio, left-aligned with rounded corners
      return (
        <div className="pl-4">
          <div
            className="overflow-x-auto scrollbar-hide pr-4"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <div
              className="relative cursor-pointer overflow-hidden rounded-xl"
              style={{
                height: GALLERY_HEIGHT,
                width: width,
              }}
              onClick={onImageClick}
            >
              <Image
                src={img.url}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="rounded-xl"
                style={{ objectFit: "cover" }}
                quality={80}
              />
            </div>
          </div>
        </div>
      );
    }

    // Fallback for images without dimension data: use auto width
    return (
      <div className="px-4">
        <Image
          src={img.url}
          alt=""
          width={0}
          height={0}
          sizes="100vw"
          className="cursor-pointer rounded-xl"
          style={{
            height: GALLERY_HEIGHT,
            width: "auto",
            maxWidth: "100%",
          }}
          quality={80}
          onClick={onImageClick}
        />
      </div>
    );
  }

  // Multiple images: horizontal scroll, each image maintains its aspect ratio
  // Fixed height, width calculated per image based on aspect ratio
  return (
    <div className="pl-4">
      <div
        className="flex gap-2 overflow-x-auto scrollbar-hide pr-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {images.map((img, idx) => {
          const hasValidDimensions = !!(img.w && img.h && img.h > 0);

          if (hasValidDimensions) {
            // Calculate width based on aspect ratio for fixed height
            const width = getImageWidth(img);
            // Container is sized to exact aspect ratio, so object-contain fills perfectly
            return (
              <div
                key={idx}
                className="relative flex-shrink-0 cursor-pointer overflow-hidden rounded-xl"
                style={{ height: GALLERY_HEIGHT, width }}
                onClick={onImageClick}
              >
                <Image
                  src={img.url}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 80vw, 400px"
                  style={{ objectFit: "contain" }}
                  quality={80}
                  loading={idx === 0 ? "eager" : "lazy"}
                />
              </div>
            );
          }

          // Fallback for images without dimension data
          return (
            <Image
              key={idx}
              src={img.url}
              alt=""
              width={0}
              height={0}
              sizes="80vw"
              style={{
                height: GALLERY_HEIGHT,
                width: "auto",
                flexShrink: 0,
                borderRadius: "0.75rem",
                cursor: "pointer"
              }}
              quality={80}
              loading={idx === 0 ? "eager" : "lazy"}
              onClick={onImageClick}
            />
          );
        })}
      </div>
    </div>
  );
}

export function ZhiMomentCard({ moment, onClick, onLike }: MomentCardProps) {
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

  // ============================================
  // MOBILE: Threads-style layout
  // ============================================
  const MobileCard = () => (
    <div className="border-b border-stone-200 pb-3 dark:border-stone-800">
      {/* Header: Avatar + Name + Time */}
      <div className="flex items-center gap-3 px-4 py-3">
        {moment.author?.image ? (
          <Image
            src={moment.author.image}
            alt={moment.author.name || "Author"}
            width={36}
            height={36}
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-200 dark:bg-stone-700">
            <span className="text-sm font-semibold text-stone-600 dark:text-stone-300">
              {moment.author?.name?.[0]?.toUpperCase() || "?"}
            </span>
          </div>
        )}
        <div className="flex-1">
          <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
            {moment.author?.name || "Anonymous"}
          </p>
        </div>
        <span className="text-xs text-stone-500 dark:text-stone-400">{moment.date}</span>
      </div>

      {/* Content Text */}
      {moment.content && (
        <div className="px-4 pb-3" onClick={onClick}>
          <p className="text-[15px] leading-relaxed text-stone-900 dark:text-stone-100">
            {moment.content}
          </p>
        </div>
      )}

      {/* Images: Horizontal Carousel */}
      {hasImages && (
        <ThreadsImageGallery images={moment.images!} onImageClick={onClick} />
      )}

      {/* Actions Bar - Always visible on mobile (no share button) */}
      <div className="flex items-center gap-4 px-4 pt-3">
        <button
          onClick={handleLike}
          className="group/heart flex items-center gap-1.5 transition-transform active:scale-90"
        >
          <Heart
            size={20}
            className={`transition-colors ${moment.liked
              ? "fill-rose-500 text-rose-500"
              : "text-stone-600 dark:text-stone-400"
              }`}
          />
          {moment.likes > 0 && (
            <span className="text-sm text-stone-600 dark:text-stone-400">
              {moment.likes}
            </span>
          )}
        </button>
        <button className="text-stone-600 transition-transform active:scale-90 dark:text-stone-400">
          <MessageCircle size={20} />
        </button>
      </div>
    </div>
  );

  // ============================================
  // DESKTOP: Original 3D card layout
  // ============================================
  const DesktopCard = () => {
    const bgStyle = hasImages
      ? "bg-[#141416] border-[#27272a]"
      : `bg-white dark:bg-[#141416]/80 backdrop-blur-xl border ${getGradient(moment.id)}`;

    return (
      <div className="mb-8 break-inside-avoid [perspective:1000px]">
        <motion.div
          ref={ref}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={onClick}
          style={{
            rotateX,
            rotateY,
          }}
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          whileTap={{ scale: 0.98 }}
          className={`group relative w-full cursor-pointer overflow-hidden rounded-3xl shadow-lg transition-shadow duration-500 hover:shadow-2xl [transform-style:preserve-3d] ${bgStyle}`}
        >
          {/* 1. Desktop Only: Mouse Spotlight Overlay */}
          <motion.div
            style={{ background: spotlightBg }}
            className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />

          {/* 2. Image Layer */}
          {hasImages && moment.images![0] && (
            <div className="absolute inset-0 z-0">
              <Image
                src={moment.images![0].url}
                alt="Background"
                fill
                sizes="(max-width: 1280px) 50vw, 400px"
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
                {moment.author?.image ? (
                  <Image
                    src={moment.author.image}
                    alt={moment.author.name || "Author"}
                    width={40}
                    height={40}
                    className={`h-10 w-10 rounded-full object-cover border ${hasImages
                      ? "border-white/20"
                      : "border-stone-200 dark:border-[#2a2a2e]"
                      }`}
                  />
                ) : (
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border ${hasImages
                      ? "border-white/20 bg-white/10 text-white backdrop-blur-md"
                      : "border-stone-200 bg-stone-100 text-stone-600 dark:border-[#2a2a2e] dark:bg-[#1f1f23] dark:text-stone-300"
                      }`}
                  >
                    <span className="font-serif font-bold">
                      {moment.author?.name?.[0]?.toUpperCase() || "?"}
                    </span>
                  </div>
                )}
                <div>
                  <p
                    className={`text-xs font-medium ${hasImages ? "text-white/90" : "text-stone-700 dark:text-stone-300"}`}
                  >
                    {moment.author?.name || "Anonymous"}
                  </p>
                  <p
                    className={`text-[10px] ${hasImages ? "text-white/70" : "text-stone-500 dark:text-stone-400"}`}
                  >
                    {moment.date}
                  </p>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="mt-auto">
              <p
                className={`line-clamp-4 font-serif text-xl leading-relaxed md:text-2xl ${hasImages ? "text-white drop-shadow-md" : "text-stone-800 dark:text-stone-100"}`}
              >
                {moment.content}
              </p>
            </div>

            {/* Actions Bar - Appears on hover */}
            <div
              className={`absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-2xl p-2 backdrop-blur-md transition-all duration-300 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 z-30 ${hasImages
                ? "border border-white/10 bg-black/40 text-white hover:bg-black/60"
                : "border border-stone-200 bg-white/80 text-stone-600 hover:bg-white dark:border-[#2a2a2e] dark:bg-[#1f1f23]/80 dark:text-stone-400 dark:hover:bg-[#27272a]"
                }`}
            >
              <div className="flex gap-1">
                <button
                  onClick={handleLike}
                  className="group/heart rounded-full p-2 transition-transform hover:bg-black/5 active:scale-90 dark:hover:bg-white/10"
                >
                  <motion.div
                    animate={moment.liked ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <Heart
                      size={18}
                      className={`transition-colors duration-200 ${moment.liked
                        ? "fill-rose-500 text-rose-500"
                        : moment.likes > 0
                          ? "text-rose-500 group-hover/heart:fill-rose-200"
                          : "group-hover/heart:text-rose-400"
                        }`}
                    />
                  </motion.div>
                </button>
                <button className="rounded-full p-2 transition-transform hover:bg-black/5 active:scale-90 dark:hover:bg-white/10">
                  <MessageCircle size={18} />
                </button>
              </div>
              <span className="px-3 text-xs font-medium opacity-80">
                {moment.likes} {moment.likes === 1 ? "like" : "likes"}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  // Render mobile or desktop based on screen size
  return (
    <>
      {/* Mobile: Threads-style layout */}
      <div className="block md:hidden">
        <MobileCard />
      </div>

      {/* Desktop: Original 3D card */}
      <div className="hidden md:block">
        <DesktopCard />
      </div>
    </>
  );
}

export default ZhiMomentCard;

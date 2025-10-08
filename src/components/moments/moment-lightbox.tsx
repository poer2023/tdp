"use client";

import { useEffect, useState } from "react";
import type { MomentImage } from "@/lib/moments";

export function MomentLightbox({
  images,
  initialIndex = 0,
}: {
  images: MomentImage[];
  initialIndex?: number;
}) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(initialIndex);
  useEffect(() => {
    if (images.length > 1 && initialIndex >= 0) {
      setOpen(true);
      setIdx(Math.min(initialIndex, images.length - 1));
    }
  }, [initialIndex, images.length]);

  if (!open || images.length <= 1) return null;
  const cur = images[idx]!;
  const prev = () => setIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setIdx((i) => (i + 1) % images.length);
  return (
    <div className="fixed inset-0 z-[90] bg-black/80">
      <button
        className="absolute top-4 right-4 rounded bg-white/10 px-2 py-1 text-white"
        onClick={() => setOpen(false)}
      >
        ✕
      </button>
      <button
        className="absolute top-1/2 left-4 -translate-y-1/2 rounded bg-white/10 px-2 py-1 text-white"
        onClick={prev}
      >
        ←
      </button>
      <button
        className="absolute top-1/2 right-4 -translate-y-1/2 rounded bg-white/10 px-2 py-1 text-white"
        onClick={next}
      >
        →
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={cur.url}
        alt={cur.alt || ""}
        className="absolute top-1/2 left-1/2 max-h-[90vh] max-w-[90vw] -translate-x-1/2 -translate-y-1/2 object-contain"
      />
    </div>
  );
}

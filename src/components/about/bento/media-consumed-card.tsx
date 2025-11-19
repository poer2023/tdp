'use client';

import { Star, Book, Film, Music, Sparkles } from 'lucide-react';
import Image from 'next/image';
import type { MediaItem } from '@/types/bento-data';

interface MediaConsumedCardProps {
  data: MediaItem[];
}

export function MediaConsumedCard({ data }: MediaConsumedCardProps) {
  const iconMap = {
    book: Book,
    movie: Film,
    music: Music,
    anime: Sparkles,
  };

  return (
    <div className="bento-card relative flex h-full flex-col overflow-hidden bg-slate-900 p-6 text-white">
      {/* Texture overlay */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "url('https://www.transparenttextures.com/patterns/stardust.png')",
        }}
      />

      {/* Header */}
      <div className="relative z-10 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Film className="h-6 w-6 text-pink-400" />
          <h3 className="text-lg font-bold">Recently</h3>
        </div>
      </div>

      {/* Media list */}
      <div className="no-scrollbar relative z-10 flex-1 space-y-4 overflow-y-auto pb-6">
        {data.map((item, index) => {
          const Icon = iconMap[item.type];
          return (
            <div
              key={index}
              className="group flex cursor-default gap-3 rounded-lg p-2 transition-colors hover:bg-slate-800"
            >
              {/* Cover image */}
              <div className="relative h-16 w-12 flex-shrink-0 overflow-hidden rounded bg-slate-700">
                {item.cover && (
                  <Image
                    src={item.cover}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="48px"
                    unoptimized
                  />
                )}
              </div>

              {/* Details */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1">
                      <Icon className="h-3 w-3 text-slate-400" />
                      <h4 className="line-clamp-1 text-xs font-bold text-white">
                        {item.title}
                      </h4>
                    </div>
                    <p className="text-[10px] text-slate-400">{item.author}</p>
                  </div>
                </div>

                {/* Rating */}
                <div className="mt-1 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-2 w-2 ${
                        i < item.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'fill-slate-600 text-slate-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom gradient mask */}
      <div className="pointer-events-none absolute bottom-0 left-0 z-20 h-16 w-full bg-gradient-to-t from-slate-900 to-transparent" />
    </div>
  );
}

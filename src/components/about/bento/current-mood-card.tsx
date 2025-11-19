'use client';

import { motion } from 'framer-motion';
import type { CurrentMoodData } from '@/types/bento-data';

interface CurrentMoodCardProps {
  data: CurrentMoodData;
}

export function CurrentMoodCard({ data }: CurrentMoodCardProps) {
  return (
    <div className="bento-card group relative overflow-hidden">
      {/* Animated background blob */}
      <motion.div
        className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-yellow-100 opacity-50"
        whileHover={{ scale: 1.5 }}
        transition={{ duration: 0.5 }}
      />

      {/* Content */}
      <div className="relative z-10">
        <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          Current Mood
        </div>
        <div className="text-3xl">
          {data.emoji} {data.status}
        </div>
        <div className="mt-4 text-sm text-slate-500">&ldquo;{data.quote}&rdquo;</div>
      </div>
    </div>
  );
}

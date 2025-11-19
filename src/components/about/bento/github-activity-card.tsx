'use client';

import { motion } from 'framer-motion';
import { Github } from 'lucide-react';
import type { GitHubData } from '@/types/bento-data';

interface GitHubActivityCardProps {
  data: GitHubData;
}

export function GitHubActivityCard({ data }: GitHubActivityCardProps) {
  const heights = ['20%', '30%', '50%', '75%', '100%'];
  const colors = [
    'bg-slate-100',
    'bg-green-200',
    'bg-green-300',
    'bg-green-400',
    'bg-green-500',
  ];

  return (
    <div className="bento-card relative overflow-hidden">
      {/* Header */}
      <div className="relative z-10 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Github className="h-6 w-6" />
          <span className="font-bold text-slate-700">Contribution</span>
        </div>
        <span className="rounded bg-slate-100 px-2 py-1 font-mono text-xs text-slate-500">
          {data.totalCommits}
        </span>
      </div>

      {/* Bar chart */}
      <div className="relative flex h-20 w-full items-end gap-[4px] overflow-hidden">
        {data.contributions.map((level, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: heights[level] }}
            transition={{ delay: i * 0.02, duration: 0.3 }}
            className={`w-full rounded-t-sm ${colors[level]}`}
            style={{
              animation: `shimmer 3s infinite`,
              animationDelay: `${i * 0.1}s`,
            }}
            title={`Week ${i + 1}: Level ${level}`}
          />
        ))}
      </div>

      {/* Bottom gradient fade */}
      <div className="pointer-events-none absolute bottom-0 left-0 z-20 h-8 w-full bg-gradient-to-t from-white to-transparent" />
    </div>
  );
}

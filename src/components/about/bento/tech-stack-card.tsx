'use client';

import { Code2 } from 'lucide-react';
import type { TechStackData } from '@/types/bento-data';

interface TechStackCardProps {
  data: TechStackData;
}

export function TechStackCard({ data }: TechStackCardProps) {
  return (
    <div className="bento-card flex flex-col items-center justify-center gap-2 text-center">
      {/* Header */}
      <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        Tech Stack
      </div>

      {/* Tags */}
      <div className="flex flex-wrap justify-center gap-2">
        {data.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-md border border-slate-100 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-600 transition-colors hover:bg-slate-100"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

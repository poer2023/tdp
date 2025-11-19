'use client';

import { Music, Youtube, Cloud, Apple, Bot, Gamepad2, Github, Tv } from 'lucide-react';
import type { SubscriptionsData } from '@/types/bento-data';

interface SubscriptionsCardProps {
  data: SubscriptionsData;
}

const iconMap: Record<string, any> = {
  Music,
  Youtube,
  Cloud,
  Apple,
  Bot,
  Gamepad2,
  Github,
  Tv,
};

export function SubscriptionsCard({ data }: SubscriptionsCardProps) {
  // Duplicate services for seamless infinite scroll
  const duplicatedServices = [...data.services, ...data.services, ...data.services];

  return (
    <div className="bento-card group relative flex h-full flex-col justify-center overflow-hidden bg-slate-900 p-0">
      {/* Gradient overlay */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent to-black/50" />

      {/* Center text */}
      <div className="relative z-20 mb-3 text-center">
        <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
          Subscriptions
        </p>
        <p className="text-lg font-bold text-white">
          {data.totalPerMonth}
          <span className="text-xs font-normal text-slate-400"> /mo</span>
        </p>
      </div>

      {/* Scrolling icon track */}
      <div className="relative z-0 w-full overflow-hidden opacity-60 grayscale transition-all duration-500 group-hover:opacity-100 group-hover:grayscale-0">
        <div className="mb-2 flex gap-4 animate-scroll-x">
          {duplicatedServices.map((service, i) => {
            const Icon = iconMap[service.icon];
            return (
              <div
                key={`${service.name}-${i}`}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-800"
                title={service.name}
              >
                <Icon className="h-5 w-5" style={{ color: service.color }} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

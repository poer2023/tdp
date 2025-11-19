'use client';

import { FaSteam } from 'react-icons/fa';
import Image from 'next/image';
import type { SteamData } from '@/types/bento-data';

interface SteamGamingCardProps {
  data: SteamData;
}

export function SteamGamingCard({ data }: SteamGamingCardProps) {
  return (
    <div className="bento-card md:col-span-2 md:row-span-1 bg-slate-100 rounded-3xl p-0 border border-slate-200 shadow-soft flex overflow-hidden relative group">
      {/* Game cover (left side) */}
      <div className="relative h-full w-2/5 overflow-hidden bg-slate-300">
        <Image
          src={data.bg}
          alt={data.playing}
          fill
          className="object-cover grayscale transition-all duration-700 group-hover:grayscale-0"
          sizes="40vw"
          unoptimized
        />

        {/* Image overlay */}
        <div className="absolute inset-0 bg-indigo-900/30 transition-colors group-hover:bg-transparent" />

        {/* Game name overlay */}
        <div className="absolute bottom-4 left-4 z-10 text-white">
          <div className="text-[10px] uppercase opacity-90">Playing</div>
          <div className="text-md font-bold leading-tight shadow-black drop-shadow-md">
            {data.playing}
          </div>
        </div>
      </div>

      {/* Game stats (right side) */}
      <div className="w-3/5 p-5 flex flex-col justify-between">
        {/* Top: Icon + hours badge */}
        <div className="flex justify-between items-start">
          <FaSteam className="text-2xl text-blue-500" />
          <span className="text-xs font-bold bg-white px-2 py-1 rounded shadow-sm text-blue-600">
            {data.hours}
          </span>
        </div>

        {/* Bottom: Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-600">
            <span>Progress</span>
            <span className="font-bold">{data.achievement}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-500 h-1.5 rounded-full"
              style={{ width: `${data.achievement}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

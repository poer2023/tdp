'use client';

import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { Heart, Moon } from 'lucide-react';
import type { HealthData } from '@/types/bento-data';

interface HealthCardProps {
  data: HealthData;
}

function AnimatedCounter({ value }: { value: number }) {
  const spring = useSpring(0, { duration: 1500, bounce: 0 });
  const display = useTransform(spring, (latest) =>
    Math.floor(latest).toLocaleString()
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
}

export function HealthCard({ data }: HealthCardProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="bento-card relative flex flex-col justify-between overflow-hidden p-5">
      {/* Decorative background circle */}
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full border-4 border-red-50 opacity-60" />

      {/* Header */}
      <div className="relative mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold text-rose-500">
          <Heart className="h-4 w-4 animate-pulse" />
          Health
        </div>
        <span className="rounded bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-400">
          Today
        </span>
      </div>

      {/* Steps */}
      <div className="relative flex flex-1 flex-col justify-center">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black tracking-tight text-slate-800">
            {mounted ? <AnimatedCounter value={data.steps} /> : data.steps}
          </span>
          <span className="text-xs font-medium uppercase text-slate-500">Steps</span>
        </div>

        {/* Sleep indicator */}
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-50 p-2">
          <Moon className="h-3 w-3 text-indigo-400" />
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-indigo-400"
              style={{ width: '75%' }}
            />
          </div>
          <span className="text-xs font-bold text-slate-600">{data.sleep}</span>
        </div>
      </div>
    </div>
  );
}

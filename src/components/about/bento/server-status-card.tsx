'use client';

import { useEffect, useState } from 'react';
import type { ServerMetrics } from '@/types/bento-data';

interface ServerStatusCardProps {
  data: ServerMetrics;
}

export function ServerStatusCard({ data: initialData }: ServerStatusCardProps) {
  const [data, setData] = useState(initialData);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    // Fetch updated metrics every 3 seconds
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/bento/server');
        if (response.ok) {
          const newData = await response.json();
          setData(newData);
          setIsLive(true);
        }
      } catch (error) {
        console.error('Failed to fetch server metrics:', error);
        setIsLive(false);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bento-card flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
            <div className="relative z-10 h-2 w-2 rounded-full bg-emerald-500" />
            {isLive && (
              <div className="pulse-dot absolute inset-0 rounded-full bg-emerald-400 opacity-20" />
            )}
          </div>
          <div>
            <div className="text-sm font-bold text-slate-700">System Normal</div>
            <div className="text-[10px] text-slate-400">Uptime: {data.uptime} • Tokyo</div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] text-slate-400">Latency</div>
          <div className="font-mono text-lg font-bold text-slate-800">{data.ping}ms</div>
        </div>
      </div>

      {/* Metrics Dashboard */}
      <div className="mt-2 grid grid-cols-2 gap-6">
        {/* CPU Load */}
        <div>
          <div className="mb-1 flex justify-between text-[10px] text-slate-500">
            <span>CPU Load</span>
            <span className="font-mono font-bold text-slate-700">{data.cpu}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100">
            <div
              className="h-1.5 rounded-full bg-slate-800 transition-all duration-1000"
              style={{ width: `${data.cpu}%` }}
            />
          </div>
        </div>

        {/* RAM Usage */}
        <div>
          <div className="mb-1 flex justify-between text-[10px] text-slate-500">
            <span>RAM Usage</span>
            <span className="font-mono font-bold text-slate-700">{data.ram}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100">
            <div
              className="h-1.5 rounded-full bg-slate-800 transition-all duration-1000"
              style={{ width: `${data.ram}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

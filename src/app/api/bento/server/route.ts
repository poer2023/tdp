import { NextResponse } from 'next/server';
import os from 'os';
import type { ServerMetrics } from '@/types/bento-data';

/**
 * Server monitoring metrics API
 * Returns CPU, RAM, ping, and uptime
 */
export async function GET() {
  try {
    // Calculate CPU usage (average load / number of CPUs * 100)
    const cpuCount = os.cpus().length;
    const loadAvg = os.loadavg()[0] || 0;
    const cpuPercent = Math.min(100, Math.round((loadAvg / cpuCount) * 100));

    // Calculate RAM usage
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const ramPercent = Math.round(((totalMem - freeMem) / totalMem) * 100);

    // Mock ping (in production, could ping actual endpoints)
    const ping = Math.floor(Math.random() * 30) + 15; // 15-45ms

    // Format uptime
    const uptimeSeconds = os.uptime();
    const days = Math.floor(uptimeSeconds / (24 * 3600));
    const hours = Math.floor((uptimeSeconds % (24 * 3600)) / 3600);
    const uptime = `${days}d ${hours}h`;

    const data: ServerMetrics = {
      cpu: cpuPercent,
      ram: ramPercent,
      ping,
      uptime,
    };

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error fetching server metrics:', error);
    return NextResponse.json({
      cpu: 12,
      ram: 45,
      ping: 24,
      uptime: '47d 12h',
    });
  }
}

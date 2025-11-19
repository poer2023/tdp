import { NextResponse } from 'next/server';
import type { HealthData } from '@/types/bento-data';

/**
 * Apple Health data API
 * Fetches steps and sleep data
 */
export async function GET() {
  try {
    // TODO: Integrate with Apple Health API if available
    // For now, generate realistic mock data with daily variation

    const today = new Date();
    const seed = today.getDate() + today.getMonth() * 100;

    // Generate steps (6000-12000 range with daily variation)
    const baseSteps = 8000;
    const variation = (seed % 4000) - 2000;
    const steps = Math.max(6000, Math.min(12000, baseSteps + variation));

    // Generate sleep duration (6-8 hours)
    const baseSleep = 7;
    const sleepVariation = ((seed % 120) - 60) / 60; // ±1 hour
    const sleepHours = Math.max(6, Math.min(8, baseSleep + sleepVariation));
    const sleepMinutes = Math.floor((sleepHours % 1) * 60);
    const sleep = `${Math.floor(sleepHours)}h ${sleepMinutes}m`;

    const data: HealthData = {
      steps: Math.floor(steps),
      sleep,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching health data:', error);
    return NextResponse.json({
      steps: 8432,
      sleep: '7h 12m',
    });
  }
}

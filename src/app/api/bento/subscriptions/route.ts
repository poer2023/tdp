import { NextResponse } from 'next/server';
import prismaDefault, { prisma as prismaNamed } from '@/lib/prisma';
import type { PrismaClient } from '@prisma/client';
import type { SubscriptionsData, SubscriptionService } from '@/types/bento-data';

// Resolve Prisma client
const prisma = (prismaNamed ?? prismaDefault) as unknown as PrismaClient;

/**
 * Icon mapping for common services
 */
const serviceIconMap: Record<string, string> = {
  spotify: 'Music',
  youtube: 'Youtube',
  aws: 'Cloud',
  apple: 'Apple',
  chatgpt: 'Bot',
  gpt: 'Bot',
  'playstation': 'Gamepad2',
  'ps plus': 'Gamepad2',
  github: 'Github',
  netflix: 'Tv',
  disney: 'Tv',
  'amazon prime': 'Tv',
  hulu: 'Tv',
  icloud: 'Cloud',
  dropbox: 'Cloud',
  'google one': 'Cloud',
};

/**
 * Color mapping for common services
 */
const serviceColorMap: Record<string, string> = {
  spotify: 'bg-green-500',
  youtube: 'bg-red-500',
  aws: 'bg-orange-500',
  apple: 'bg-gray-800',
  icloud: 'bg-blue-500',
  chatgpt: 'bg-emerald-500',
  gpt: 'bg-emerald-500',
  playstation: 'bg-blue-600',
  'ps plus': 'bg-blue-600',
  github: 'bg-gray-900',
  netflix: 'bg-red-600',
  disney: 'bg-blue-600',
  'amazon prime': 'bg-blue-500',
};

/**
 * Get icon name for a service
 */
function getIconForService(serviceName: string): string {
  const normalized = serviceName.toLowerCase();
  for (const [key, icon] of Object.entries(serviceIconMap)) {
    if (normalized.includes(key)) {
      return icon;
    }
  }
  return 'CreditCard'; // Default icon
}

/**
 * Get color class for a service
 */
function getColorForService(serviceName: string): string {
  const normalized = serviceName.toLowerCase();
  for (const [key, color] of Object.entries(serviceColorMap)) {
    if (normalized.includes(key)) {
      return color;
    }
  }
  return 'bg-slate-600'; // Default color
}

/**
 * Monthly subscriptions API for Bento cards
 * Fetches from Subscription database table
 */
export async function GET() {
  try {
    // Access Prisma dynamically to handle optional models
    const p: any = prisma as unknown as any;

    // Check if Subscription model exists
    if (!p.subscription?.findMany) {
      console.warn('Subscription table not available, using fallback');
      return NextResponse.json(getFallbackSubscriptionsData());
    }

    // Fetch active subscriptions
    const subscriptions = await p.subscription.findMany({
      where: {
        OR: [{ endDate: null }, { endDate: { gt: new Date() } }],
      },
      select: {
        name: true,
        amountCNY: true,
        billingCycle: true,
      },
      orderBy: {
        amountCNY: 'desc',
      },
    });

    if (subscriptions.length === 0) {
      console.warn('No subscriptions found in database, using fallback');
      return NextResponse.json(getFallbackSubscriptionsData());
    }

    // Map to Bento card format
    const services: SubscriptionService[] = subscriptions.map(
      (sub: { name: string }) => ({
        name: sub.name,
        icon: getIconForService(sub.name),
        color: getColorForService(sub.name),
      })
    );

    // Calculate total monthly cost
    const monthlyTotal = subscriptions.reduce(
      (sum: number, sub: { amountCNY: any; billingCycle: string }) => {
        const amount = Number(sub.amountCNY);
        // Convert annual to monthly
        const monthlyAmount =
          sub.billingCycle === 'ANNUAL' ? amount / 12 : amount;
        return sum + monthlyAmount;
      },
      0
    );

    const data: SubscriptionsData = {
      services,
      totalPerMonth: `¥${Math.round(monthlyTotal)}`,
    };

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    console.error('Error fetching subscriptions data:', error);
    return NextResponse.json(getFallbackSubscriptionsData());
  }
}

/**
 * Fallback data when database is empty or fails
 */
function getFallbackSubscriptionsData(): SubscriptionsData {
  return {
    services: [
      { name: 'Spotify', icon: 'Music', color: 'bg-green-500' },
      { name: 'YouTube', icon: 'Youtube', color: 'bg-red-500' },
      { name: 'AWS', icon: 'Cloud', color: 'bg-orange-500' },
      { name: 'Apple', icon: 'Apple', color: 'bg-gray-800' },
      { name: 'ChatGPT', icon: 'Bot', color: 'bg-emerald-500' },
      { name: 'PlayStation', icon: 'Gamepad2', color: 'bg-blue-600' },
      { name: 'GitHub', icon: 'Github', color: 'bg-gray-900' },
      { name: 'Netflix', icon: 'Tv', color: 'bg-red-600' },
    ],
    totalPerMonth: '$142',
  };
}

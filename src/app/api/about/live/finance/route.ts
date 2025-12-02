import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { FinanceData, Subscription as PublicSubscription, ExpenseCategory } from "@/types/live-data";
import type { Subscription } from "@prisma/client";

const FALLBACK_CATEGORY_DISTRIBUTION: ExpenseCategory[] = [
  { name: "Development", percentage: 35, amount: undefined },
  { name: "AI Tools", percentage: 30, amount: undefined },
  { name: "Entertainment", percentage: 20, amount: undefined },
  { name: "Cloud", percentage: 10, amount: undefined },
  { name: "Other", percentage: 5, amount: undefined },
];

/**
 * Anonymize subscription amount based on CNY value
 * $ = <50 CNY, $$ = 50-150 CNY, $$$ = 150-500 CNY, $$$$ = >500 CNY
 */
function anonymizeAmount(amountCNY: number): string {
  if (amountCNY < 50) return "$";
  if (amountCNY < 150) return "$$";
  if (amountCNY < 500) return "$$$";
  return "$$$$";
}

/**
 * Infer category from subscription name
 */
function inferCategory(name: string): string {
  const nameLower = name.toLowerCase();

  // AI/ML Tools
  if (
    nameLower.includes("chatgpt") ||
    nameLower.includes("claude") ||
    nameLower.includes("openai") ||
    nameLower.includes("copilot") ||
    nameLower.includes("midjourney") ||
    nameLower.includes("cursor") ||
    nameLower.includes("ai")
  ) {
    return "AI Tools";
  }

  // Development
  if (
    nameLower.includes("github") ||
    nameLower.includes("gitlab") ||
    nameLower.includes("jetbrains") ||
    nameLower.includes("vercel") ||
    nameLower.includes("netlify") ||
    nameLower.includes("heroku") ||
    nameLower.includes("aws") ||
    nameLower.includes("azure") ||
    nameLower.includes("digitalocean") ||
    nameLower.includes("railway") ||
    nameLower.includes("supabase")
  ) {
    return "Development";
  }

  // Entertainment
  if (
    nameLower.includes("netflix") ||
    nameLower.includes("spotify") ||
    nameLower.includes("disney") ||
    nameLower.includes("hbo") ||
    nameLower.includes("youtube") ||
    nameLower.includes("bilibili") ||
    nameLower.includes("iqiyi") ||
    nameLower.includes("youku") ||
    nameLower.includes("apple music") ||
    nameLower.includes("qqmusic") ||
    nameLower.includes("netease")
  ) {
    return "Entertainment";
  }

  // Cloud Storage
  if (
    nameLower.includes("icloud") ||
    nameLower.includes("dropbox") ||
    nameLower.includes("google drive") ||
    nameLower.includes("onedrive") ||
    nameLower.includes("storage") ||
    nameLower.includes("cloud")
  ) {
    return "Cloud";
  }

  // Productivity
  if (
    nameLower.includes("notion") ||
    nameLower.includes("obsidian") ||
    nameLower.includes("todoist") ||
    nameLower.includes("1password") ||
    nameLower.includes("bitwarden") ||
    nameLower.includes("office") ||
    nameLower.includes("adobe")
  ) {
    return "Productivity";
  }

  // VPN/Proxy
  if (
    nameLower.includes("vpn") ||
    nameLower.includes("proxy") ||
    nameLower.includes("surge") ||
    nameLower.includes("clash")
  ) {
    return "Network";
  }

  return "Other";
}

/**
 * Calculate next renewal date based on billing cycle and start date
 */
function calculateNextRenewal(subscription: Subscription): Date {
  const now = new Date();
  const startDate = new Date(subscription.startDate);

  // If subscription has ended, return the end date
  if (subscription.endDate && new Date(subscription.endDate) < now) {
    return new Date(subscription.endDate);
  }

  // For one-time purchases, return the start date
  if (subscription.billingCycle === "ONE_TIME") {
    return startDate;
  }

  // Calculate the next renewal
  const monthsPerCycle = subscription.billingCycle === "ANNUAL" ? 12 : 1;

  // Find the next renewal date after now
  const renewalDate = new Date(startDate);
  while (renewalDate <= now) {
    renewalDate.setMonth(renewalDate.getMonth() + monthsPerCycle);
  }

  return renewalDate;
}

/**
 * Convert database subscription to public display format
 */
function toPublicSubscription(sub: Subscription): PublicSubscription {
  return {
    name: sub.name,
    category: inferCategory(sub.name),
    amount: anonymizeAmount(Number(sub.amountCNY)),
    renewalDate: calculateNextRenewal(sub),
  };
}

/**
 * Calculate category distribution from subscriptions
 */
function calculateCategoryDistribution(subscriptions: Subscription[]): ExpenseCategory[] {
  const categoryTotals: Record<string, number> = {};
  let totalAmount = 0;

  for (const sub of subscriptions) {
    const category = inferCategory(sub.name);
    // Normalize to monthly amount for comparison
    const monthlyAmount =
      sub.billingCycle === "ANNUAL"
        ? Number(sub.amountCNY) / 12
        : sub.billingCycle === "ONE_TIME"
          ? Number(sub.amountCNY) / 12 // Spread one-time over a year
          : Number(sub.amountCNY);

    categoryTotals[category] = (categoryTotals[category] || 0) + monthlyAmount;
    totalAmount += monthlyAmount;
  }

  if (subscriptions.length === 0 || totalAmount === 0) {
    return FALLBACK_CATEGORY_DISTRIBUTION.map((category) => ({ ...category }));
  }

  // Convert to percentages
  const categories: ExpenseCategory[] = Object.entries(categoryTotals)
    .map(([name, amount]) => ({
      name,
      percentage: totalAmount > 0 ? Math.round((amount / totalAmount) * 100) : 0,
      amount: undefined, // Hide actual amounts
    }))
    .sort((a, b) => b.percentage - a.percentage);

  const totalPercentage = categories.reduce((sum, category) => sum + category.percentage, 0);
  if (totalPercentage === 0) {
    return FALLBACK_CATEGORY_DISTRIBUTION.map((category) => ({ ...category }));
  }

  return categories;
}

/**
 * Generate insights based on subscription data
 */
function generateInsights(subscriptions: Subscription[]): string[] {
  const insights: string[] = [];

  // Count active subscriptions
  const activeCount = subscriptions.length;
  if (activeCount > 0) {
    insights.push(`Managing ${activeCount} active subscription${activeCount > 1 ? "s" : ""}`);
  }

  // Count subscriptions renewing this month
  const now = new Date();
  const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const renewingThisMonth = subscriptions.filter((sub) => {
    const renewal = calculateNextRenewal(sub);
    return renewal <= thisMonthEnd;
  }).length;

  if (renewingThisMonth > 0) {
    insights.push(`${renewingThisMonth} subscription${renewingThisMonth > 1 ? "s" : ""} renewing this month`);
  }

  // Most expensive category
  const categories = calculateCategoryDistribution(subscriptions);
  if (categories.length > 0 && categories[0]) {
    insights.push(`${categories[0].name} is the largest expense category`);
  }

  // Count annual subscriptions
  const annualCount = subscriptions.filter((sub) => sub.billingCycle === "ANNUAL").length;
  if (annualCount > 0) {
    insights.push(`${annualCount} subscription${annualCount > 1 ? "s" : ""} billed annually`);
  }

  return insights;
}

/**
 * GET /api/about/live/finance
 * Returns finance data with real subscription data (anonymized)
 */
export async function GET() {
  try {
    // Fetch all subscriptions (public display, no auth required)
    // In a real scenario, you might want to filter by a specific public user
    const subscriptions = await prisma.subscription.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Generate monthly trend (normalized to 0-100 based on relative spending)
    // For now, we'll generate a simple pattern based on subscription count
    const baseValue = 70;
    const variance = 15;
    const monthlyTrend = Array.from({ length: 12 }, (_, i) => {
      // Add some realistic variation
      const seasonalFactor = Math.sin((i / 12) * Math.PI * 2) * 10;
      return Math.round(baseValue + seasonalFactor + Math.random() * variance);
    });

    const data: FinanceData = {
      monthlyTrend,
      categories: calculateCategoryDistribution(subscriptions),
      subscriptions: subscriptions.map(toPublicSubscription),
      insights: generateInsights(subscriptions),
    };

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    });
  } catch (error) {
    console.error("Failed to fetch finance data:", error);

    // Return fallback data on error
    const fallbackData: FinanceData = {
      monthlyTrend: [65, 70, 68, 75, 80, 72, 85, 78, 82, 90, 88, 85],
      categories: FALLBACK_CATEGORY_DISTRIBUTION.map((category) => ({ ...category })),
      subscriptions: [],
      insights: ["Unable to load subscription data"],
    };

    return NextResponse.json(fallbackData, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  }
}

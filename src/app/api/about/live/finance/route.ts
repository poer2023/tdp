import { NextResponse } from "next/server";
import type { FinanceData } from "@/types/live-data";

/**
 * GET /api/about/live/finance
 * Returns finance data (fully anonymized - no real amounts)
 */
export async function GET() {
  // TODO: Replace with real finance tracking data (anonymized)
  // All monetary values are normalized or hidden for privacy
  const data: FinanceData = {
    // Last 12 months trend (normalized to 0-100%)
    monthlyTrend: [65, 70, 68, 75, 80, 72, 85, 78, 82, 90, 88, 85],
    categories: [
      { name: "Housing", percentage: 35, amount: undefined },
      { name: "Food & Dining", percentage: 25, amount: undefined },
      { name: "Transportation", percentage: 15, amount: undefined },
      { name: "Entertainment", percentage: 10, amount: undefined },
      { name: "Utilities", percentage: 8, amount: undefined },
      { name: "Other", percentage: 7, amount: undefined },
    ],
    subscriptions: [
      {
        name: "Netflix",
        category: "Entertainment",
        amount: "$$$",
        renewalDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      },
      {
        name: "Spotify",
        category: "Entertainment",
        amount: "$$",
        renewalDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      },
      {
        name: "GitHub Pro",
        category: "Development",
        amount: "$",
        renewalDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      },
      {
        name: "ChatGPT Plus",
        category: "AI Tools",
        amount: "$$$",
        renewalDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      },
      {
        name: "iCloud Storage",
        category: "Cloud",
        amount: "$",
        renewalDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      },
    ],
    insights: [
      "Spending increased 5% compared to last month",
      "Entertainment spending is 15% below average",
      "5 subscriptions renewing this month",
      "Transportation costs decreased 10% this quarter",
    ],
  };

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
    },
  });
}

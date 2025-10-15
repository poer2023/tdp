import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { convertToCNY } from "@/lib/subscriptions";
import { SUPPORTED_CURRENCIES } from "@/lib/subscription-shared";
import { SubscriptionBillingCycle } from "@prisma/client";
import type { Subscription } from "@prisma/client";
import type { SupportedCurrency } from "@/lib/subscription-shared";

function serializeSubscription(subscription: Subscription) {
  return {
    id: subscription.id,
    userId: subscription.userId,
    name: subscription.name,
    currency: subscription.currency,
    amount: Number(subscription.amount),
    amountCNY: Number(subscription.amountCNY),
    billingCycle: subscription.billingCycle as SubscriptionBillingCycle,
    startDate: subscription.startDate.toISOString(),
    endDate: subscription.endDate ? subscription.endDate.toISOString() : null,
    notes: subscription.notes ?? "",
    originalRateToCNY: subscription.originalRateToCNY
      ? Number(subscription.originalRateToCNY)
      : null,
    createdAt: subscription.createdAt.toISOString(),
    updatedAt: subscription.updatedAt.toISOString(),
  };
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscriptions = await prisma.subscription.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    subscriptions: subscriptions.map(serializeSubscription),
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, currency, amount, billingCycle, startDate, endDate, notes = "" } = body ?? {};

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const normalizedCurrency = typeof currency === "string" ? currency.toUpperCase() : "CNY";
  if (!SUPPORTED_CURRENCIES.includes(normalizedCurrency)) {
    return NextResponse.json({ error: "Unsupported currency" }, { status: 400 });
  }

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return NextResponse.json({ error: "Amount must be greater than zero" }, { status: 400 });
  }

  if (!startDate) {
    return NextResponse.json({ error: "Start date is required" }, { status: 400 });
  }

  let parsedStartDate: Date;
  let parsedEndDate: Date | null = null;

  try {
    parsedStartDate = new Date(startDate);
    if (Number.isNaN(parsedStartDate.getTime())) {
      throw new Error("Invalid start date");
    }
    if (endDate) {
      parsedEndDate = new Date(endDate);
      if (Number.isNaN(parsedEndDate.getTime())) {
        throw new Error("Invalid end date");
      }
    }
  } catch (_error) {
    return NextResponse.json({ error: "Invalid dates provided" }, { status: 400 });
  }

  const cycleValues = Object.values(SubscriptionBillingCycle);
  const normalizedCycle = cycleValues.includes(billingCycle)
    ? billingCycle
    : SubscriptionBillingCycle.MONTHLY;

  const { convertedAmount, rate } = await convertToCNY(
    numericAmount,
    normalizedCurrency as SupportedCurrency
  );

  const subscription = await prisma.subscription.create({
    data: {
      userId: session.user.id,
      name: name.trim(),
      currency: normalizedCurrency,
      amount: numericAmount,
      amountCNY: convertedAmount,
      billingCycle: normalizedCycle,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      notes: typeof notes === "string" ? notes.trim() : "",
      originalRateToCNY: rate,
    },
  });

  return NextResponse.json({ subscription: serializeSubscription(subscription) });
}

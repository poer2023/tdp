import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { convertToCNY } from "@/lib/subscriptions";
import { isSupportedCurrency } from "@/lib/subscription-shared";
import { SubscriptionBillingCycle } from "@prisma/client";
import type { Subscription } from "@prisma/client";

function toIsoString(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function serializeSubscription(subscription: Subscription) {
  return {
    id: subscription.id,
    userId: subscription.userId,
    name: subscription.name,
    currency: subscription.currency,
    amount: Number(subscription.amount ?? 0),
    amountCNY: Number(subscription.amountCNY ?? 0),
    billingCycle: subscription.billingCycle as SubscriptionBillingCycle,
    startDate: toIsoString(subscription.startDate) ?? new Date(0).toISOString(),
    endDate: toIsoString(subscription.endDate),
    notes: subscription.notes ?? "",
    originalRateToCNY: subscription.originalRateToCNY
      ? Number(subscription.originalRateToCNY)
      : null,
    createdAt: toIsoString(subscription.createdAt) ?? new Date(0).toISOString(),
    updatedAt: toIsoString(subscription.updatedAt) ?? new Date().toISOString(),
  };
}

export async function GET() {
  try {
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
  } catch (error) {
    console.error("Failed to fetch subscriptions:", error);
    return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch (_error) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }
    const payload =
      typeof body === "object" && body !== null
        ? (body as {
            name?: unknown;
            currency?: unknown;
            amount?: unknown;
            billingCycle?: unknown;
            startDate?: unknown;
            endDate?: unknown;
            notes?: unknown;
          })
        : {};
    const { name, currency, amount, billingCycle, startDate, endDate, notes = "" } = payload;

    if (typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const normalizedCurrency = typeof currency === "string" ? currency.toUpperCase() : "CNY";
    if (!isSupportedCurrency(normalizedCurrency)) {
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
    if (typeof startDate !== "string" && !(startDate instanceof Date)) {
      return NextResponse.json({ error: "Invalid dates provided" }, { status: 400 });
    }

    try {
      parsedStartDate = new Date(startDate);
      if (Number.isNaN(parsedStartDate.getTime())) {
        throw new Error("Invalid start date");
      }
      if (endDate) {
        if (typeof endDate !== "string" && !(endDate instanceof Date)) {
          throw new Error("Invalid end date");
        }
        parsedEndDate = new Date(endDate);
        if (Number.isNaN(parsedEndDate.getTime())) {
          throw new Error("Invalid end date");
        }
      }
    } catch (_error) {
      return NextResponse.json({ error: "Invalid dates provided" }, { status: 400 });
    }

    const cycleValues = Object.values(SubscriptionBillingCycle);
    if (typeof billingCycle !== "string") {
      return NextResponse.json({ error: "Invalid billing cycle" }, { status: 400 });
    }
    const normalizedCycle = cycleValues.includes(billingCycle as SubscriptionBillingCycle)
      ? (billingCycle as SubscriptionBillingCycle)
      : null;
    if (!normalizedCycle) {
      return NextResponse.json({ error: "Invalid billing cycle" }, { status: 400 });
    }

    const { convertedAmount, rate } = await convertToCNY(numericAmount, normalizedCurrency);

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

    return NextResponse.json(
      { subscription: serializeSubscription(subscription) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create subscription:", error);
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
  }
}

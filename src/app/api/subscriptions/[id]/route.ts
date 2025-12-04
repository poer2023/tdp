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

function serialize(subscription: Subscription) {
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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let existing: Subscription | null;
  try {
    existing = await prisma.subscription.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error("Failed to fetch subscription before update:", error);
    return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 });
  }

  if (!existing) {
    return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
  }

  if (existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { name, currency, amount, billingCycle, startDate, endDate, notes = "" } = body ?? {};

  if (!name || typeof name !== "string" || name.trim().length === 0) {
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

  try {
    const { convertedAmount, rate } = await convertToCNY(numericAmount, normalizedCurrency);

    const updated = await prisma.subscription.update({
      where: { id },
      data: {
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

    return NextResponse.json({ subscription: serialize(updated) });
  } catch (error) {
    console.error("Failed to update subscription:", error);
    return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let existing: Subscription | null;
  try {
    existing = await prisma.subscription.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error("Failed to fetch subscription before delete:", error);
    return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 });
  }

  if (!existing) {
    return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
  }

  if (existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await prisma.subscription.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Subscription deleted successfully" });
  } catch (error) {
    console.error("Failed to delete subscription:", error);
    return NextResponse.json({ error: "Failed to delete subscription" }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    if (subscription.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ subscription: serialize(subscription) });
  } catch (error) {
    console.error("Failed to fetch subscription:", error);
    return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 });
  }
}

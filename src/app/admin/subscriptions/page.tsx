import { redirect } from "next/navigation";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { getAdminLocale } from "@/lib/admin-i18n";
import SubscriptionDashboard from "./subscription-dashboard";

type BillingCycle = "MONTHLY" | "ANNUAL" | "ONE_TIME";

type SerializedSubscription = {
  id: string;
  userId: string;
  name: string;
  currency: string;
  amount: number;
  amountCNY: number;
  billingCycle: BillingCycle;
  startDate: string;
  endDate: string | null;
  notes: string;
  originalRateToCNY: number | null;
  createdAt: string;
  updatedAt: string;
};

export const revalidate = 0;

export default async function AdminSubscriptionsPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (!session.user?.id) {
    redirect("/admin");
  }

  const [locale, subscriptions] = await Promise.all([
    getAdminLocale(),
    prisma.subscription.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const toIsoString = (value: Date | string | null | undefined) => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  };

  const serialized: SerializedSubscription[] = subscriptions.map((subscription) => ({
    id: subscription.id,
    userId: subscription.userId,
    name: subscription.name,
    currency: subscription.currency,
    amount: Number(subscription.amount ?? 0),
    amountCNY: Number(subscription.amountCNY ?? 0),
    billingCycle: subscription.billingCycle as BillingCycle,
    startDate: toIsoString(subscription.startDate) ?? new Date(0).toISOString(),
    endDate: toIsoString(subscription.endDate),
    notes: subscription.notes ?? "",
    originalRateToCNY: subscription.originalRateToCNY
      ? Number(subscription.originalRateToCNY)
      : null,
    createdAt: toIsoString(subscription.createdAt) ?? new Date(0).toISOString(),
    updatedAt: toIsoString(subscription.updatedAt) ?? new Date().toISOString(),
  }));

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in pb-12">
      <SubscriptionDashboard locale={locale} initialSubscriptions={serialized} />
    </div>
  );
}

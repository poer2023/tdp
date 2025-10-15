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

  const serialized: SerializedSubscription[] = subscriptions.map((subscription) => ({
    id: subscription.id,
    userId: subscription.userId,
    name: subscription.name,
    currency: subscription.currency,
    amount: Number(subscription.amount),
    amountCNY: Number(subscription.amountCNY),
    billingCycle: subscription.billingCycle as BillingCycle,
    startDate: subscription.startDate.toISOString(),
    endDate: subscription.endDate ? subscription.endDate.toISOString() : null,
    notes: subscription.notes ?? "",
    originalRateToCNY: subscription.originalRateToCNY
      ? Number(subscription.originalRateToCNY)
      : null,
    createdAt: subscription.createdAt.toISOString(),
    updatedAt: subscription.updatedAt.toISOString(),
  }));

  return <SubscriptionDashboard locale={locale} initialSubscriptions={serialized} />;
}

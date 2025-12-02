import { getAdminLocale } from "@/lib/admin-locale";
import { SubscriptionForm } from "@/components/subscriptions/subscription-form";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditSubscriptionPage({ params }: PageProps) {
  const { id } = await params;
  const locale = getAdminLocale();

  const subscription = await prisma.subscription.findUnique({
    where: { id },
  });

  if (!subscription) {
    notFound();
  }

  const initialData = {
    id: subscription.id,
    name: subscription.name,
    currency: subscription.currency,
    amount: subscription.amount.toString(),
    billingCycle: subscription.billingCycle,
    startDate: subscription.startDate.toISOString().split("T")[0] || "",
    endDate: subscription.endDate ? subscription.endDate.toISOString().split("T")[0] || "" : "",
    notes: subscription.notes || "",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
        <Link href="/admin" className="hover:text-stone-900 dark:hover:text-stone-100">
          Admin
        </Link>
        <span>/</span>
        <Link href="/admin/subscriptions" className="hover:text-stone-900 dark:hover:text-stone-100">
          Subscriptions
        </Link>
        <span>/</span>
        <span className="text-stone-900 dark:text-stone-100">Edit</span>
      </div>

      <SubscriptionForm locale={locale} initialData={initialData} />
    </div>
  );
}

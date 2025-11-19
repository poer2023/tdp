import { getAdminLocale } from "@/lib/admin-locale";
import { SubscriptionForm } from "@/components/subscriptions/subscription-form";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Surface } from "@/components/ui-heroui";

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
      <Surface
        variant="flat"
        className="rounded-3xl border border-zinc-200 bg-white/80 p-6 dark:border-zinc-800 dark:bg-zinc-900/80"
      >
        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <Link href="/admin" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            Admin
          </Link>
          <span>/</span>
          <Link href="/admin/subscriptions" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            Subscriptions
          </Link>
          <span>/</span>
          <span className="text-zinc-900 dark:text-zinc-100">Edit</span>
        </div>
      </Surface>

      <SubscriptionForm locale={locale} initialData={initialData} />
    </div>
  );
}

import { getAdminLocale } from "@/lib/admin-locale";
import { SubscriptionForm } from "@/components/subscriptions/subscription-form";
import Link from "next/link";

export default async function NewSubscriptionPage() {
  const locale = getAdminLocale();

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
        <span className="text-stone-900 dark:text-stone-100">New</span>
      </div>

      <SubscriptionForm locale={locale} />
    </div>
  );
}

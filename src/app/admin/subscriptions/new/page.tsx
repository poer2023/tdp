import { getAdminLocale } from "@/lib/admin-locale";
import { SubscriptionForm } from "@/components/subscriptions/subscription-form";
import Link from "next/link";
import { Surface } from "@/components/ui-heroui";

export default async function NewSubscriptionPage() {
  const locale = getAdminLocale();

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
          <span className="text-zinc-900 dark:text-zinc-100">New</span>
        </div>
      </Surface>

      <SubscriptionForm locale={locale} />
    </div>
  );
}

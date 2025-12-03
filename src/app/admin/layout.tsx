import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAdminLocale } from "@/lib/admin-i18n";
import { t } from "@/lib/admin-translations";
import { AdminFrame } from "@/components/admin/admin-frame";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const locale = await getAdminLocale();

  // Only ADMIN users can access admin pages
  if (session.user?.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 dark:bg-stone-950">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-stone-900 dark:text-stone-100">403</h1>
          <p className="mt-2 text-stone-600 dark:text-stone-400">{t(locale, "forbidden")}</p>
          <Link
            href="/"
            className="mt-4 inline-block text-sage-600 hover:underline dark:text-sage-400"
          >
            {t(locale, "returnToHome")}
          </Link>
        </div>
      </div>
    );
  }

  return <AdminFrame locale={locale}>{children}</AdminFrame>;
}

import AdminShell from '@/components/admin/zhi/AdminShell';
import AdminOverviewContent from "@/components/admin/zhi/AdminOverviewContent";
import { SettingsProvider, DataProvider } from '@/components/admin/zhi/store';
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await auth();

  // Defensive check - layout should handle this, but just in case
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }

  const user = {
    username: session.user.name ?? session.user.email ?? "Admin",
    email: session.user.email ?? "",
    role: session.user.role,
    image: session.user.image ?? undefined,
  };

  return (
    <SettingsProvider>
      <DataProvider>
        <AdminShell user={user} pageTitle="Overview" pageDescription="Manage your content and settings">
          <AdminOverviewContent />
        </AdminShell>
      </DataProvider>
    </SettingsProvider>
  );
}

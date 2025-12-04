import AdminDashboard from '@/components/admin/lumina/AdminDashboard';
import { SettingsProvider, DataProvider } from '@/components/admin/lumina/store';
import { auth } from "@/auth";

export default async function AdminPage() {
  const session = await auth();

  // Layout已验证session，这里使用!断言安全
  return (
    <SettingsProvider>
      <DataProvider>
        <AdminDashboard
          user={{
            username: session!.user.name ?? session!.user.email ?? "Admin",
            email: session!.user.email ?? "",
            role: session!.user.role
          }}
        />
      </DataProvider>
    </SettingsProvider>
  );
}

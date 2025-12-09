import { auth } from "@/auth";
import AdminShell from "@/components/admin/zhi/AdminShell";
import ProfilePage from "@/components/admin/zhi/ProfilePage";
import { DataProvider, SettingsProvider } from "@/components/admin/zhi/store";

export default async function ProfileRoutePage() {
  const session = await auth();

  const user = {
    username: session!.user.name ?? session!.user.email ?? "Admin",
    email: session!.user.email ?? "",
    role: session!.user.role,
    image: session!.user.image ?? undefined,
  };

  return (
    <SettingsProvider>
      <DataProvider>
        <AdminShell user={user} pageTitle="Profile" pageDescription="Manage profile and avatar">
          <ProfilePage user={user} />
        </AdminShell>
      </DataProvider>
    </SettingsProvider>
  );
}


import { auth } from "@/auth";
import { SettingsProvider, DataProvider } from '@/components/admin/lumina/store';
import AdminShell from '@/components/admin/lumina/AdminShell';
import FriendsSection from '@/components/admin/lumina/FriendsSection';

export default async function FriendsPage() {
    const session = await auth();

    return (
        <SettingsProvider>
            <DataProvider>
                <AdminShell
                    user={{
                        username: session!.user.name ?? session!.user.email ?? "Admin",
                        email: session!.user.email ?? "",
                        role: session!.user.role
                    }}
                    pageTitle="Friends & Access"
                    pageDescription="Manage friend access codes and permissions"
                >
                    <FriendsSection />
                </AdminShell>
            </DataProvider>
        </SettingsProvider>
    );
}

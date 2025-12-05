import { auth } from "@/auth";
import { SettingsProvider, DataProvider } from '@/components/admin/lumina/store';
import AdminShell from '@/components/admin/lumina/AdminShell';
import CredentialsSection from '@/components/admin/lumina/CredentialsSection';

export default async function CredentialsPage() {
    const session = await auth();

    return (
        <SettingsProvider>
            <DataProvider>
                <AdminShell
                    user={{
                        username: session!.user.name ?? session!.user.email ?? "Admin",
                        email: session!.user.email ?? "",
                        role: session!.user.role,
                        image: session!.user.image ?? undefined,
                    }}
                    pageTitle="Credentials & Sync"
                    pageDescription="Manage API credentials and sync settings"
                >
                    <CredentialsSection />
                </AdminShell>
            </DataProvider>
        </SettingsProvider>
    );
}

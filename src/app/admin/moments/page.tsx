import { auth } from "@/auth";
import { SettingsProvider, DataProvider } from '@/components/admin/lumina/store';
import AdminShell from '@/components/admin/lumina/AdminShell';
import MomentsSection from '@/components/admin/lumina/MomentsSection';

export default async function MomentsPage() {
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
                    pageTitle="Moments"
                    pageDescription="Manage your moments and quick updates"
                >
                    <MomentsSection />
                </AdminShell>
            </DataProvider>
        </SettingsProvider>
    );
}

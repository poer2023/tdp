import { auth } from "@/auth";
import { SettingsProvider, DataProvider } from '@/components/admin/zhi/store';
import AdminShell from '@/components/admin/zhi/AdminShell';
import MomentsSection from '@/components/admin/zhi/MomentsSection';

export default async function MomentsPage() {
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
                    pageTitle="Moments"
                    pageDescription="Manage your moments and quick updates"
                >
                    <MomentsSection />
                </AdminShell>
            </DataProvider>
        </SettingsProvider>
    );
}

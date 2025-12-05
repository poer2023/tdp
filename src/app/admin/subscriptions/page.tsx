import { auth } from "@/auth";
import { SettingsProvider, DataProvider } from '@/components/admin/lumina/store';
import AdminShell from '@/components/admin/lumina/AdminShell';
import SubscriptionsSection from '@/components/admin/lumina/SubscriptionsSection';

export default async function SubscriptionsPage() {
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
                    pageTitle="Subscriptions"
                    pageDescription="Manage your service subscriptions"
                >
                    <SubscriptionsSection />
                </AdminShell>
            </DataProvider>
        </SettingsProvider>
    );
}

import { auth } from "@/auth";
import { SettingsProvider, DataProvider } from '@/components/admin/lumina/store';
import AdminShell from '@/components/admin/lumina/AdminShell';
import AnalyticsSection from '@/components/admin/lumina/AnalyticsSection';

export default async function AnalyticsPage() {
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
                    pageTitle="Analytics"
                    pageDescription="View site analytics and traffic statistics"
                >
                    <AnalyticsSection />
                </AdminShell>
            </DataProvider>
        </SettingsProvider>
    );
}

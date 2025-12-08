import { auth } from "@/auth";
import { SettingsProvider, DataProvider } from '@/components/admin/zhi/store';
import AdminShell from '@/components/admin/zhi/AdminShell';
import ArticlesSection from '@/components/admin/zhi/ArticlesSection';

export default async function ArticlesPage() {
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
                    pageTitle="Posts"
                    pageDescription="Manage your content and settings"
                >
                    <ArticlesSection />
                </AdminShell>
            </DataProvider>
        </SettingsProvider>
    );
}

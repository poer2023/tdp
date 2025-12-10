import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SettingsProvider, DataProvider } from '@/components/admin/zhi/store';
import AdminShell from '@/components/admin/zhi/AdminShell';
import StorageSection from '@/components/admin/zhi/StorageSection';

export default async function StorageManagementPage() {
    const session = await auth();

    // Defensive check - layout should handle this, but just in case
    if (!session?.user) {
        redirect("/login?callbackUrl=/admin/storage");
    }

    return (
        <SettingsProvider>
            <DataProvider>
                <AdminShell
                    user={{
                        username: session.user.name ?? session.user.email ?? "Admin",
                        email: session.user.email ?? "",
                        role: session.user.role,
                        image: session.user.image ?? undefined,
                    }}
                    pageTitle="Storage"
                    pageDescription="Manage file storage and R2/S3 configuration"
                >
                    <StorageSection />
                </AdminShell>
            </DataProvider>
        </SettingsProvider>
    );
}

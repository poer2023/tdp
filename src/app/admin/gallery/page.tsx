import { auth } from "@/auth";
import { SettingsProvider, DataProvider } from '@/components/admin/zhi/store';
import AdminShell from '@/components/admin/zhi/AdminShell';
import GallerySection from '@/components/admin/zhi/GallerySection';

export default async function GalleryPage() {
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
                    pageTitle="Gallery"
                    pageDescription="Manage your media gallery"
                >
                    <GallerySection />
                </AdminShell>
            </DataProvider>
        </SettingsProvider>
    );
}

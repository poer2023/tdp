import { auth } from "@/auth";
import { SettingsProvider, DataProvider } from '@/components/admin/zhi/store';
import AdminShell from '@/components/admin/zhi/AdminShell';
import HeroSection from '@/components/admin/zhi/HeroSection';

export default async function HeroPage() {
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
                    pageTitle="Hero Images"
                    pageDescription="Manage hero image shuffle grid"
                >
                    <HeroSection />
                </AdminShell>
            </DataProvider>
        </SettingsProvider>
    );
}

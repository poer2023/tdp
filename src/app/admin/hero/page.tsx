import { auth } from "@/auth";
import { SettingsProvider, DataProvider } from '@/components/admin/lumina/store';
import AdminShell from '@/components/admin/lumina/AdminShell';
import HeroSection from '@/components/admin/lumina/HeroSection';

export default async function HeroPage() {
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
                    pageTitle="Hero Images"
                    pageDescription="Manage hero image shuffle grid"
                >
                    <HeroSection />
                </AdminShell>
            </DataProvider>
        </SettingsProvider>
    );
}

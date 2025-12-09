import { auth } from "@/auth";
import { SettingsProvider, DataProvider } from '@/components/admin/zhi/store';
import AdminShell from '@/components/admin/zhi/AdminShell';
import ProjectsSection from '@/components/admin/zhi/ProjectsSection';

export default async function ProjectsPage() {
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
                    pageTitle="Projects"
                    pageDescription="Manage your projects and work"
                >
                    <ProjectsSection />
                </AdminShell>
            </DataProvider>
        </SettingsProvider>
    );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-white dark:bg-zinc-950">
      {/* Left Sidebar Navigation */}
      <AdminNav />

      {/* Main Content Area */}
      <div className="flex-1">
        <main className="mx-auto max-w-[1200px] px-6 py-10 md:px-8 md:py-16">
          {children}
        </main>
      </div>
    </div>
  );
}

// Admin routes require real-time auth check, no caching
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // 检查用户是否已登录
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }

  // 检查用户是否有ADMIN角色
  if (session.user.role !== UserRole.ADMIN) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-black">
      {children}
    </div>
  );
}

import type { ReactNode } from "react";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";

export default async function AdminExportLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  if (session.user.role !== UserRole.ADMIN) {
    throw new Response("Forbidden", { status: 403 });
  }

  return <>{children}</>;
}

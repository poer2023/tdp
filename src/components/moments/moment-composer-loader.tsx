"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

// Lazy load composer only for admins to avoid hydrating heavy UI for everyone
const LazyComposer = dynamic(
  () => import("./moment-composer").then((mod) => mod.MomentComposerBottomSheet),
  { ssr: false }
);

export function MomentComposerLoader() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Hide on admin routes or while loading
  if (pathname?.startsWith("/admin")) return null;
  if (status === "loading") return null;

  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "ADMIN";
  if (!isAdmin) return null;

  return <LazyComposer />;
}

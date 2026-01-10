"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Lazy load composer only for admins to avoid hydrating heavy UI for everyone
const LazyComposer = dynamic(
  () => import("./moment-composer").then((mod) => mod.MomentComposerBottomSheet),
  { ssr: false }
);

/**
 * MomentComposerLoader - checks admin status via API instead of useSession
 * This allows the component to work without SessionProvider in public pages.
 */
export function MomentComposerLoader() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checked, setChecked] = useState(false);

  // Check admin status via API on mount
  useEffect(() => {
    // Skip on admin routes
    if (pathname?.startsWith("/admin")) {
      setChecked(true);
      return;
    }

    // Check if user is admin via a lightweight API call
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data?.user?.role === "ADMIN") {
          setIsAdmin(true);
        }
      })
      .catch(() => {
        // Ignore errors - just don't show composer
      })
      .finally(() => {
        setChecked(true);
      });
  }, [pathname]);

  // Hide on admin routes or while loading
  if (pathname?.startsWith("/admin")) return null;
  if (!checked) return null;
  if (!isAdmin) return null;

  return <LazyComposer />;
}

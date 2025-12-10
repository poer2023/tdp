"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

type Props = {
  children: React.ReactNode;
  session?: Session | null;
};

export function SessionProvider({ children, session }: Props) {
  return (
    // When session is null/undefined, SessionProvider will fetch it from /api/auth/session
    // refetchOnWindowFocus ensures session stays in sync when user returns to tab
    <NextAuthSessionProvider session={session} refetchOnWindowFocus={true}>
      {children}
    </NextAuthSessionProvider>
  );
}

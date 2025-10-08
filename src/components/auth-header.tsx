"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import type { Session } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

export function AuthHeader() {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  type SessionUser = Session["user"];
  const lastKnownUserRef = useRef<SessionUser | null>(session?.user ?? null);

  useEffect(() => {
    if (session?.user) {
      lastKnownUserRef.current = session.user;
    }
  }, [session]);

  // Close menu on Esc key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMenuOpen) {
        setIsMenuOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMenuOpen]);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        !buttonRef.current?.contains(e.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }

    return undefined;
  }, [isMenuOpen]);

  // Handle keyboard navigation in menu
  const handleMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const menuItems = menuRef.current?.querySelectorAll(
        'a[role="menuitem"], button[role="menuitem"]'
      );
      if (!menuItems) return;

      const currentIndex = Array.from(menuItems).indexOf(document.activeElement as HTMLElement);
      const nextIndex =
        e.key === "ArrowDown"
          ? (currentIndex + 1) % menuItems.length
          : (currentIndex - 1 + menuItems.length) % menuItems.length;

      (menuItems[nextIndex] as HTMLElement).focus();
    }
  };

  // Loading state - SSR compatible
  const isLoading = status === "loading";
  const user = session?.user ?? lastKnownUserRef.current ?? null;
  const isSignedIn = Boolean(user);

  // Signed in state
  if (isSignedIn) {
    return (
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={() => setIsMenuOpen(true)}
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          aria-label="User menu"
          data-state={isMenuOpen ? "open" : "closed"}
          className="flex items-center gap-1.5 rounded-full border border-zinc-200 p-0.5 pr-2 transition-colors hover:border-zinc-300 focus:ring-2 focus:ring-zinc-400 focus:outline-none dark:border-zinc-800 dark:hover:border-zinc-700"
        >
          {user?.image ? (
            <Image
              src={user.image}
              alt={user.name || "User"}
              width={28}
              height={28}
              className="rounded-full"
              data-testid="user-avatar"
            />
          ) : (
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              data-testid="user-avatar"
            >
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
          )}
          <span className="hidden text-sm font-medium text-zinc-700 md:inline dark:text-zinc-300">
            {user?.name || "User"}
          </span>
          <svg
            className={`h-3.5 w-3.5 text-zinc-500 transition-transform ${isMenuOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isMenuOpen && (
          <div
            ref={menuRef}
            role="menu"
            aria-orientation="vertical"
            onKeyDown={handleMenuKeyDown}
            className="absolute right-0 mt-2 w-48 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
          >
            <Link
              href="/admin"
              role="menuitem"
              onClick={() => setIsMenuOpen(false)}
              className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 focus:bg-zinc-100 focus:outline-none dark:text-zinc-300 dark:hover:bg-zinc-800 dark:focus:bg-zinc-800"
            >
              📊 Dashboard
            </Link>
            <button
              role="menuitem"
              onClick={() => {
                setIsMenuOpen(false);
                signOut({ callbackUrl: window.location.pathname });
              }}
              className="w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 focus:bg-zinc-100 focus:outline-none dark:text-zinc-300 dark:hover:bg-zinc-800 dark:focus:bg-zinc-800"
            >
              🚪 Sign out
            </button>
          </div>
        )}
      </div>
    );
  }

  // Signed out state
  return (
    <button
      type="button"
      aria-busy={isLoading ? "true" : undefined}
      onClick={() => signIn("google", { callbackUrl: window.location.pathname })}
      className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50 focus:ring-2 focus:ring-zinc-400 focus:outline-none md:text-sm dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
    >
      <svg className="mr-1.5 h-3.5 w-3.5" viewBox="0 0 24 24" focusable="false" aria-hidden="true">
        <path
          d="M23.25 12.27c0-.78-.07-1.53-.21-2.25H12v4.26h6.33c-.27 1.44-1.08 2.66-2.3 3.48v2.88h3.72c2.18-2.01 3.5-4.98 3.5-8.37Z"
          fill="#4285F4"
        />
        <path
          d="M12 24c3.15 0 5.79-1.05 7.72-2.86l-3.72-2.88c-1.03.69-2.35 1.12-3.99 1.12-3.07 0-5.66-2.07-6.58-4.85H1.6v3.05C3.5 21.72 7.43 24 12 24Z"
          fill="#34A853"
        />
        <path
          d="M5.42 14.53a7.01 7.01 0 0 1 0-4.46V7.02H1.6a12 12 0 0 0 0 9.96l3.82-2.45Z"
          fill="#FBBC05"
        />
        <path
          d="M12 4.74c1.72 0 3.26.59 4.47 1.76l3.34-3.34C17.78 1.23 15.15 0 12 0 7.43 0 3.5 2.28 1.6 7.02l3.82 3.05C6.34 6.81 8.93 4.74 12 4.74Z"
          fill="#EA4335"
        />
        <path d="M1.6 7.02v.01-.01Z" fill="none" />
      </svg>
      Sign in
    </button>
  );
}

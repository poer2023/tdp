"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Use native Web Crypto API for fingerprint generation (lighter than crypto-js)
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function AnalyticsTracker({ locale }: { locale: string }) {
  const pathname = usePathname();

  useEffect(() => {
    // Generate browser fingerprint (privacy-friendly, no IP storage)
    const generateFingerprint = async (): Promise<string> => {
      const userAgent = navigator.userAgent;
      const screenResolution = `${screen.width}x${screen.height}`;
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const language = navigator.language;

      const fingerprintData = `${userAgent}|${screenResolution}|${timezone}|${language}`;
      return sha256(fingerprintData);
    };

    const trackPageView = async () => {
      try {
        const fingerprint = await generateFingerprint();
        const referer = document.referrer || "";

        const data = JSON.stringify({
          path: pathname,
          locale,
          fingerprint,
          referer,
        });

        // Use sendBeacon for reliable tracking even on page unload
        if (navigator.sendBeacon) {
          const blob = new Blob([data], { type: "application/json" });
          navigator.sendBeacon("/api/analytics/track", blob);
        } else {
          // Fallback for browsers without sendBeacon
          fetch("/api/analytics/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: data,
            keepalive: true,
          }).catch(() => { }); // Silent failure
        }
      } catch (error) {
        // Silent failure - don't break page functionality

      }
    };

    // Track page view asynchronously
    trackPageView();
  }, [pathname, locale]);

  return null; // No UI, just tracking
}


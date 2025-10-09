"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import crypto from "crypto-js";

export function AnalyticsTracker({ locale }: { locale: string }) {
  const pathname = usePathname();

  useEffect(() => {
    // Generate browser fingerprint (privacy-friendly, no IP storage)
    const generateFingerprint = () => {
      const userAgent = navigator.userAgent;
      const screenResolution = `${screen.width}x${screen.height}`;
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const language = navigator.language;

      const fingerprintData = `${userAgent}|${screenResolution}|${timezone}|${language}`;
      return crypto.SHA256(fingerprintData).toString();
    };

    const trackPageView = async () => {
      try {
        const fingerprint = generateFingerprint();
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
          }).catch(() => {}); // Silent failure
        }
      } catch (error) {
        // Silent failure - don't break page functionality
        console.debug("Analytics tracking failed:", error);
      }
    };

    // Track page view asynchronously
    trackPageView();
  }, [pathname, locale]);

  return null; // No UI, just tracking
}

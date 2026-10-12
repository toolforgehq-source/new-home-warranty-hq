"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

let firstView = true;

export function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const referrer = firstView ? document.referrer || null : null;
    firstView = false;
    fetch("/api/track", {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        referrer,
        utmSource: params.get("utm_source"),
        utmMedium: params.get("utm_medium"),
        utmCampaign: params.get("utm_campaign"),
      }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
